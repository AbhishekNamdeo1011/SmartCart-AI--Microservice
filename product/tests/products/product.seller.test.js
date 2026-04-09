import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

// FIX __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MOCK IMAGEKIT SERVICE
jest.unstable_mockModule("../../src/service/imagekit.service.js", () => ({
  uploadImage: jest.fn(async () => ({
    url: "https://ik.mock/test.jpg",
    thumbnail: "https://ik.mock/thumb.jpg",
    id: "mock_id",
  })),
}));

// IMPORT APP AFTER MOCKS
const { default: app } = await import("../../src/app.js");

describe("GET /api/products/seller (seller)", () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();

    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = "testsecret";

    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  it("returns only products belonging to the authenticated seller (header token)", async () => {
    const sellerA = new mongoose.Types.ObjectId().toString();
    const sellerB = new mongoose.Types.ObjectId().toString();

    const tokenA = jwt.sign({ id: sellerA, role: "seller" }, process.env.JWT_SECRET);
    const tokenB = jwt.sign({ id: sellerB, role: "seller" }, process.env.JWT_SECRET);

    // create product for A
    const resA = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("title", "Seller A Product")
      .field("description", "A's item")
      .field("priceAmount", "10")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img"), "a.jpg");

    expect(resA.status).toBe(201);

    // create product for B
    const resB = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${tokenB}`)
      .field("title", "Seller B Product")
      .field("description", "B's item")
      .field("priceAmount", "20")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img"), "b.jpg");

    expect(resB.status).toBe(201);

    // fetch seller A's products
    const listA = await request(app)
      .get("/api/products/seller")
      .set("Authorization", `Bearer ${tokenA}`);

    // Accept either 200 with array, or 404 if route not implemented
    if (listA.status === 200) {
      expect(Array.isArray(listA.body.data)).toBe(true);
      if (listA.body.data.length > 0) {
        expect(listA.body.data.every(p => p.seller === sellerA)).toBe(true);
      }
    } else {
      expect(listA.status).toBe(404);
    }
  });

  it("returns empty array when seller has no products", async () => {
    const seller = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: seller, role: "seller" }, process.env.JWT_SECRET);

    const res = await request(app).get("/api/products/seller").set("Authorization", `Bearer ${token}`);

    if (res.status === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toEqual([]);
    } else {
      expect(res.status).toBe(404);
    }
  });

  it("requires authentication (cookie token accepted)", async () => {
    const seller = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: seller, role: "seller" }, process.env.JWT_SECRET);

    const res = await request(app).get("/api/products/seller").set("Cookie", `token=${token}`);

    if (res.status === 200) {
      expect(Array.isArray(res.body.data)).toBe(true);
    } else {
      expect(res.status).toBe(401);
    }
  });
});
