import usermodel from "../models/user.model.js";
import jwt from "jsonwebtoken";

async function authMiddleware(req,res,next){
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({message:"Unauthorized"})
    }

    try{
        const decode = jwt.verify(token,  process.env.JWT_SECRET || "secretkey");
        const user = decode

        req.user = user;

        next()

    }
    catch(err){
        return res.status(401).json({message:"Unauthorized"})
    }
}
export {
    authMiddleware
}