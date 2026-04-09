import mongoose from "mongoose";
import productModel from "../models/product.model.js";
import { uploadImage } from "../service/imagekit.service.js";

async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency = 'INR', stock } = req.body;
        const seller = req.user.id; // Extract seller from authenticated user

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency,
        };
       

        const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));


        const product = await productModel.create({ title, description, price, seller, images,stock:Number(stock) || 0 });


        return res.status(201).json({
            message: 'Product created',
            data: product,
        });

    } catch (err) {
        console.error('Create product error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

   async function getProducts(req, res) {
  const {q,minprice,maxprice , skip = 0, limit = 20} = req.query;
    const filter = {};
if(q){
    filter.$text = { $search: q };
}
   
   if(minprice ){
    filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minprice) };
   }
    if(maxprice){   
    filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxprice) };
    }
    const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(limit,20));
    return res.status(200).json({
        message: 'Products fetched',
        data: products,
    });
}
async function getProductById(req, res) {       
    const { id } = req.params;
    const product = await productModel.findById(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({
        message: 'Product fetched',
        product: product,
    });
}

async function updateProduct(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
    }

    // find product owned by this seller
    const product = await productModel.findOne({ _id: id, seller: req.user.id });
    if (!product) {
        return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    const allowedUpdates = ["title", "description", "priceAmount", "priceCurrency", "stock"];
    let changed = false;

    for (const key of Object.keys(req.body)) {
        if (!allowedUpdates.includes(key)) continue;

        if (key === "priceAmount") {
            product.price = product.price || {};
            product.price.amount = Number(req.body[key]);
            changed = true;
        } else if (key === "priceCurrency") {
            product.price = product.price || {};
            product.price.currency = req.body[key];
            changed = true;
        } else if (key === "stock") {
            product.stock = Number(req.body[key]);
            changed = true;
        } else {
            product[key] = req.body[key];
            changed = true;
        }
    }

    if (!changed) {
        return res.status(400).json({ message: "No valid fields to update" });
    }

    await product.save();

    return res.status(200).json({ message: "Product updated", product });

}

async function deleteProduct(req, res) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await productModel.findOne({ _id: id,});
    if (!product) {
        return res.status(404).json({ message: "Product not found or unauthorized" });
    }

    if (product.seller.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You do not own this product" });
    }

    await productModel.findOneAndDelete({ _id: id });

    return res.status(200).json({ message: "Product deleted" });

}

async function getProductsBySeller(req, res) {
    const sellerId = req.params.sellerId;

    const { skip = 0, limit = 20 } = req.query;
    const products = await productModel.find({ seller: sellerId }).skip(Number(skip)).limit(Math.min(limit,20));

    return res.status(200).json({
        message: 'Products fetched',
        data: products,
    });
}
export { createProduct, getProducts, getProductById, updateProduct, deleteProduct,getProductsBySeller };