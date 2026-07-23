import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const createOrderMock = jest.fn((req, res) => {
	return res.status(201).json({ message: "Order created" });
});

const getOrderByIdMock = jest.fn((req, res) => {
	return res.status(200).json({
		message: "Order fetched",
		orderId: req.params.id,
		role: req.user.role,
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
	getOrderById: getOrderByIdMock,
	cancelOrderById: jest.fn(),
	updateOrderAddress: jest.fn(),
}));

jest.unstable_mockModule("../../src/middleware/auth.middleware.js", () => ({
	default: createAuthMiddlewareMock,
}));

jest.unstable_mockModule("../../src/middleware/validation.middleware.js", () => ({
	createOrderValidations: [],
	updateAddressValidation: [],
}));

const [{ default: router }] = await Promise.all([import("../../src/routes/order.routes.js")]);

const app = express();
app.use(express.json());
app.use("/api/orders", router);

beforeEach(() => {
	jest.clearAllMocks();
});

describe("GET /api/orders/:id", () => {
	it("allows user and admin roles", async () => {
		const userResponse = await request(app)
			.get("/api/orders/ord-123")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "user");

		const adminResponse = await request(app)
			.get("/api/orders/ord-123")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "admin");

		expect(userResponse.status).toBe(200);
		expect(adminResponse.status).toBe(200);
		expect(getOrderByIdMock).toHaveBeenCalledTimes(2);
	});

	it("returns 403 for disallowed roles", async () => {
		const response = await request(app)
			.get("/api/orders/ord-123")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "seller");

		expect(response.status).toBe(403);
		expect(response.body.message).toBe("Forbidden");
		expect(getOrderByIdMock).not.toHaveBeenCalled();
	});

	it("returns 401 when token is missing", async () => {
		const response = await request(app).get("/api/orders/ord-123");

		expect(response.status).toBe(401);
		expect(response.body.message).toBe("Authentication required");
		expect(getOrderByIdMock).not.toHaveBeenCalled();
	});
});
