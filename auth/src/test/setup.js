import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { redis } from "../db/redis.js"; // 🔥 IMPORTANT

let mongoServer;

export const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
};

export const clearDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  await mongoServer.stop();

  // 🔥 FIX: close redis
  if (redis?.quit) {
    await redis.quit();
  }
};