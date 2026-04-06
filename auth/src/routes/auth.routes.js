import express from "express";
import { registerUserValidations } from "../middleware/validator.middleware.js";
import { registerUser } from "../controllers/auth.controller.js";
import { loginUserValidations } from "../middleware/validator.middleware.js";
import { loginUser } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getCurrentUser } from "../controllers/auth.controller.js";
import { logoutUser } from "../controllers/auth.controller.js"
import { getUserAddresses } from "../controllers/auth.controller.js";
import { addUserAddress } from "../controllers/auth.controller.js";
import { deleteUserAddress } from "../controllers/auth.controller.js";
import { addAddressValidations } from "../middleware/validator.middleware.js";
const router = express.Router();

router.post("/register", registerUserValidations, registerUser);
router.post("/login", loginUserValidations, loginUser);
router.get("/me", authMiddleware, getCurrentUser)
router.get("/logout", logoutUser)
router.post("/users/me/addresses", authMiddleware,addAddressValidations, addUserAddress);
router.get("/users/me/addresses", authMiddleware, getUserAddresses);
router.delete("/users/me/addresses/:addressId", authMiddleware, deleteUserAddress);
export default router;