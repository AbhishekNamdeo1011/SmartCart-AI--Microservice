import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.js";
import { jest } from "@jest/globals";

import { connectDB, clearDB, closeDB } from "../setup.js";

// 🔥 Mock Redis (adjust path if needed)
jest.unstable_mockModule("../../db/redis.js", () => ({
  redis: {
    set: jest.fn(),   // logout me set use ho raha hai (blacklist)
  }
}));

jest.setTimeout(20000);

// ✅ DB setup
beforeAll(async () => {
  await connectDB();
});

// ✅ clear after each test
afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

// ✅ proper cleanup (Mongo + Redis handled inside setup.js)
afterAll(async () => {
  await closeDB();
});

describe("GET /api/auth/logout", () => {

  // ✅ SUCCESS LOGOUT
  it("should logout successfully and clear cookie", async () => {

    const token = jwt.sign(
      { id: "123" },
      process.env.JWT_SECRET || "secretkey"
    );

    const res = await request(app)
      .get("/api/auth/logout")
      .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");

    // 🔥 check cookie cleared
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  // ✅ NO TOKEN (idempotent logout)
  it("should return 200 even if no token is provided", async () => {

    const res = await request(app)
      .get("/api/auth/logout");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });

});