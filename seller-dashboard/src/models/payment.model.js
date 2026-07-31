import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    paymentId: {
        type: String,
    },
    razorpayId: {
        type: String,
        required: true,
    },
    signature: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending',
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
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
            default: 'INR',enum: ['INR', 'USD'],
        },
    },
}, { timestamps: true });

const paymentModel = mongoose.model('payment', paymentSchema);
export default paymentModel;