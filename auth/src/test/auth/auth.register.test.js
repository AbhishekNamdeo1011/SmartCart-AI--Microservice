import request from "supertest";
import app from "../../app.js";
import User from "../../models/user.model.js";
import { jest } from "@jest/globals";

import { connectDB, closeDB, clearDB } from "../setup.js";

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

describe("POST /api/auth/register", () => {

  it("should register a new user successfully", async () => {

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "dummyuser",
        email: "dummy@test.com",
        password: "Password123",
        fullName: {
          firstName: "Dummy",
          lastName: "User"
        },
        role: "user"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("user");
  });

  it("should fail if username is missing", async () => {

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "dummy@test.com",
        password: "Password123",
        fullName: {
          firstName: "Dummy",
          lastName: "User"
        }
      });

    expect(res.statusCode).toBe(400);
  });

  it("should fail if email already exists", async () => {

    await User.create({
      username: "dummyuser",
      email: "dummy@test.com",
      password: "Password123",
      fullName: {
        firstName: "Dummy",
        lastName: "User"
      },
      role: "user"
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "anotheruser",
        email: "dummy@test.com",
        password: "Password123",
        fullName: {
          firstName: "Dummy",
          lastName: "User"
        },
        role: "user"
      });

    expect(res.statusCode).toBe(409);
  });

});