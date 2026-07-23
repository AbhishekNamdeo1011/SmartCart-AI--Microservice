import express from "express";
import { createOrder, getMyOrders, getOrderById,cancelOrderById,updateOrderAddress} from "../controllers/order.controller.js";
import createAuthMiddleware from "../middleware/auth.middleware.js";  
import { createOrderValidations, updateAddressValidation } from "../middleware/validation.middleware.js";
import { get } from "mongoose";
const router = express.Router();

router.post("/",  createAuthMiddleware(["user"]),createOrderValidations, createOrder);
router.get("/me",  createAuthMiddleware(["user"]), getMyOrders);
router.post("/:id/cancel", createAuthMiddleware(["user"]), cancelOrderById);    
router.get("/:id", createAuthMiddleware(["user", "admin"]), getOrderById);
router.patch("/:id/address", createAuthMiddleware(["user"]),updateAddressValidation, updateOrderAddress);

export default router;