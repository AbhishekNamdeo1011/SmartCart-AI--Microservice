import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zip: String,
    pincode: String,
    country: String,
    isDefault: {
        type: Boolean,
        default: false,
    },
});

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: "Product",
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                    required: true,
                },
                price: {
                    amount: {
                        type: Number,
                        required: true,
                    },
                    currency: {
                        type: String,
                        required: true,
                        enum: ["USD", "INR"],
                    },
                },
            },
        ],
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "shipped", "delivered"],
            default: "pending",
        },
        totalPrice: {
            amount: {
                type: Number,
                required: true,
            },
            currency: {
                type: String,
                required: true,
                enum: ["USD", "INR"],
            },
        },
        shippingAddress: {
            type: addressSchema,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("order", orderSchema);

export default Order;
export { Order };