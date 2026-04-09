import express from "express";
import productModel from "../models/product.model.js";
import { createProduct } from "../controller/product.controller.js";
import { createAuthMiddleware } from "../middlewares/auth.middlewares.js";
import multer from "multer";
import productValidationRules from "../middlewares/product.validator.js";
import {getProducts,getProductById,updateProduct,deleteProduct,getProductsBySeller} from "../controller/product.controller.js";
const router = express.Router();


const upload = multer({
    storage: multer.memoryStorage(),
})
router.post("/", createAuthMiddleware(['admin', "seller"]),
    upload.array("images", 5),
    productValidationRules,
    createProduct)

router.get("/",getProducts)
router.patch("/:id", createAuthMiddleware([ "seller"]), updateProduct);
router.delete("/:id", createAuthMiddleware([ "seller"]),deleteProduct);
router.get("/seller", createAuthMiddleware([ "seller"]) ,getProductsBySeller);

router.get("/:id", getProductById)
export default router;