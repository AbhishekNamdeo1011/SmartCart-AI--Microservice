import mongoose from "mongoose";

async function connectdb() {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to db");
    }
    catch(err){
        console.log("Error connecting to db:", err);
    }
    
}

export default connectdb;