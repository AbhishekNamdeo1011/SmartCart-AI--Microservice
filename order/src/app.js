import express from "express";
import cookieParser from "cookie-parser";
import router from "./routes/order.routes.js";
const app =express();
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: "Order Service is running" });
});

app.use("/api/orders",router);
export default app;  
