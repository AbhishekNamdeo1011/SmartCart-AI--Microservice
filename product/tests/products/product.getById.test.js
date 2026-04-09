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

describe("GET /api/products/:id", () => {
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

  it("returns a single product by id", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "seller" },
      process.env.JWT_SECRET
    );

    const postRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Single Product")
      .field("description", "Single Desc")
      .field("priceAmount", "25")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("fake-image"), "single.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    const res = await request(app).get(`/api/products/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("product");
    expect(res.body.product._id).toBe(id);
    expect(res.body.product.title).toBe("Single Product");
  });

  it("returns 404 for non-existent product id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/products/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });
});
