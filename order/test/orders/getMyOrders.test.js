import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";

const createOrderMock = jest.fn((req, res) => {
	return res.status(201).json({ message: "Order created" });
});

const getMyOrdersMock = jest.fn((req, res) => {
	return res.status(200).json({
		message: "Fetched my orders",
		userId: req.user.id,
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
	getMyOrders: getMyOrdersMock,
	getOrderById: jest.fn(),
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

describe("GET /api/orders/me", () => {
	it("returns current user orders for user role", async () => {
		const response = await request(app)
			.get("/api/orders/me")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "user");

		expect(response.status).toBe(200);
		expect(getMyOrdersMock).toHaveBeenCalledTimes(1);
	});

	it("returns 401 when token is missing", async () => {
		const response = await request(app).get("/api/orders/me");

		expect(response.status).toBe(401);
		expect(response.body.message).toBe("Authentication required");
		expect(getMyOrdersMock).not.toHaveBeenCalled();
	});

	it("returns 403 for non-user role", async () => {
		const response = await request(app)
			.get("/api/orders/me")
			.set("Authorization", "Bearer test-token")
			.set("x-test-role", "admin");

		expect(response.status).toBe(403);
		expect(response.body.message).toBe("Forbidden");
		expect(getMyOrdersMock).not.toHaveBeenCalled();
	});
});
