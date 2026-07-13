const request = require('supertest');
const app = require('../../app');

describe('Payment Integration Tests', () => {
  // Set environment to test mode
  const originalEnv = process.env.NODE_ENV;
  
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Payment Intent Creation', () => {
    it('should create a payment intent successfully', async () => {
      const paymentData = {
        amount: 25.99,
        currency: 'gbp',
        paymentMethod: 'card',
        orderId: 'test-order-123',
        metadata: {
          userId: 'test-user-456',
        },
      };

      const response = await request(app)
        .post('/api/payments/intent')
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('paymentIntent');
      expect(response.body.paymentIntent).toHaveProperty('id');
      expect(response.body.paymentIntent).toHaveProperty('amount');
      expect(response.body.paymentIntent).toHaveProperty('currency', 'gbp');
      expect(response.body.paymentIntent).toHaveProperty('client_secret');
      expect(response.body.paymentIntent).toHaveProperty('status');
    });

    it('should handle missing required fields', async () => {
      const paymentData = {
        amount: 25.99,
        // Missing paymentMethod and orderId
      };

      const response = await request(app)
        .post('/api/payments/intent')
        .send(paymentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Payment Confirmation', () => {
    it('should confirm a payment successfully', async () => {
      const paymentData = {
        paymentIntentId: 'pi_mock_123456789',
        paymentMethod: 'card',
        orderId: 'test-order-123',
      };

      const response = await request(app)
        .post('/api/payments/confirm')
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('payment');
      expect(response.body).toHaveProperty('orderId', 'test-order-123');
      expect(response.body.payment).toHaveProperty('status');
    });

    it('should handle missing required fields', async () => {
      const paymentData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/payments/confirm')
        .send(paymentData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Refund Processing', () => {
    it('should process a refund successfully', async () => {
      const refundData = {
        paymentMethod: 'card',
        paymentId: 'pi_mock_123456789',
        amount: 10.99,
        reason: 'requested_by_customer',
      };

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', 'Bearer test-token')
        .send(refundData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('refund');
      expect(response.body.refund).toHaveProperty('amount', 10.99);
      expect(response.body.refund).toHaveProperty('status', 'completed');
    });
  });
});