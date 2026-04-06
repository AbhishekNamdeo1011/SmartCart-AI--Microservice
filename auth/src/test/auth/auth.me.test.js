import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.js";
import User from "../../models/user.model.js";
import { jest } from "@jest/globals";

import { connectDB, clearDB, closeDB } from "../setup.js";

jest.setTimeout(20000);

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

afterAll(async () => {
  await closeDB();
});

describe("GET /api/auth/me", () => {

  // ✅ SUCCESS (cookie token)
  it("should return user profile if token is valid (cookie)", async () => {

    const user = await User.create({
      username: "dummyuser",
      email: "dummy@test.com",
      password: "hashedpassword",
      role: "user",
      fullName: {
        firstName: "Dummy",
        lastName: "User"
      }
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey"
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${token}`]);   // 🔥 IMPORTANT

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
  });

  // ❌ NO TOKEN
  it("should fail if token is not provided", async () => {

    const res = await request(app)
      .get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });

  // ❌ INVALID TOKEN
  it("should fail if token is invalid", async () => {

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", ["token=invalidtoken"]);

    expect(res.statusCode).toBe(401);
  });

});