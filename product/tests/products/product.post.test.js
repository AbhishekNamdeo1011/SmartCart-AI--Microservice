import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

// ✅ FIX __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ MOCK IMAGEKIT
jest.unstable_mockModule("../../src/service/imagekit.service.js", () => ({
  uploadImage: jest.fn(async () => ({
    url: "https://ik.mock/test.jpg",
    thumbnail: "https://ik.mock/thumb.jpg",
    id: "mock_id",
  })),
}));

// ✅ MOCK QUEUE (VERY IMPORTANT)

// ✅ IMPORT AFTER MOCKS
const { default: app } = await import("../../src/app.js");

describe("POST /api/products", () => {
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

  // ✅ SUCCESS CASE
  it("creates a product and uploads images", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Test Product")
      .field("description", "Nice one")
      .field("priceAmount", "99.99")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("fake-image"), "test.jpg"); // ✅ no __dirname needed

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Test Product");
    expect(res.body.data.price.amount).toBe(99.99);
    expect(res.body.data.images.length).toBe(1);
    expect(res.body.data.images[0].url).toContain("ik.mock");
  });

  // ✅ VALIDATION CASE
  it("validates required fields", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "X"); // incomplete

    expect(res.status).toBe(400);
  });
});