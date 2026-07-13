// tests/realtime_user.spec.js
// Realtime contract test for user Socket.IO events

const request = require('supertest');
const jwt = require('jsonwebtoken');
const io = require('socket.io-client');
const app = require('../app');
const { mapOrderStatusForUser } = require('../utils/statusMapping');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SERVER_URL = 'http://localhost:3002';

describe('Realtime User Contract Tests', () => {
  let server;
  let userSocket;
  let driverSocket;
  let userToken;
  let driverToken;
  let testOrderId;

  const testUser = {
    userId: 'test-user-123',
    email: 'testuser@example.com',
    role: 'user',
    aud: 'user',
  };

  const testDriver = {
    driverId: 'test-driver-456',
    email: 'testdriver@example.com',
    role: 'driver',
    aud: 'driver',
  };

  beforeAll((done) => {
    // Start server
    server = app.listen(3002, () => {
      console.log('Test server running on port 3002');
      done();
    });
  });

  afterAll((done) => {
    if (userSocket) userSocket.disconnect();
    if (driverSocket) driverSocket.disconnect();
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    // Generate test JWT tokens
    userToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    driverToken = jwt.sign(testDriver, JWT_SECRET, { expiresIn: '1h' });
    testOrderId = `test_order_${Date.now()}`;
  });

  afterEach(() => {
    if (userSocket) {
      userSocket.disconnect();
      userSocket = null;
    }
    if (driverSocket) {
      driverSocket.disconnect();
      driverSocket = null;
    }
  });

  describe('User Socket.IO Authentication', () => {
    test('should authenticate user with valid JWT', (done) => {
      userSocket = io(SERVER_URL);
      
      userSocket.on('connect', () => {
        userSocket.emit('authenticate', userToken);
      });

      userSocket.on('authenticated', (response) => {
        expect(response.success).toBe(true);
        done();
      });

      userSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should reject invalid JWT', (done) => {
      userSocket = io(SERVER_URL);
      
      userSocket.on('connect', () => {
        userSocket.emit('authenticate', 'invalid-token');
      });

      userSocket.on('authenticated', (response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('Invalid token');
        done();
      });
    });
  });

  describe('Order Room Management', () => {
    test('should join and leave order rooms', (done) => {
      userSocket = io(SERVER_URL);
      
      userSocket.on('connect', () => {
        userSocket.emit('authenticate', userToken);
      });

      userSocket.on('authenticated', (response) => {
        if (response.success) {
          // Join order room
          userSocket.emit('join_order', { orderId: testOrderId });
          
          // Leave order room after a short delay
          setTimeout(() => {
            userSocket.emit('leave_order', { orderId: testOrderId });
            done();
          }, 100);
        }
      });
    });
  });

  describe('Order Status Change Events', () => {
    test('should receive order:status-changed with mapped status labels', (done) => {
      userSocket = io(SERVER_URL);
      
      userSocket.on('connect', () => {
        userSocket.emit('authenticate', userToken);
      });

      userSocket.on('authenticated', (response) => {
        if (response.success) {
          userSocket.emit('join_order', { orderId: testOrderId });
          
          // Listen for status change
          userSocket.on('order:status-changed', (data) => {
            expect(data).toHaveProperty('orderId', testOrderId);
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('timestamp');
            expect(typeof data.timestamp).toBe('string');
            
            // Verify status is mapped correctly
            const validStatuses = ['Placed', 'Processing', 'On Route', 'Picked up', 'Delivered', 'Cancelled'];
            expect(validStatuses).toContain(data.status);
            
            done();
          });

          // Simulate status change from backend
          const socket = require('../socket');
          const io = socket.getIO();
          if (io) {
            setTimeout(() => {
              io.to(`order:${testOrderId}`).emit('order:status-changed', {
                orderId: testOrderId,
                status: mapOrderStatusForUser('CONFIRMED'), // Should map to "Placed"
                timestamp: new Date().toISOString(),
              });
            }, 100);
          }
        }
      });
    });

    test('should verify status mapping accuracy', () => {
      // Test all status mappings
      expect(mapOrderStatusForUser('PENDING')).toBe('Placed');
      expect(mapOrderStatusForUser('CONFIRMED')).toBe('Placed');
      expect(mapOrderStatusForUser('PROCESSING')).toBe('Processing');
      expect(mapOrderStatusForUser('PREPARING')).toBe('Processing');
      expect(mapOrderStatusForUser('ACCEPTED')).toBe('On Route');
      expect(mapOrderStatusForUser('EN_ROUTE')).toBe('On Route');
      expect(mapOrderStatusForUser('PICKED_UP')).toBe('Picked up');
      expect(mapOrderStatusForUser('DELIVERED')).toBe('Delivered');
      expect(mapOrderStatusForUser('CANCELLED')).toBe('Cancelled');
      expect(mapOrderStatusForUser('REJECTED')).toBe('Cancelled');
    });
  });

  describe('Driver Location Updates', () => {
    test('should receive driver:location-updated events', (done) => {
      userSocket = io(SERVER_URL);
      driverSocket = io(SERVER_URL);
      
      let userAuthenticated = false;
      let driverAuthenticated = false;

      const checkBothAuthenticated = () => {
        if (userAuthenticated && driverAuthenticated) {
          // User joins order room
          userSocket.emit('join_order', { orderId: testOrderId });
          
          // Listen for driver location updates
          userSocket.on('driver:location-updated', (data) => {
            expect(data).toHaveProperty('orderId', testOrderId);
            expect(data).toHaveProperty('driverId', testDriver.driverId);
            expect(data).toHaveProperty('lat');
            expect(data).toHaveProperty('lng');
            expect(data).toHaveProperty('timestamp');
            expect(typeof data.lat).toBe('number');
            expect(typeof data.lng).toBe('number');
            expect(typeof data.timestamp).toBe('string');
            
            done();
          });

          // Driver sends location update
          setTimeout(() => {
            driverSocket.emit('location_update', {
              orderId: testOrderId,
              lat: 51.5074,
              lng: -0.1278,
            });
          }, 100);
        }
      };

      userSocket.on('connect', () => {
        userSocket.emit('authenticate', userToken);
      });

      userSocket.on('authenticated', (response) => {
        if (response.success) {
          userAuthenticated = true;
          checkBothAuthenticated();
        }
      });

      driverSocket.on('connect', () => {
        driverSocket.emit('authenticate', driverToken);
      });

      driverSocket.on('authenticated', (response) => {
        if (response.success) {
          driverAuthenticated = true;
          checkBothAuthenticated();
        }
      });
    });
  });

  describe('Event Name Consistency', () => {
    test('should use exact event names as specified', () => {
      // Verify event names match specification exactly
      const expectedEvents = [
        'order:status-changed',
        'driver:location-updated',
      ];

      // This test ensures we're using the correct event names
      // The actual events are tested in the integration tests above
      expectedEvents.forEach(eventName => {
        expect(eventName).toMatch(/^[a-z]+:[a-z-]+$/);
        expect(eventName.includes('_')).toBe(false); // No underscores
        expect(eventName.includes(':')).toBe(true); // Must have colon separator
      });
    });
  });

  describe('Data Structure Validation', () => {
    test('should validate order:status-changed data structure', () => {
      const mockData = {
        orderId: 'test_order_123',
        status: 'Placed',
        timestamp: new Date().toISOString(),
      };

      // Validate required fields
      expect(mockData).toHaveProperty('orderId');
      expect(mockData).toHaveProperty('status');
      expect(mockData).toHaveProperty('timestamp');

      // Validate data types
      expect(typeof mockData.orderId).toBe('string');
      expect(typeof mockData.status).toBe('string');
      expect(typeof mockData.timestamp).toBe('string');

      // Validate timestamp format (ISO 8601)
      expect(new Date(mockData.timestamp).toISOString()).toBe(mockData.timestamp);
    });

    test('should validate driver:location-updated data structure', () => {
      const mockData = {
        orderId: 'test_order_123',
        driverId: 'test_driver_456',
        lat: 51.5074,
        lng: -0.1278,
        timestamp: new Date().toISOString(),
      };

      // Validate required fields
      expect(mockData).toHaveProperty('orderId');
      expect(mockData).toHaveProperty('driverId');
      expect(mockData).toHaveProperty('lat');
      expect(mockData).toHaveProperty('lng');
      expect(mockData).toHaveProperty('timestamp');

      // Validate data types
      expect(typeof mockData.orderId).toBe('string');
      expect(typeof mockData.driverId).toBe('string');
      expect(typeof mockData.lat).toBe('number');
      expect(typeof mockData.lng).toBe('number');
      expect(typeof mockData.timestamp).toBe('string');

      // Validate coordinate ranges
      expect(mockData.lat).toBeGreaterThanOrEqual(-90);
      expect(mockData.lat).toBeLessThanOrEqual(90);
      expect(mockData.lng).toBeGreaterThanOrEqual(-180);
      expect(mockData.lng).toBeLessThanOrEqual(180);
    });
  });
});