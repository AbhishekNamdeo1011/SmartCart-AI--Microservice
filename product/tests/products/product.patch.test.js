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

describe("PATCH /api/products/:id (seller)", () => {
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

  it("allows the seller to update their product fields", async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();

    const token = jwt.sign({ id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    // create product
    const postRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "Updatable Product")
      .field("description", "Original Desc")
      .field("priceAmount", "30")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("fake-image"), "orig.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    // patch update title and price
    const patchRes = await request(app)
      .patch(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Title", priceAmount: 45 });

    expect([200, 204]).toContain(patchRes.status);

    // fetch and verify
    const getRes = await request(app).get(`/api/products/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.product.title).toBe("Updated Title");
    expect(getRes.body.product.price.amount).toBe(45);
  });

  it("prevents a different seller from updating the product (forbidden)", async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const otherSellerId = new mongoose.Types.ObjectId().toString();

    const ownerToken = jwt.sign({ id: ownerId, role: "seller" }, process.env.JWT_SECRET);
    const otherToken = jwt.sign({ id: otherSellerId, role: "seller" }, process.env.JWT_SECRET);

    // owner creates product
    const postRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ownerToken}`)
      .field("title", "Owner Product")
      .field("description", "Owner Desc")
      .field("priceAmount", "10")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("img"), "o.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    // other seller attempts update
    const patchRes = await request(app)
      .patch(`/api/products/${id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Malicious Update" });

    // Expect forbidden (403), unauthorized (401), or not found (404) depending on middleware/controller
    expect([401, 403, 404]).toContain(patchRes.status);
  });

  it("returns 400 for invalid product id format", async () => {
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: "seller" }, process.env.JWT_SECRET);

    const res = await request(app)
      .patch(`/api/products/invalid-id`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Nope" });

    expect([400, 404]).toContain(res.status);
  });
});
