import cartModel from "../models/cart.model.js";

async function addItemToCart(req, res) {

    const { productId, quantity } = req.body;

    const user = req.user; // from auth middleware
    let cart = await cartModel.findOne({ user: user.id});
    
    
    if (!cart) {
        cart = new cartModel({
            user: user.id,
            items: [ ]
        });
    }
    const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    console.log("productId:", productId);
    if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({ productId, quantity });
    }
    await cart.save();
    res.status(201).json({ message: 'Item added to cart', cart });
}


async function getCart(req, res) {
    const user = req.user;
    const cart = await cartModel.findOne({ user: user.id });
    
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    
    const totals = {
        totalItems: cart.items.length,
        totalQuantity: cart.items.reduce((acc, item) => acc + item.quantity, 0),
    };
    
    res.status(200).json({ cart, totals });
}
async function updateCartItem(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const cart = await cartModel.findOne({ user: user.id });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }

    const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
    );

    if (existingItemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[existingItemIndex].quantity = quantity;
    await cart.save();

    res.status(200).json({ message: 'Cart item updated', cart });
}



async function removeCartItem(req, res) {
    const { productId } = req.params;
    const user = req.user;
    const cart = await cartModel.findOne({ user: user.id });
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
    );
    if (existingItemIndex === -1) {
        return res.status(404).json({ message: 'Item not found in cart' });
    }
    cart.items.splice(existingItemIndex, 1);
    await cart.save();
    res.status(200).json({ message: 'Item removed from cart', cart });
}
async function clearCart(req, res) {
    const user = req.user;
    const cart = await cartModel.findOne({ user: user.id });   
    if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
    }
    cart.items = [];
    await cart.save();
    res.status(200).json({ message: 'Cart cleared', cart });
}


export { addItemToCart, updateCartItem, getCart, removeCartItem, clearCart }