import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../app.js';
import cartModel from '../models/cart.model.js';

beforeAll(() => {
	if (!process.env.JWT_SECRET) {
		process.env.JWT_SECRET = 'testsecret';
	}
});

function generateToken(overrides = {}) {
	const defaultUserId = new mongoose.Types.ObjectId().toString();
	const payload = {
		id: defaultUserId,
		role: 'user',
		...overrides,
	};

	const token = jwt.sign(payload, process.env.JWT_SECRET);
	return { token, userId: payload.id };
}

describe('POST /api/cart/items', () => {
	it('should add an item to the cart for an authenticated user with valid data', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token, userId } = generateToken();

		const response = await request(app)
			.post('/api/cart/items')
			.set('Authorization', `Bearer ${token}`)
			.send({ productId, quantity: 2 });

		expect(response.statusCode).toBe(201);
		expect(response.body).toHaveProperty('message', 'Item added to cart');
		expect(response.body).toHaveProperty('cart');

		const { cart } = response.body;
		expect(cart.user).toBe(userId);
		expect(Array.isArray(cart.items)).toBe(true);
		expect(cart.items).toHaveLength(1);
		expect(cart.items[0].productId).toBe(productId);
		expect(cart.items[0].quantity).toBe(2);

		const cartInDb = await cartModel.findOne({ user: userId });
		expect(cartInDb).not.toBeNull();
		expect(cartInDb.items).toHaveLength(1);
		expect(cartInDb.items[0].productId.toString()).toBe(productId);
		expect(cartInDb.items[0].quantity).toBe(2);
	});

	it('should return 400 if productId is invalid', async () => {
		const { token } = generateToken();

		const response = await request(app)
			.post('/api/cart/items')
			.set('Authorization', `Bearer ${token}`)
			.send({ productId: 'invalid-id', quantity: 1 });

		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('errors');
		expect(Array.isArray(response.body.errors)).toBe(true);
		expect(response.body.errors.length).toBeGreaterThan(0);
	});

	it('should return 400 if quantity is less than 1', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token } = generateToken();

		const response = await request(app)
			.post('/api/cart/items')
			.set('Authorization', `Bearer ${token}`)
			.send({ productId, quantity: 0 });

		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('errors');
		expect(Array.isArray(response.body.errors)).toBe(true);
		expect(response.body.errors.length).toBeGreaterThan(0);
	});

	it('should return 401 if no token is provided', async () => {
		const productId = new mongoose.Types.ObjectId().toString();

		const response = await request(app)
			.post('/api/cart/items')
			.send({ productId, quantity: 1 });

		expect(response.statusCode).toBe(401);
		expect(response.body).toHaveProperty('message', 'No token provided');
	});

	it('should return 403 if user does not have required role', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token } = generateToken({ role: 'admin' });

		const response = await request(app)
			.post('/api/cart/items')
			.set('Authorization', `Bearer ${token}`)
			.send({ productId, quantity: 1 });

		expect(response.statusCode).toBe(403);
		expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
	});
});

