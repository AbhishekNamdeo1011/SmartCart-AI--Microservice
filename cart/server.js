import cookieParser from 'cookie-parser';
import app from './src/app.js';
import dotenv from 'dotenv';
import connectdb from './src/db/db.js';
dotenv.config();


connectdb();

app.listen(3002,()=>{
    console.log("Cart service is running on port 3002");
})