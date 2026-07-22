import mongoose from "mongoose";


const cartSchema = new mongoose.Schema({
    user :{
        type : mongoose.Schema.Types.ObjectId,
        required : true,
    },
    items : [
        {
            productId : {   
                type : mongoose.Schema.Types.ObjectId,
                required : true,
            },
            quantity : {
                type : Number,
                required : true,
                min :  1,
                default : 0,
            },

        }
    ]
}, { timestamps : true });

const cartModel = mongoose.model("cart", cartSchema);

export default cartModel;