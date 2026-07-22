import express from 'express';
import router from './routes/cart.routes.js';
import cookieParser from 'cookie-parser';
const app =express()

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.status(200).json({ message: "Cart Service is running" });
});
app.use('/api/cart', router);

export default app;