import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const createOrderMock = jest.fn((req, res) => {
	return res.status(201).json({ message: "Order created" });
});

const updateOrderAddressMock = jest.fn((req, res) => {
	return res.status(200).json({ message: "Address updated", orderId: req.params.id });
});

const createAuthMiddlewareMock = jest.fn((allowedRoles = ["user"]) => {
	return (req, res, next) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const role = req.headers["x-test-role"] || "user";
		if (!allowedRoles.includes(role)) {
			return res.status(403).json({ message: "Forbidden" });
		}

		req.user = { id: "u-1", role };
		return next();
	};
});

const updateAddressValidationMiddleware = jest.fn((req, res, next) => {
	if (!req.body?.shippingAddress?.street) {
		return res.status(400).json({ message: "Validation failed" });
	}
	return next();
});

jest.unstable_mockModule("../../src/controllers/order.controller.js", () => ({
	createOrder: createOrderMock,
	getMyOrders: jest.fn(),
	getOrderById: jest.fn(),
	updateOrderAddress: updateOrderAddressMock,
	cancelOrderById: jest.fn(),
}));

jest.unstable_mockModule("../../src/middleware/auth.middleware.js", () => ({
	default: createAuthMiddlewareMock,
}));

jest.unstable_mockModule("../../src/middleware/validation.middleware.js", () => ({
	createOrderValidations: [],
	updateAddressValidation: [updateAddressValidationMiddleware],
}));

const [{ default: router }] = await Promise.all([import("../../src/routes/order.routes.js")]);

const app = express();
app.use(express.json());
app.use("/api/orders", router);

beforeEach(() => {
	jest.clearAllMocks();
});

describe("PATCH /api/orders/:id/address", () => {
	it("updates the shipping address for a valid request", async () => {
		const response = await request(app)
			.patch("/api/orders/ord-123/address")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "user")
			.send({
				shippingAddress: {
					street: "123 Main St",
				},
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Address updated",
			orderId: "ord-123",
		});
		expect(updateAddressValidationMiddleware).toHaveBeenCalledTimes(1);
		expect(updateOrderAddressMock).toHaveBeenCalledTimes(1);
	});

	it("returns 400 for invalid payload", async () => {
		const response = await request(app)
			.patch("/api/orders/ord-123/address")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "user")
			.send({
				shippingAddress: {},
			});

		expect(response.status).toBe(400);
		expect(response.body.message).toBe("Validation failed");
		expect(updateAddressValidationMiddleware).toHaveBeenCalledTimes(1);
		expect(updateOrderAddressMock).toHaveBeenCalledTimes(0);
	});
});
