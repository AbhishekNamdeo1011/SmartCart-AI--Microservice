import mongoose from "mongoose"; 

   async function connectToDb(){  

    try {
       await mongoose.connect(process.env.MONGO_URI);
          console.log("DB connected"); 
    } catch (err) {
            console.log("Connection Failed ",err)
    }
}

export default connectToDb;
