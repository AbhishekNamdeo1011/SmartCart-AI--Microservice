import app from "./src/app.js";
import dotenv from "dotenv";    
dotenv.config();
import connectDB from "./src/db/db.js";
import {connect} from "./src/broker/broker.js";
connect();
connectDB();



app.listen(3003,()=>{
    console.log("Order Service is running on port 3003");
}); 