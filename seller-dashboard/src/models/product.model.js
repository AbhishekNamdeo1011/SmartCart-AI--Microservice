import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,

    },
    price: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: ['USD', 'INR'],
            default: 'INR'
        }

    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    images: [{
        url: String,
        thumbnail: String,
        id: String
    }],
    stock:{
         type: Number,
         default: 0
    }

});
 const productModel = mongoose.model("product", productSchema);

 productSchema.index({ title: 'text', description: 'text' });
 export default productModel;