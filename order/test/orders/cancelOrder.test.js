import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const createOrderMock = jest.fn((req, res) => {
	return res.status(201).json({ message: "Order created" });
});

const cancelOrderByIdMock = jest.fn((req, res) => {
	return res.status(200).json({
		message: "Order canceled",
		orderId: req.params.id,
	});
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

jest.unstable_mockModule("../../src/controllers/order.controller.js", () => ({
	createOrder: createOrderMock,
	getMyOrders: jest.fn(),
	getOrderById: jest.fn(),
	cancelOrderById: cancelOrderByIdMock,
	updateOrderAddress: jest.fn(),
}));

jest.unstable_mockModule("../../src/middleware/auth.middleware.js", () => ({
	default: createAuthMiddlewareMock,
}));

jest.unstable_mockModule("../../src/middleware/validation.middleware.js", () => ({
	createOrderValidations: [],
	updateAddressValidation: [],
}));

const [{ default: router }] = await Promise.all([
	import("../../src/routes/order.routes.js"),
]);

const app = express();
app.use(express.json());
app.use("/api/orders", router);

beforeEach(() => {
	jest.clearAllMocks();
});

describe("POST /api/orders/:id/cancel", () => {

	// ✅ SUCCESS CASE
	it("cancels order successfully when user is authenticated", async () => {
		const response = await request(app)
			.post("/api/orders/ord-123/cancel")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "user");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Order canceled",
			orderId: "ord-123",
		});

		expect(cancelOrderByIdMock).toHaveBeenCalledTimes(1);
	});

	// ❌ NO TOKEN
	it("returns 401 when token is missing", async () => {
		const response = await request(app)
			.post("/api/orders/ord-123/cancel");

		expect(response.status).toBe(401);
		expect(response.body.message).toBe("Authentication required");

		expect(cancelOrderByIdMock).toHaveBeenCalledTimes(0);
	});

	// ❌ WRONG ROLE
	it("returns 403 when role is not allowed", async () => {
		const response = await request(app)
			.post("/api/orders/ord-123/cancel")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "admin"); // ❌ not allowed

		expect(response.status).toBe(403);
		expect(response.body.message).toBe("Forbidden");

		expect(cancelOrderByIdMock).toHaveBeenCalledTimes(0);
	});

});