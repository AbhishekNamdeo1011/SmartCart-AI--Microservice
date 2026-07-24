import app from './src/app.js';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './src/db/db.js';
import { connect } from './src/broker/broker.js';

connectDB();
connect();
app.listen(3004, () => {
    console.log('Payment service is running on port 3004');
});