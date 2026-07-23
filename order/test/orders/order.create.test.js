import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import request from "supertest";

import "../setup.js";

jest.unstable_mockModule("axios", () => ({
  default: {
    get: jest.fn(),
  },
}));

const [{ default: app }, { default: axios }, { Order }] = await Promise.all([
  import("../../src/app.js"),
  import("axios"),
  import("../../src/models/order.model.js"),
]);

beforeEach(() => {
  jest.clearAllMocks();
});

function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
}

function buildValidShippingAddress(overrides = {}) {
  return {
    street: "123 Main Street",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    country: "India",
    isDefault: true,
    ...overrides,
  };
}

describe("POST /api/orders", () => {

  it("creates an order successfully", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productId = new mongoose.Types.ObjectId().toString();

    const token = createToken({ id: userId, role: "user" });

    axios.get.mockImplementation((url) => {

      if (url.includes("/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId, quantity: 2 }],
            },
          },
        });
      }

      if (url.includes("/products")) {
        const urlProductId = url.split("/products/")[1];

        return Promise.resolve({
          data: {
            product: {
              _id: urlProductId,
              stock: 5,
              price: { amount: 100, currency: "INR" },
            },
          },
        });
      }

      return Promise.reject(new Error("Unknown URL: " + url));
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: buildValidShippingAddress(),
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Order created successfully");

    expect(response.body.order.totalPrice).toEqual({
      amount: 200,
      currency: "INR",
    });

    const savedOrder = await Order.findOne({ userId });
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.items).toHaveLength(1);
  });

  it("returns 500 when product is out of stock", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const productId = new mongoose.Types.ObjectId().toString();

    const token = createToken({ id: userId, role: "user" });

    axios.get.mockImplementation((url) => {

      if (url.includes("/cart")) {
        return Promise.resolve({
          data: {
            cart: {
              items: [{ productId, quantity: 3 }],
            },
          },
        });
      }

      if (url.includes("/products")) {
        const urlProductId = url.split("/products/")[1];

        return Promise.resolve({
          data: {
            product: {
              _id: urlProductId,
              stock: 1, // ❌ less than quantity
              price: { amount: 100, currency: "INR" },
            },
          },
        });
      }

      return Promise.reject(new Error("Unknown URL: " + url));
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: buildValidShippingAddress(),
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal Server Error");

    expect(await Order.countDocuments()).toBe(0);
  });

});