describe('PATCH /api/cart/items/:productId', () => {
	it('should update the quantity of an existing cart item for an authenticated user with valid data', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token, userId } = generateToken();

		await cartModel.create({
			user: userId,
			items: [
				{
					productId,
					quantity: 2,
				},
			],
		});

		const response = await request(app)
			.patch(`/api/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ quantity: 5 });

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Cart item updated');
		expect(response.body).toHaveProperty('cart');

		const { cart } = response.body;
		expect(cart.user).toBe(userId);
		expect(Array.isArray(cart.items)).toBe(true);
		expect(cart.items).toHaveLength(1);
		expect(cart.items[0].productId).toBe(productId);
		expect(cart.items[0].quantity).toBe(5);

		const cartInDb = await cartModel.findOne({ user: userId });
		expect(cartInDb).not.toBeNull();
		expect(cartInDb.items).toHaveLength(1);
		expect(cartInDb.items[0].productId.toString()).toBe(productId);
		expect(cartInDb.items[0].quantity).toBe(5);
	});

	it('should return 400 if productId param is invalid', async () => {
		const { token } = generateToken();

		const response = await request(app)
			.patch('/api/cart/items/invalid-id')
			.set('Authorization', `Bearer ${token}`)
			.send({ quantity: 3 });

		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('errors');
		expect(Array.isArray(response.body.errors)).toBe(true);
		expect(response.body.errors.length).toBeGreaterThan(0);
	});

	it('should return 400 if quantity is less than 1', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token, userId } = generateToken();

		await cartModel.create({
			user: userId,
			items: [
				{
					productId,
					quantity: 2,
				},
			],
		});

		const response = await request(app)
			.patch(`/api/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ quantity: 0 });

		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('errors');
		expect(Array.isArray(response.body.errors)).toBe(true);
		expect(response.body.errors.length).toBeGreaterThan(0);
	});

	it('should return 404 if cart does not exist for the user', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token } = generateToken();

		const response = await request(app)
			.patch(`/api/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ quantity: 3 });

		expect(response.statusCode).toBe(404);
		expect(response.body).toHaveProperty('message', 'Cart not found');
	});

	it('should return 404 if item does not exist in cart', async () => {
		const { token, userId } = generateToken();
		const productIdInCart = new mongoose.Types.ObjectId().toString();
		const differentProductId = new mongoose.Types.ObjectId().toString();

		await cartModel.create({
			user: userId,
			items: [
				{
					productId: productIdInCart,
					quantity: 2,
				},
			],
		});

		const response = await request(app)
			.patch(`/api/cart/items/${differentProductId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ quantity: 3 });

		expect(response.statusCode).toBe(404);
		expect(response.body).toHaveProperty('message', 'Item not found in cart');
	});

	it('should return 401 if no token is provided', async () => {
		const productId = new mongoose.Types.ObjectId().toString();

		const response = await request(app)
			.patch(`/api/cart/items/${productId}`)
			.send({ quantity: 1 });

		expect(response.statusCode).toBe(401);
		expect(response.body).toHaveProperty('message', 'No token provided');
	});

	it('should return 403 if user does not have required role', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token } = generateToken({ role: 'admin' });

		const response = await request(app)
			.patch(`/api/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ quantity: 1 });

		expect(response.statusCode).toBe(403);
		expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
	});
});

describe('GET /api/cart', () => {
	it('should fetch the current cart with items and totals for an authenticated user', async () => {
		const { token, userId } = generateToken();
		const productId1 = new mongoose.Types.ObjectId().toString();
		const productId2 = new mongoose.Types.ObjectId().toString();

		await cartModel.create({
			user: userId,
			items: [
				{ productId: productId1, quantity: 2 },
				{ productId: productId2, quantity: 3 },
			],
		});

		const response = await request(app)
			.get('/api/cart')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('cart');
		expect(response.body).toHaveProperty('totals');

		const { cart, totals } = response.body;
		expect(cart.user).toBe(userId);
		expect(Array.isArray(cart.items)).toBe(true);
		expect(cart.items).toHaveLength(2);
		expect(cart.items[0].productId).toBe(productId1);
		expect(cart.items[0].quantity).toBe(2);
		expect(cart.items[1].productId).toBe(productId2);
		expect(cart.items[1].quantity).toBe(3);

		expect(totals).toMatchObject({
			totalItems: 2,
			totalQuantity: 5,
		});
	});

	it('should return 404 if cart does not exist for the user', async () => {
		const { token } = generateToken();

		const response = await request(app)
			.get('/api/cart')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(404);
		expect(response.body).toHaveProperty('message', 'Cart not found');
	});

	it('should return 401 if no token is provided', async () => {
		const response = await request(app)
			.get('/api/cart');

		expect(response.statusCode).toBe(401);
		expect(response.body).toHaveProperty('message', 'No token provided');
	});

	it('should return 403 if user does not have required role', async () => {
		const { token } = generateToken({ role: 'admin' });

		const response = await request(app)
			.get('/api/cart')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(403);
		expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
	});
});

describe('DELETE /api/cart/cart/items/:productId', () => {
	it('should remove an existing item from the cart for an authenticated user', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token, userId } = generateToken();

		await cartModel.create({
			user: userId,
			items: [
				{
					productId,
					quantity: 2,
				},
			],
		});

		const response = await request(app)
			.delete(`/api/cart/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Item removed from cart');
		expect(response.body).toHaveProperty('cart');

		const { cart } = response.body;
		expect(cart.user).toBe(userId);
		expect(Array.isArray(cart.items)).toBe(true);
		expect(cart.items).toHaveLength(0);

		const cartInDb = await cartModel.findOne({ user: userId });
		expect(cartInDb).not.toBeNull();
		expect(cartInDb.items).toHaveLength(0);
	});

	it('should return 404 if cart does not exist for the user', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token } = generateToken();

		const response = await request(app)
			.delete(`/api/cart/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(404);
		expect(response.body).toHaveProperty('message', 'Cart not found');
	});

	it('should return 404 if item does not exist in cart', async () => {
		const { token, userId } = generateToken();
		const productIdInCart = new mongoose.Types.ObjectId().toString();
		const differentProductId = new mongoose.Types.ObjectId().toString();

		await cartModel.create({
			user: userId,
			items: [
				{
					productId: productIdInCart,
					quantity: 2,
				},
			],
		});

		const response = await request(app)
			.delete(`/api/cart/cart/items/${differentProductId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(404);
		expect(response.body).toHaveProperty('message', 'Item not found in cart');
	});

	it('should return 401 if no token is provided', async () => {
		const productId = new mongoose.Types.ObjectId().toString();

		const response = await request(app)
			.delete(`/api/cart/cart/items/${productId}`);

		expect(response.statusCode).toBe(401);
		expect(response.body).toHaveProperty('message', 'No token provided');
	});

	it('should return 403 if user does not have required role', async () => {
		const productId = new mongoose.Types.ObjectId().toString();
		const { token } = generateToken({ role: 'admin' });

		const response = await request(app)
			.delete(`/api/cart/cart/items/${productId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(403);
		expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
	});
});

describe('DELETE /api/cart/cart', () => {
	it('should clear the cart for an authenticated user', async () => {
		const { token, userId } = generateToken();
		const productId1 = new mongoose.Types.ObjectId().toString();
		const productId2 = new mongoose.Types.ObjectId().toString();

		await cartModel.create({
			user: userId,
			items: [
				{ productId: productId1, quantity: 2 },
				{ productId: productId2, quantity: 3 },
			],
		});

		const response = await request(app)
			.delete('/api/cart/cart')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Cart cleared');
		expect(response.body).toHaveProperty('cart');

		const { cart } = response.body;
		expect(cart.user).toBe(userId);
		expect(Array.isArray(cart.items)).toBe(true);
		expect(cart.items).toHaveLength(0);

		const cartInDb = await cartModel.findOne({ user: userId });
		expect(cartInDb).not.toBeNull();
		expect(cartInDb.items).toHaveLength(0);
	});

	it('should return 404 if cart does not exist for the user', async () => {
		const { token } = generateToken();

		const response = await request(app)
			.delete('/api/cart/cart')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(404);
		expect(response.body).toHaveProperty('message', 'Cart not found');
	});

	it('should return 401 if no token is provided', async () => {
		const response = await request(app)
			.delete('/api/cart/cart');

		expect(response.statusCode).toBe(401);
		expect(response.body).toHaveProperty('message', 'No token provided');
	});

	it('should return 403 if user does not have required role', async () => {
		const { token } = generateToken({ role: 'admin' });

		const response = await request(app)
			.delete('/api/cart/cart')
			.set('Authorization', `Bearer ${token}`);

		expect(response.statusCode).toBe(403);
		expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
	});
});

