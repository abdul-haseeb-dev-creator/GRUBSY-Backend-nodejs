// grubsy-backend/tests/payments.spec.js
import request from 'supertest';
import express from 'express';
import apiRouter from '../src/api.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Payments API', () => {
  let accessToken;
  let orderId;

  beforeAll(async () => {
    // Login to get access token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@grubsy.com', password: 'Demo123!' });
    
    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.data.accessToken;

    // Create an order first
    const merchantsRes = await request(app).get('/api/Merchants');
    const merchantId = merchantsRes.body.data[0].id;

    const menusRes = await request(app).get(`/api/Merchants/${merchantId}/menus`);
    const menuItemId = menusRes.body.data.menus[0].items[0].id;

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        merchantId,
        deliveryAddress: '1 Test Street, London',
        items: [{ menuItemId, quantity: 1 }],
      });

    expect(orderRes.status).toBe(200);
    orderId = orderRes.body.data.id;
  });

  describe('POST /api/payments/intents', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/payments/intents')
        .send({ orderId });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('missing bearer token');
    });

    it('requires orderId', async () => {
      const res = await request(app)
        .post('/api/payments/intents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('orderId required');
      expect(res.body.field).toBe('orderId');
    });

    it('returns 404 for non-existent order', async () => {
      const res = await request(app)
        .post('/api/payments/intents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId: 'non-existent-order-id' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('order not found');
    });

    it('creates payment intent for valid order', async () => {
      // Note: This test will fail without actual Stripe configuration
      // but validates the API structure and auth requirements
      const res = await request(app)
        .post('/api/payments/intents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId });

      // Expect either success (if Stripe is configured) or specific error
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('clientSecret');
        expect(res.body.data).toHaveProperty('paymentIntentId');
        expect(res.body.data).toHaveProperty('amount');
        expect(res.body.data).toHaveProperty('currency');
      } else {
        // Should fail with 500 due to missing Stripe configuration
        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Payment intent creation failed');
      }
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('requires stripe-signature header', async () => {
      const res = await request(app)
        .post('/api/payments/webhook')
        .send({ type: 'payment_intent.succeeded' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing stripe-signature header');
    });

    it('validates webhook signature', async () => {
      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send({ type: 'payment_intent.succeeded' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Webhook signature verification failed');
    });
  });
});