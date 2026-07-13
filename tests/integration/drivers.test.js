// grubsy-backend/tests/integration/drivers.test.js
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/server.js';

const prisma = new PrismaClient();

describe('Driver API Integration Tests', () => {
  let testDriver;
  let driverToken;

  beforeAll(async () => {
    // Clean up test data
    await prisma.driver.deleteMany({
      where: { phone: { startsWith: '+1555' } },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.driver.deleteMany({
      where: { phone: { startsWith: '+1555' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/driver/auth/login', () => {
    it('should login driver with valid phone and OTP', async () => {
      const response = await request(app)
        .post('/api/driver/auth/login')
        .send({
          phone: '+15551234567',
          otp: '123456',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('driver');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.driver.phone).toBe('+15551234567');

      // Store for subsequent tests
      testDriver = response.body.data.driver;
      driverToken = response.body.data.accessToken;
    });

    it('should reject login with missing phone', async () => {
      const response = await request(app)
        .post('/api/driver/auth/login')
        .send({
          otp: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing OTP', async () => {
      const response = await request(app)
        .post('/api/driver/auth/login')
        .send({
          phone: '+15551234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with empty OTP', async () => {
      const response = await request(app)
        .post('/api/driver/auth/login')
        .send({
          phone: '+15551234567',
          otp: '',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/driver/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      // Get refresh token from login
      const loginResponse = await request(app)
        .post('/api/driver/auth/login')
        .send({
          phone: '+15551234568',
          otp: '123456',
        });
      
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/driver/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/driver/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/driver/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/driver/profile', () => {
    it('should get driver profile with valid token', async () => {
      const response = await request(app)
        .get('/api/driver/profile')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('phone');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('vehicle');
      expect(response.body.data).toHaveProperty('rating');
      expect(response.body.data).toHaveProperty('isAvailable');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/driver/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/driver/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/driver/profile', () => {
    it('should update driver profile', async () => {
      const updateData = {
        name: 'Updated Driver Name',
        vehicle: 'Updated Vehicle',
        isAvailable: true,
      };

      const response = await request(app)
        .put('/api/driver/profile')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.vehicle).toBe(updateData.vehicle);
      expect(response.body.data.isAvailable).toBe(updateData.isAvailable);
    });

    it('should update partial profile data', async () => {
      const updateData = {
        name: 'Partially Updated Name',
      };

      const response = await request(app)
        .put('/api/driver/profile')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .put('/api/driver/profile')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/driver/location', () => {
    it('should update driver location', async () => {
      const locationData = {
        lat: 51.5074,
        lng: -0.1278,
      };

      const response = await request(app)
        .put('/api/driver/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lat).toBe(locationData.lat);
      expect(response.body.data.lng).toBe(locationData.lng);
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should reject invalid coordinates', async () => {
      const response = await request(app)
        .put('/api/driver/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          lat: 'invalid',
          lng: -0.1278,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing coordinates', async () => {
      const response = await request(app)
        .put('/api/driver/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          lat: 51.5074,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .put('/api/driver/location')
        .send({
          lat: 51.5074,
          lng: -0.1278,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/driver/orders', () => {
    it('should get driver orders', async () => {
      const response = await request(app)
        .get('/api/driver/orders')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/driver/orders?status=PENDING')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/driver/orders?limit=5&offset=0')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/driver/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Driver Order Actions', () => {
    let testOrder;

    beforeAll(async () => {
      // Create a test order for driver actions
      // This would typically be created through the order creation flow
      // For testing purposes, we'll create it directly in the database
      const testUser = await prisma.user.findFirst();
      const testRestaurant = await prisma.restaurant.findFirst();
      
      if (testUser && testRestaurant) {
        testOrder = await prisma.order.create({
          data: {
            userId: testUser.id,
            restaurantId: testRestaurant.id,
            status: 'PENDING',
            totalAmount: 1500,
            currency: 'GBP',
          },
        });
      }
    });

    afterAll(async () => {
      if (testOrder) {
        await prisma.order.delete({
          where: { id: testOrder.id },
        });
      }
    });

    describe('PUT /api/driver/orders/:orderId/accept', () => {
      it('should accept a pending order', async () => {
        if (!testOrder) {
          console.log('Skipping order acceptance test - no test order available');
          return;
        }

        const response = await request(app)
          .put(`/api/driver/orders/${testOrder.id}/accept`)
          .set('Authorization', `Bearer ${driverToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('ACCEPTED');
        expect(response.body.data.driverId).toBe(testDriver.id);
      });

      it('should reject request for non-existent order', async () => {
        const response = await request(app)
          .put('/api/driver/orders/non-existent-id/accept')
          .set('Authorization', `Bearer ${driverToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .put('/api/driver/orders/some-id/accept');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/driver/orders/:orderId/pickup', () => {
      it('should mark accepted order as picked up', async () => {
        if (!testOrder) {
          console.log('Skipping order pickup test - no test order available');
          return;
        }

        const response = await request(app)
          .put(`/api/driver/orders/${testOrder.id}/pickup`)
          .set('Authorization', `Bearer ${driverToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PICKED_UP');
      });
    });

    describe('PUT /api/driver/orders/:orderId/deliver', () => {
      it('should mark picked up order as delivered', async () => {
        if (!testOrder) {
          console.log('Skipping order delivery test - no test order available');
          return;
        }

        const response = await request(app)
          .put(`/api/driver/orders/${testOrder.id}/deliver`)
          .set('Authorization', `Bearer ${driverToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('DELIVERED');
        expect(response.body.data).toHaveProperty('deliveredAt');
      });
    });
  });
});