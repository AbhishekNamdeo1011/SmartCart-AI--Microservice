import app from './src/app.js';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './src/db/db.js';
import listener from './src/broker/listner.js';
import {connect} from './src/broker/broker.js';


connectDB();

connect().then(() => {  
    listener(); 
}); 





app.listen(3007, () => {
    console.log("Seller  Service is running on port 3007");
});


