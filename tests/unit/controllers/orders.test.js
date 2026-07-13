const request = require('supertest');
const express = require('express');
const ordersController = require('../../../controllers/orders');

// Mock dependencies
jest.mock('../../../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'establishment' };
    next();
  },
}));

describe('Orders Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/orders', ordersController.getAll);
    app.get('/orders/:id', ordersController.getById);
    app.put('/orders/:id/status', ordersController.updateStatus);
    app.post('/orders/:id/photos', ordersController.uploadPhotos);
  });

  describe('GET /orders', () => {
    it('should return orders list', async () => {
      const response = await request(app)
        .get('/orders')
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/orders?status=pending')
        .expect(200);

      expect(response.body).toHaveProperty('orders');
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order details', async () => {
      const response = await request(app)
        .get('/orders/test-order-id')
        .expect(200);

      expect(response.body).toHaveProperty('order');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/orders/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /orders/:id/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .put('/orders/test-order-id/status')
        .send({ status: 'preparing' })
        .expect(200);

      expect(response.body).toHaveProperty('order');
      expect(response.body.order.status).toBe('preparing');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .put('/orders/test-order-id/status')
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /orders/:id/photos', () => {
    it('should handle photo upload', async () => {
      const response = await request(app)
        .post('/orders/test-order-id/photos')
        .attach('beforePacked', Buffer.from('test-image'), 'test.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('photos');
    });

    it('should validate photo types', async () => {
      const response = await request(app)
        .post('/orders/test-order-id/photos')
        .attach('invalidType', Buffer.from('test-image'), 'test.jpg')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});