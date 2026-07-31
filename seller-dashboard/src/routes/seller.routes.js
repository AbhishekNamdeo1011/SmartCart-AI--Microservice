import express from "express";
import { createAuthMiddleware } from "../middleware/auth.middleware.js";
import { getSellerMetrics, getOrdersForSeller, getProductsForSeller } from "../controller/seller.controller.js";  
const router = express.Router();


router.get("/metrics", createAuthMiddleware(["seller"]), getSellerMetrics);
router.get("/orders", createAuthMiddleware(["seller"]), getOrdersForSeller);
router.get("/products", createAuthMiddleware(["seller"]), getProductsForSeller);
export default router; 