import express from 'express';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/product.routes.js';
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/products", productRoutes);
export default app;