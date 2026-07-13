// tests/security.spec.js
// Comprehensive security test suite for Phase A hardening

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Security Hardening Phase A', () => {
  let testUser;
  let testOrder;
  let userToken;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        fullName: 'Security Test User',
        email: 'security@test.com',
        address: '123 Security St',
        phone: '+44123456789',
        dob: new Date('1990-01-01'),
        passwordHash: 'hashed_password',
      },
    });

    // Generate test token
    userToken = jwt.sign(
      { userId: testUser.id, aud: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test order
    testOrder = await prisma.order.create({
      data: {
        orderId: 'test_security_order_123',
        userId: testUser.id,
        userEmail: testUser.email,
        items: [{ name: 'Test Item', size: 'Regular', quantity: 1 }],
        deliveryAddress: '123 Test St',
        postcode: 'SW1A 1AA',
        paymentMethod: 'stripe',
        subtotal: 10.00,
        deliveryFee: 2.50,
        serviceFee: 0.50,
        grandTotal: 13.00,
        status: 'PENDING',
        totalCents: 1300,
        currency: 'GBP',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.order.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('Joi Request Validation', () => {
    it('should reject invalid user registration data', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          fullName: '', // Invalid: empty
          email: 'invalid-email', // Invalid: not email format
          password: '123', // Invalid: too short
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('validation');
    });

    it('should reject invalid order creation data', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [], // Invalid: empty array
          deliveryAddress: '', // Invalid: empty
          grandTotal: -5, // Invalid: negative
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('validation');
    });
  });

  describe('HTTP Rate Limiting', () => {
    it('should rate limit user registration attempts', async () => {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 12; i++) {
        requests.push(
          request(app)
            .post('/api/users/register')
            .send({
              fullName: `Test User ${i}`,
              email: `test${i}@example.com`,
              password: 'password123',
              address: '123 Test St',
              phone: '+44123456789',
              dob: '1990-01-01',
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Should have some rate limited responses (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Idempotency Protection', () => {
    const idempotencyKey = 'test-idempotency-key-123';

    it('should prevent duplicate order creation with same idempotency key', async () => {
      const orderData = {
        items: [{ name: 'Test Item', size: 'Regular', quantity: 1 }],
        deliveryAddress: '123 Test St',
        postcode: 'SW1A 1AA',
        paymentMethod: 'stripe',
        subtotal: 10.00,
        deliveryFee: 2.50,
        serviceFee: 0.50,
        grandTotal: 13.00,
      };

      // First request
      const response1 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(orderData);

      expect(response1.status).toBe(201);

      // Second request with same key
      const response2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(orderData);

      // Should return cached response, not create duplicate
      expect(response2.status).toBe(201);
      expect(response2.body.order.orderId).toBe(response1.body.order.orderId);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});

describe('Logging Security', () => {
  it('should redact sensitive data from logs', () => {
    const { redactSensitiveData } = require('../middleware/logging');

    const sensitiveData = {
      password: 'secret123',
      token: 'jwt_token_here',
      authorization: 'Bearer token123',
      email: 'user@example.com',
      normalField: 'this should remain',
    };

    const redacted = redactSensitiveData(sensitiveData);

    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.email).toBe('[REDACTED]');
    expect(redacted.normalField).toBe('this should remain');
  });
});
