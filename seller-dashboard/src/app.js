import express from 'express';
import router from './routes/seller.routes.js';
import cookieParser from 'cookie-parser';
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.status(200).send("Seller Dashboard Service is running");
});
app.use('/api/seller/dashboard', router);


 

export default app;