import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    zip: String,
    pincode: String,
    country: String,
    isDefault: {
        type: Boolean,
        default: false
    }
})

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        select: false,
       
    },
    fullName: {
        firstName: {
            type: String,
            required: true,

        },
        lastName: {
            type: String,
            required: true,

        },
    },
        role: {
            type: String,
            enum: ['user', 'seller'],
            default: 'user'
        },

       addresses:[addressSchema]
    

})


const usermodel = mongoose.model('user', UserSchema)

export default usermodel;