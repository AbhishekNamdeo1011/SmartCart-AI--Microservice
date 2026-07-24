import paymentModel from "../models/payment.model.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";    
import {publishToQueue} from "../broker/broker.js"

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

    try {
        const orderId = req.params.orderId;
        const orderResponse = await axios.get("http://localhost:3003/api/orders/" + orderId, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const price = orderResponse.data.order.totalPrice;
        const order = await razorpay.orders.create(price)
        const payment = new paymentModel({
            order: orderId,
            razorpayId: order.id,
            user: req.user.id,
            price: {
                 amount: order.amount,
                currency: order.currency
            },
        });
        await payment.save();
 await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED",payment);  
await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", {
    email: req.user.email,
    orderId: orderId,   
    amount: price.amount,
    currency: price.currency,
    username: req.user.username,
});
        return res.status(201).json({ message: "Payment created successfully", payment });

        // Simulate payment processing  

    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(400).json({ message: error.message });
    }
}
async function verifyPayment(req, res) {
    const { razorpayId, paymentId, signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    try {

    const isValid = validatePaymentVerification({ razorpayId, paymentId }, signature, secret);
    if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature" });
    }
    const payment = await paymentModel.findOne({ razorpayId,status: 'PENDING' });
    if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
    }
    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = 'COMPLETED';
    await payment.save();

    await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
        email: req.user.email,
        orderId: payment.order,
        userId: payment.user,
        amount: payment.price.amount,
        currency: payment.price.currency,
    });
   await publishToQueue("PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED",payment);    

    return res.status(200).json({ message: "Payment verified successfully", payment });
  } catch (error) {
    console.log(error);
    await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
        email: req.user.email,
        paymentId:paymentId,
        orderId: razorpayId,   
    });
    res.status(500).send('Error verifying payment');
  }
}

export { createPayment, verifyPayment }