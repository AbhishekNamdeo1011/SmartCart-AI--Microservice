import mongoose from "mongoose";
import axios from "axios";
import { Order } from "../models/order.model.js";

async function createOrder(req, res) {
    const user = req.user;
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    try {
        const cartResponse = await axios.get("http://localhost:3002/api/cart", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const products = await Promise.all(
            cartResponse.data.cart.items.map(async (item) => {
                const response = await axios.get(
                    `http://localhost:3001/api/products/${item.productId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );


                return response.data.product; // ✅ correct
            })
        );


        let priceAmount = 0;
        const orderItems = cartResponse.data.cart.items.map((item) => {
            const product = products.find(
                (p) => p._id === item.productId
            );            //if not in stock t,does not allow to create order
            if (!product || product.stock < item.quantity) {
                throw new Error(`Product ${item.productId} is out of stock`);
            }
            const itemTotal = product.price.amount * item.quantity;
            priceAmount += itemTotal;
            return {
                product: item.productId,
                quantity: item.quantity,
                price: {
                    amount: itemTotal,
                    currency: product.price.currency
                }
            };

        });


        const order = new Order({
            userId: req.user.id,
            items: orderItems,
            totalPrice: {
                amount: priceAmount,
                currency: "INR"
            },
            shippingAddress: {
                street: req.body.shippingAddress.street,
                city: req.body.shippingAddress.city,
                state: req.body.shippingAddress.state,
                pincode: req.body.shippingAddress.pincode,
                country: req.body.shippingAddress.country,
                isDefault: req.body.shippingAddress.isDefault || false,
            }

        });
        await order.save();
await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED",order);

        
        return res.status(201).json({
            message: "Order created successfully",
            order: order
        });

    } catch (error) {
        console.error("Error creating order", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
async function getMyOrders(req, res) {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const orders = await Order.find({ userId: user.id })
        const totalOrders = await Order.countDocuments({ userId: user.id });
        return res.status(200).json({
            orders: orders,
            meta: {
                total: totalOrders,
                page,
                limit,

            }
        });
    } catch (error) {
        console.error("Error fetching orders", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


async function getOrderById(req, res) {
    try {
        const user = req.user;
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.userId.toString() !== user.id && user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: you can only access your own order" });
        }



        return res.status(200).json({ order });
    } catch (error) {
        console.error("Error fetching order", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function cancelOrderById(req, res) {
    try {
        const user = req.user;
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }       

        if (order.userId.toString() !== user.id && user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        if (order.status === "PENDING") {
            return res.status(400).json({ message: "Cannot cancel a pending order" });
        }
        if (order.status === "CANCELLED") {
            return res.status(400).json({ message: "Order is already CANCELLED" });
        }   
        order.status = "CANCELLED";
        await order.save();
        return res.status(200).json({ message: "Order cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling order", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}



async function updateOrderAddress(req, res) {
    try {
        const user = req.user;
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }       

        if (order.userId.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        if (order.status !== "PENDING") {
            return res.status(400).json({ message: "Can only update address for pending orders" });
        }   
        order.shippingAddress = {
            street: req.body.street,
            city: req.body.city,    
            state: req.body.state,
            pincode: req.body.pincode,
            country: req.body.country,  
            isDefault: req.body.isDefault || false,
        };
        await order.save();
        return res.status(200).json({ message: "Shipping address updated successfully" });
    }

        catch (error) { 
        console.error("Error updating shipping address", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}   



export { createOrder, getMyOrders, getOrderById,cancelOrderById,updateOrderAddress };



