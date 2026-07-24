import express from 'express';
import { createAuthMiddleware } from '../middleware/auth.middleware.js';
import {createPayment,verifyPayment} from '../controller/payment.controller.js';
const router = express.Router();


router.post("/create/:orderId", createAuthMiddleware(["user"]), createPayment);
router.post("/verify", createAuthMiddleware(["user"]), verifyPayment);
export default router;

