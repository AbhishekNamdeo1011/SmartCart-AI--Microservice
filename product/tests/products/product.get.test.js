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

// ✅ IMPORT AFTER MOCKS
const { default: app } = await import("../../src/app.js");

describe("GET /api/products", () => {
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

  it("returns products list", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    // create a product first using the API so middleware runs
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "List Product")
      .field("description", "For listing")
      .field("priceAmount", "10")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("fake-image"), "test2.jpg");

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].title).toBe("List Product");
  }); it("returns empty array when no products exist", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });


  it("returns multiple products correctly", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    // create multiple products
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Product 1")
      .field("description", "Desc 1")
      .field("priceAmount", "100")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("img1"), "img1.jpg");

    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Product 2")
      .field("description", "Desc 2")
      .field("priceAmount", "200")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img2"), "img2.jpg");

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });


  it("each product should have required fields", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Check Fields")
      .field("description", "Check Desc")
      .field("priceAmount", "50")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("img"), "img.jpg");

    const res = await request(app).get("/api/products");

    const product = res.body.data[0];

    expect(product).toHaveProperty("title");
    expect(product).toHaveProperty("description");
    expect(product).toHaveProperty("price");
    expect(product.price).toHaveProperty("amount");
    expect(product.price).toHaveProperty("currency");
    expect(product).toHaveProperty("images");
  });


  it("should handle pagination (skip & limit)", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    // create 3 products
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .field("title", `Product ${i}`)
        .field("description", `Desc ${i}`)
        .field("priceAmount", `${i * 10}`)
        .field("priceCurrency", "INR")
        .attach("images", Buffer.from("img"), `img${i}.jpg`);
    }

    const res = await request(app).get("/api/products?skip=1&limit=1");

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });


  
});
