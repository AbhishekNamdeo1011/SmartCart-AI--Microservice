import request from "supertest";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import app from "../../app.js";
import userModel from "../../models/user.model.js";
import { connectDB, clearDB, closeDB } from "../setup.js";

describe("User addresses API", () => {

  beforeAll(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // ================= HELPER =================

  async function seedUserAndLogin() {
    const password = "Secret123!";
    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username: "testuser",
      email: "test@example.com",
      password: hash,
      fullName: { firstName: "Test", lastName: "User" },

      // ✅ FIXED → array
      addresses: [
        {
          street: "Old Street",
          city: "Old City",
          state: "MP",
          zip: "000000",
          country: "India",
          isDefault: false,
        }
      ],
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password });

    const cookies = loginRes.headers["set-cookie"];

    return { user, cookies };
  }

  // ================= GET =================

  describe("GET /api/auth/users/me/addresses", () => {

    it("should return 401 without cookie", async () => {
      const res = await request(app)
        .get("/api/auth/users/me/addresses");

      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/users/me/addresses")
        .set("Cookie", "token=invalid");

      expect(res.status).toBe(401);
    });

    it("should return user addresses", async () => {
      const { cookies } = await seedUserAndLogin();

      const res = await request(app)
        .get("/api/auth/users/me/addresses")
        .set("Cookie", cookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("addresses");
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses[0].city).toBe("Old City");
    });

  });

  // ================= POST =================

  describe("POST /api/auth/users/me/addresses", () => {

    it("should return 401 without cookie", async () => {
      const res = await request(app)
        .post("/api/auth/users/me/addresses")
        .send({ city: "Bhopal" });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid input", async () => {
      const { cookies } = await seedUserAndLogin();

      const res = await request(app)
        .post("/api/auth/users/me/addresses")
        .set("Cookie", cookies)
        .send({ city: "Only city" });

      expect(res.status).toBe(400);
    });

    it("should add new address successfully", async () => {
      const { user, cookies } = await seedUserAndLogin();

      const newAddress = {
        street: "New Street",
        city: "Bhopal",
        state: "MP",
        pincode: "462001",
        country: "India",
        isDefault: true,
      };

      const res = await request(app)
        .post("/api/auth/users/me/addresses")
        .set("Cookie", cookies)
        .send(newAddress);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("address");
      expect(res.body.address.city).toBe("Bhopal");

      // ✅ DB VALIDATION
      const updatedUser = await userModel.findById(user._id);

      expect(updatedUser.addresses.length).toBe(2);
      expect(updatedUser.addresses[1].city).toBe("Bhopal");
      expect(updatedUser.addresses[1].isDefault).toBe(true);
    });

  });

  // ================= DELETE =================

  describe("DELETE /api/auth/users/me/addresses/:addressId", () => {

    it("should return 401 without cookie", async () => {
      const res = await request(app)
        .delete("/api/auth/users/me/addresses/123");

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid ObjectId", async () => {
      const { cookies } = await seedUserAndLogin();

      const res = await request(app)
        .delete("/api/auth/users/me/addresses/123")
        .set("Cookie", cookies);

      expect(res.status).toBe(400);
    });

    it("should delete address successfully", async () => {
      const { user, cookies } = await seedUserAndLogin();

      const addressId = user.addresses[0]._id.toString();

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(200);

      // ✅ DB VALIDATION
      const updatedUser = await userModel.findById(user._id);
      expect(updatedUser.addresses.length).toBe(0);
    });

    it("should return 404 if address not found", async () => {
      const { cookies } = await seedUserAndLogin();

      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${fakeId}`)
        .set("Cookie", cookies);

      expect(res.status).toBe(404);
    });

  });

});