import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { redis } from "../db/redis.js"

async function registerUser(req, res) {
  try {

    const { username, password, email, fullName: { firstName, lastName }, role } = req.body;

    const isUserExist = await userModel.findOne({
      $or: [
        { username },
        { email }
      ]
    });

    if (isUserExist) {
      return res.status(409).json({
        message: "Username or email already exists"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
      role : role || "user",
      fullName: {
        firstName,
        lastName
      }
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, username, password } = req.body;


    const user = await userModel.findOne({
      $or: [ 
        { email },
        { username }
      ]
    }).select('+password')


    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      })
    }
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Login successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    })
  }
  catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}


async function getCurrentUser(req, res) {
  return res.status(200).json({
    message: "Current user fetch successfully",
    user: req.user
  })
}
async function logoutUser(req, res) {
  const token = req.cookies.token;

  if (token) {
    await redis.set(`blacklist:${token}`, "true", "EX", 24 * 60 * 60)
  }

  res.clearCookie('token', {
    httpOnly: true,
    secure: true
  })
  return res.status(200).json({
    message: "Logged out successfully"
  })
}


async function getUserAddresses(req, res) {
  try {
    const id = req.user.id;

    const user = await userModel.findById(id).select("addresses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User addresses fetched successfully",
      addresses: user.addresses || []
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function addUserAddress(req, res) {
  try {
    const id = req.user.id;

    const { street, city, state, pincode, country, isDefault } = req.body;

    const user = await userModel.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          addresses: { street, city, state, pincode, country, isDefault }
        }
      },
      { returnDocument: "after" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(201).json({
      message: "Address added successfully",
      address: user.addresses[user.addresses.length - 1]
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

import mongoose from "mongoose";

async function deleteUserAddress(req, res) {
  try {
    const id = req.user.id;
    const { addressId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const isAddressExists = await userModel.findOne({
      _id: id,
      "addresses._id": addressId
    });

    if (!isAddressExists) {
      return res.status(404).json({ message: "Address not found" });
    }

    const user = await userModel.findOneAndUpdate(
      { _id: id },
      {
        $pull: { addresses: { _id: addressId } }
      },
      { returnDocument: "after" }
    );

    return res.status(200).json({
      message: "Address deleted successfully",
      addresses: user.addresses
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
export {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress
};