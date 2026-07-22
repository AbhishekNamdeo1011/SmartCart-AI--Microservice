import express from 'express';
import { createAuthMiddleware } from '../middlewares/auth.middleware.js';   
import { addItemToCart, updateCartItem,removeCartItem,clearCart } from '../controllers/cart.controller.js';
import { validateAddItemToCart, validateUpdateCartItem } from '../middlewares/validation.middleware.js';
import { getCart } from '../controllers/cart.controller.js';    

const router = express.Router();

router.post('/items',validateAddItemToCart,createAuthMiddleware(["user"]),addItemToCart)
router.patch('/items/:productId',validateUpdateCartItem,createAuthMiddleware(["user"]),updateCartItem)
router.get('/',createAuthMiddleware(["user"]),getCart)
router.delete('/cart/items/:productId',createAuthMiddleware(["user"]),removeCartItem)
router.delete('/cart',createAuthMiddleware(["user"]),clearCart)
export default router;