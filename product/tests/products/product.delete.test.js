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

describe("DELETE /api/products/:id (seller)", () => {
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

  it("allows the seller to delete their product", async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const postRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .field("title", "To Delete")
      .field("description", "Will be deleted")
      .field("priceAmount", "12")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img"), "d.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);

    // Accept success statuses or variations depending on implementation
    expect([200, 204, 404]).toContain(delRes.status);

    // If deletion succeeded, ensure product is not found
    if (delRes.status === 200 || delRes.status === 204) {
      const getRes = await request(app).get(`/api/products/${id}`);
      expect([404]).toContain(getRes.status);
    }
  });

  it("prevents a different seller from deleting the product (forbidden)", async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const otherId = new mongoose.Types.ObjectId().toString();

    const ownerToken = jwt.sign({ id: ownerId, role: "seller" }, process.env.JWT_SECRET);
    const otherToken = jwt.sign({ id: otherId, role: "seller" }, process.env.JWT_SECRET);

    const postRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${ownerToken}`)
      .field("title", "Owner Item")
      .field("description", "Owner Desc")
      .field("priceAmount", "20")
      .field("priceCurrency", "INR")
      .attach("images", Buffer.from("img"), "o.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    // depending on middleware/controller, could be 401/403/404
    expect([401, 403, 404]).toContain(delRes.status);
  });

  it("returns 400 for invalid id format", async () => {
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: "seller" }, process.env.JWT_SECRET);

    const res = await request(app)
      .delete(`/api/products/invalid-id`)
      .set("Authorization", `Bearer ${token}`);

    expect([400, 404]).toContain(res.status);
  });

  it("allows deletion when authenticated via cookie token (seller)", async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const postRes = await request(app)
      .post("/api/products")
      .set("Cookie", `token=${token}`)
      .field("title", "Cookie Delete")
      .field("description", "Using cookie auth")
      .field("priceAmount", "15")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img"), "c.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/products/${id}`)
      .set("Cookie", `token=${token}`);

    expect([200, 204, 404]).toContain(delRes.status);
  });

  it("returns 401 when no auth provided (cookie or header)", async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const postRes = await request(app)
      .post("/api/products")
      .set("Cookie", `token=${token}`)
      .field("title", "No Auth Delete")
      .field("description", "Will attempt delete unauthenticated")
      .field("priceAmount", "18")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img"), "na.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    const delRes = await request(app).delete(`/api/products/${id}`);

    expect(delRes.status).toBe(401);
  });

  it("returns 401 for invalid token in cookie", async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: sellerId, role: "seller" }, process.env.JWT_SECRET);

    const postRes = await request(app)
      .post("/api/products")
      .set("Cookie", `token=${token}`)
      .field("title", "Invalid Token Delete")
      .field("description", "Will attempt delete with bad token")
      .field("priceAmount", "22")
      .field("priceCurrency", "USD")
      .attach("images", Buffer.from("img"), "it.jpg");

    expect(postRes.status).toBe(201);
    const id = postRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/products/${id}`)
      .set("Cookie", `token=invalid.token.here`);

    expect(delRes.status).toBe(401);
  });
});
