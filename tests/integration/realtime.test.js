// grubsy-backend/tests/integration/realtime.test.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import realtimeService from '../../src/realtime.js';

const prisma = new PrismaClient();

describe('Realtime Service Integration Tests', () => {
  let httpServer;
  let clientSocket;
  let driverSocket;
  let testDriver;
  let testUser;
  let driverToken;
  let userToken;

  beforeAll(async () => {
    // Create HTTP server and Socket.IO instance
    httpServer = createServer();
    new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Initialize realtime service
    realtimeService.initialize(httpServer);

    // Start server
    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });

    const port = httpServer.address().port;

    // Create test driver and user
    testDriver = await prisma.driver.create({
      data: {
        phone: '+15559876543',
        name: 'Test Driver',
        vehicle: 'Test Vehicle',
        rating: 5.0,
        isAvailable: true,
      },
    });

    testUser = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        name: 'Test User',
        phone: '+15559876544',
      },
    });

    // Generate JWT tokens
    driverToken = jwt.sign(
      { 
        sub: testDriver.id, 
        role: 'driver', 
        aud: 'driver',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    );

    userToken = jwt.sign(
      { 
        sub: testUser.id, 
        role: 'CUSTOMER',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    );

    // Create client connections
    clientSocket = new Client(`http://localhost:${port}`, {
      auth: { token: userToken },
    });

    driverSocket = new Client(`http://localhost:${port}`, {
      auth: { token: driverToken },
    });

    // Wait for connections
    await Promise.all([
      new Promise((resolve) => clientSocket.on('connect', resolve)),
      new Promise((resolve) => driverSocket.on('connect', resolve)),
    ]);
  });

  afterAll(async () => {
    // Clean up
    if (clientSocket) clientSocket.close();
    if (driverSocket) driverSocket.close();
    if (httpServer) httpServer.close();

    // Clean up test data
    await prisma.driver.delete({ where: { id: testDriver.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('Connection and Authentication', () => {
    it('should connect driver with valid JWT token', (done) => {
      expect(driverSocket.connected).toBe(true);
      done();
    });

    it('should connect user with valid JWT token', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    it('should reject connection with invalid token', (done) => {
      const invalidSocket = new Client(`http://localhost:${httpServer.address().port}`, {
        auth: { token: 'invalid-token' },
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        invalidSocket.close();
        done();
      });
    });
  });

  describe('Driver Location Updates', () => {
    it('should handle driver location updates', (done) => {
      const locationData = {
        lat: 51.5074,
        lng: -0.1278,
      };

      driverSocket.emit('driver:location', locationData);

      // Verify location was updated in database
      setTimeout(async () => {
        const updatedDriver = await prisma.driver.findUnique({
          where: { id: testDriver.id },
        });

        expect(updatedDriver.lastLat).toBe(locationData.lat);
        expect(updatedDriver.lastLng).toBe(locationData.lng);
        done();
      }, 100);
    });

    it('should reject invalid location data', (done) => {
      const invalidLocationData = {
        lat: 'invalid',
        lng: -0.1278,
      };

      driverSocket.emit('driver:location', invalidLocationData);

      // Location should not be updated
      setTimeout(async () => {
        const driver = await prisma.driver.findUnique({
          where: { id: testDriver.id },
        });

        // Should still have previous valid location
        expect(driver.lastLat).toBe(51.5074);
        expect(driver.lastLng).toBe(-0.1278);
        done();
      }, 100);
    });
  });

  describe('Driver Availability Updates', () => {
    it('should handle driver availability updates', (done) => {
      driverSocket.on('driver:availability_updated', (data) => {
        expect(data.isAvailable).toBe(false);
        done();
      });

      driverSocket.emit('driver:availability', false);
    });

    it('should update availability in database', (done) => {
      driverSocket.emit('driver:availability', true);

      setTimeout(async () => {
        const updatedDriver = await prisma.driver.findUnique({
          where: { id: testDriver.id },
        });

        expect(updatedDriver.isAvailable).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Order Subscription', () => {
    let testOrder;

    beforeAll(async () => {
      // Create test restaurant
      const testRestaurant = await prisma.restaurant.create({
        data: {
          name: 'Test Restaurant',
          address: 'Test Address',
          phone: '+15559876545',
        },
      });

      // Create test order
      testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          restaurantId: testRestaurant.id,
          status: 'PENDING',
          totalAmount: 1500,
          currency: 'GBP',
        },
      });
    });

    afterAll(async () => {
      if (testOrder) {
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.restaurant.delete({ where: { id: testOrder.restaurantId } });
      }
    });

    it('should allow subscription to order updates', (done) => {
      clientSocket.emit('subscribe:order', testOrder.id);

      // Verify subscription by sending an update
      setTimeout(() => {
        clientSocket.on('order:update', (data) => {
          expect(data.orderId).toBe(testOrder.id);
          done();
        });

        // Simulate order update
        realtimeService.sendOrderUpdateToSubscribers(testOrder.id, {
          orderId: testOrder.id,
          status: 'ACCEPTED',
          message: 'Order accepted',
          timestamp: new Date().toISOString(),
        });
      }, 100);
    });

    it('should allow unsubscription from order updates', (done) => {
      let updateReceived = false;

      clientSocket.on('order:update', () => {
        updateReceived = true;
      });

      // Unsubscribe from order
      clientSocket.emit('unsubscribe:order', testOrder.id);

      setTimeout(() => {
        // Send update after unsubscription
        realtimeService.sendOrderUpdateToSubscribers(testOrder.id, {
          orderId: testOrder.id,
          status: 'PICKED_UP',
          message: 'Order picked up',
          timestamp: new Date().toISOString(),
        });

        // Wait and check if update was received
        setTimeout(() => {
          expect(updateReceived).toBe(false);
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Order Assignment and Actions', () => {
    let testOrder;

    beforeAll(async () => {
      const testRestaurant = await prisma.restaurant.create({
        data: {
          name: 'Test Restaurant 2',
          address: 'Test Address 2',
          phone: '+15559876546',
        },
      });

      testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          restaurantId: testRestaurant.id,
          status: 'PENDING',
          totalAmount: 2000,
          currency: 'GBP',
        },
      });
    });

    afterAll(async () => {
      if (testOrder) {
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.restaurant.delete({ where: { id: testOrder.restaurantId } });
      }
    });

    it('should handle order acceptance by driver', (done) => {
      driverSocket.on('order:accepted', (data) => {
        expect(data.orderId).toBe(testOrder.id);
        done();
      });

      driverSocket.emit('driver:accept_order', testOrder.id);
    });

    it('should update order status in database on acceptance', (done) => {
      setTimeout(async () => {
        const updatedOrder = await prisma.order.findUnique({
          where: { id: testOrder.id },
        });

        expect(updatedOrder.status).toBe('ACCEPTED');
        expect(updatedOrder.driverId).toBe(testDriver.id);
        expect(updatedOrder.driverAssignedAt).toBeTruthy();
        done();
      }, 200);
    });

    it('should handle order status updates', (done) => {
      driverSocket.on('order:status_updated', (data) => {
        expect(data.orderId).toBe(testOrder.id);
        expect(data.status).toBe('PICKED_UP');
        done();
      });

      driverSocket.emit('driver:order_status', {
        orderId: testOrder.id,
        status: 'PICKED_UP',
      });
    });

    it('should notify user of order status changes', (done) => {
      clientSocket.on('order:update', (data) => {
        expect(data.orderId).toBe(testOrder.id);
        expect(data.status).toBe('DELIVERED');
        done();
      });

      // Subscribe to order updates
      clientSocket.emit('subscribe:order', testOrder.id);

      setTimeout(() => {
        driverSocket.emit('driver:order_status', {
          orderId: testOrder.id,
          status: 'DELIVERED',
        });
      }, 100);
    });
  });

  describe('Real-time Location Broadcasting', () => {
    let testOrder;

    beforeAll(async () => {
      const testRestaurant = await prisma.restaurant.create({
        data: {
          name: 'Test Restaurant 3',
          address: 'Test Address 3',
          phone: '+15559876547',
        },
      });

      testOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          restaurantId: testRestaurant.id,
          driverId: testDriver.id,
          status: 'ACCEPTED',
          totalAmount: 1800,
          currency: 'GBP',
        },
      });
    });

    afterAll(async () => {
      if (testOrder) {
        await prisma.order.delete({ where: { id: testOrder.id } });
        await prisma.restaurant.delete({ where: { id: testOrder.restaurantId } });
      }
    });

    it('should broadcast driver location to users tracking orders', (done) => {
      clientSocket.on('driver:location', (data) => {
        expect(data.driverId).toBe(testDriver.id);
        expect(data.orderId).toBe(testOrder.id);
        expect(data.lat).toBe(51.5100);
        expect(data.lng).toBe(-0.1200);
        done();
      });

      // Driver updates location
      driverSocket.emit('driver:location', {
        lat: 51.5100,
        lng: -0.1200,
      });
    });
  });

  describe('Connection Management', () => {
    it('should track connected drivers', () => {
      expect(realtimeService.isDriverConnected(testDriver.id)).toBe(true);
      expect(realtimeService.getConnectedDriversCount()).toBeGreaterThan(0);
    });

    it('should track connected users', () => {
      expect(realtimeService.isUserConnected(testUser.id)).toBe(true);
      expect(realtimeService.getConnectedUsersCount()).toBeGreaterThan(0);
    });

    it('should update driver availability on disconnect', (done) => {
      const tempDriverSocket = new Client(`http://localhost:${httpServer.address().port}`, {
        auth: { token: driverToken },
      });

      tempDriverSocket.on('connect', () => {
        tempDriverSocket.disconnect();

        setTimeout(async () => {
          const driver = await prisma.driver.findUnique({
            where: { id: testDriver.id },
          });

          // Driver should be marked as unavailable on disconnect
          expect(driver.isAvailable).toBe(false);
          done();
        }, 200);
      });
    });
  });
});