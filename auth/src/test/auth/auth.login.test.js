import request from "supertest";
import bcrypt from "bcryptjs";
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

describe("POST /api/auth/login", () => {

  // ✅ SUCCESS LOGIN
  it("should login successfully", async () => {

    const hash = await bcrypt.hash("Password123", 10);

    await User.create({
      username: "dummyuser",
      email: "dummy@test.com",
      password: hash,
      role: "user",
      fullName: {
        firstName: "Dummy",
        lastName: "User"
      }
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "dummy@test.com",
        password: "Password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  // ❌ EMAIL NOT FOUND
 it("should fail if both email and username are missing", async () => {

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      password: "Password123"
    });

  expect(res.statusCode).toBe(400);
});

  // ❌ WRONG PASSWORD
  it("should fail if password is incorrect", async () => {

    const hash = await bcrypt.hash("Password123", 10);

    await User.create({
      username: "dummyuser",
      email: "dummy@test.com",
      password: hash,
      role: "user",
      fullName: {
        firstName: "Dummy",
        lastName: "User"
      }
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "dummy@test.com",
        password: "WrongPassword"
      });

    expect(res.statusCode).toBe(401);
  });

  // ❌ PASSWORD TOO SHORT (VALIDATION)
  it("should fail if password is less than 6 characters", async () => {

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "dummy@test.com",
        password: "123"
      });

    expect(res.statusCode).toBe(400);
  });

  // ❌ INVALID EMAIL FORMAT (VALIDATION)
  it("should fail if email format is invalid", async () => {

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "invalid-email",
        password: "Password123"
      });

    expect(res.statusCode).toBe(400);
  });

});