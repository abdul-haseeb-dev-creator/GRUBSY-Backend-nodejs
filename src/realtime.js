// grubsy-backend/src/realtime.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import assignmentService from './services/assignmentService.js';
import chatService from './services/chatService.js';

const prisma = new PrismaClient();

export class RealtimeService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket.id
    this.connectedDrivers = new Map(); // driverId -> socket.id
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      path: process.env.SOCKET_IO_PATH || '/socket.io',
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
      },
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.sub;
        socket.userRole = payload.role || 'CUSTOMER';
        socket.userAudience = payload.aud || 'user';
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      const isDriver = socket.userAudience === 'driver';
      console.log(`${isDriver ? 'Driver' : 'User'} ${socket.userId} connected (${socket.id})`);
      
      // Store connection
      if (isDriver) {
        this.connectedDrivers.set(socket.userId, socket.id);
        socket.join(`driver:${socket.userId}`);
        socket.join('role:DRIVER');
        
        // Update driver availability on connection
        this.updateDriverAvailability(socket.userId, true);
      } else {
        this.connectedUsers.set(socket.userId, socket.id);
        socket.join(`user:${socket.userId}`);
        socket.join(`role:${socket.userRole}`);
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`${isDriver ? 'Driver' : 'User'} ${socket.userId} disconnected (${socket.id})`);
        
        if (isDriver) {
          this.connectedDrivers.delete(socket.userId);
          // Update driver availability on disconnection
          this.updateDriverAvailability(socket.userId, false);
        } else {
          this.connectedUsers.delete(socket.userId);
        }
      });

      // Handle order status subscription
      socket.on('subscribe:order', (orderId) => {
        socket.join(`order:${orderId}`);
        console.log(`${isDriver ? 'Driver' : 'User'} ${socket.userId} subscribed to order ${orderId}`);
      });

      // Handle order status unsubscription
      socket.on('unsubscribe:order', (orderId) => {
        socket.leave(`order:${orderId}`);
        console.log(`${isDriver ? 'Driver' : 'User'} ${socket.userId} unsubscribed from order ${orderId}`);
      });

      // Driver-specific events
      if (isDriver) {
        // Handle location updates from driver
        socket.on('driver:location', async (locationData) => {
          await this.handleDriverLocationUpdate(socket.userId, locationData);
        });

        // Handle driver availability toggle
        socket.on('driver:availability', async (isAvailable) => {
          await this.handleDriverAvailabilityUpdate(socket.userId, isAvailable);
        });

        // Handle order acceptance
        socket.on('driver:accept_order', async (orderId) => {
          await this.handleOrderAcceptance(socket.userId, orderId);
        });

        // Handle order rejection
        socket.on('driver:reject_order', async (orderId) => {
          await this.handleOrderRejection(socket.userId, orderId);
        });

        // Handle order status updates
        socket.on('driver:order_status', async ({ orderId, status }) => {
          await this.handleOrderStatusUpdate(socket.userId, orderId, status);
        });

        // Handle driver chat messages (driver -> customer/support)
        socket.on('chat_message', async (payload, callback) => {
          try {
            const message = await chatService.createDriverMessage({
              driverId: socket.userId,
              conversationId: payload.conversationId,
              orderId: payload.orderId,
              to: payload.to,
              text: payload.text,
              timestamp: payload.timestamp,
              metadata: payload.metadata,
            });

            // Broadcast to relevant rooms
            this.broadcastDriverChatMessage(message);

            if (typeof callback === 'function') {
              callback({ success: true, data: message });
            }
          } catch (error) {
            console.error('Error handling driver chat_message:', error);
            if (typeof callback === 'function') {
              callback({ success: false, error: error.message });
            }
          }
        });
      }
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Broadcast a driver-originated chat message to appropriate rooms.
   * - Echoes back to driver room
   * - Sends to order room (for customer/support listeners)
   */
  broadcastDriverChatMessage(message) {
    if (!this.io) return;

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      orderId: message.orderId,
      from: message.from,
      to: message.to,
      text: message.text,
      timestamp: message.timestamp,
    };

    // Echo to the driver's room so all of their devices stay in sync
    if (message.driverId) {
      this.io.to(`driver:${message.driverId}`).emit('chat_message', payload);
    }

    // Broadcast to order room for customer/support apps listening by order
    if (message.orderId) {
      this.io.to(`order:${message.orderId}`).emit('chat_message', payload);
    }
  }

  /**
   * Send order status update to specific user
   * @param {string} userId - User ID
   * @param {Object} orderUpdate - Order update data
   */
  sendOrderUpdate(userId, orderUpdate) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('order:update', orderUpdate);
    console.log(`Order update sent to user ${userId}:`, orderUpdate);
  }

  /**
   * Send order status update to all subscribers of an order
   * @param {string} orderId - Order ID
   * @param {Object} orderUpdate - Order update data
   */
  sendOrderUpdateToSubscribers(orderId, orderUpdate) {
    if (!this.io) return;
    
    this.io.to(`order:${orderId}`).emit('order:update', orderUpdate);
    console.log(`Order update sent to order ${orderId} subscribers:`, orderUpdate);
  }

  /**
   * Send notification to specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  sendNotification(userId, notification) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('notification', notification);
    console.log(`Notification sent to user ${userId}:`, notification);
  }

  /**
   * Send broadcast to all users with specific role
   * @param {string} role - User role (CUSTOMER, DRIVER, MERCHANT)
   * @param {Object} message - Message data
   */
  sendRoleBroadcast(role, message) {
    if (!this.io) return;
    
    this.io.to(`role:${role}`).emit('broadcast', message);
    console.log(`Broadcast sent to role ${role}:`, message);
  }

  /**
   * Get connected users count
   * @returns {number} Number of connected users
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   * @param {string} userId - User ID
   * @returns {boolean} True if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Check if driver is connected
   * @param {string} driverId - Driver ID
   * @returns {boolean} True if driver is connected
   */
  isDriverConnected(driverId) {
    return this.connectedDrivers.has(driverId);
  }

  /**
   * Get connected drivers count
   * @returns {number} Number of connected drivers
   */
  getConnectedDriversCount() {
    return this.connectedDrivers.size;
  }

  /**
   * Update driver availability in database
   * @param {string} driverId - Driver ID
   * @param {boolean} isAvailable - Availability status
   */
  async updateDriverAvailability(driverId, isAvailable) {
    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: { isAvailable },
      });
      console.log(`Driver ${driverId} availability updated to ${isAvailable}`);
    } catch (error) {
      console.error('Error updating driver availability:', error);
    }
  }

  /**
   * Handle driver location update
   * @param {string} driverId - Driver ID
   * @param {Object} locationData - Location data {lat, lng}
   */
  async handleDriverLocationUpdate(driverId, locationData) {
    const { lat, lng } = locationData;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('Invalid location data from driver:', driverId, locationData);
      return;
    }

    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          lastLat: lat,
          lastLng: lng,
        },
      });

      // Broadcast location to users tracking this driver's orders
      const activeOrders = await prisma.order.findMany({
        where: {
          driverId,
          status: { in: ['ACCEPTED', 'PICKED_UP'] },
        },
        select: { id: true, userId: true },
      });

      activeOrders.forEach(order => {
        this.io.to(`user:${order.userId}`).emit('driver:location', {
          orderId: order.id,
          driverId,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        });
      });

      console.log(`Driver ${driverId} location updated: ${lat}, ${lng}`);
    } catch (error) {
      console.error('Error handling driver location update:', error);
    }
  }

  /**
   * Handle driver availability update
   * @param {string} driverId - Driver ID
   * @param {boolean} isAvailable - Availability status
   */
  async handleDriverAvailabilityUpdate(driverId, isAvailable) {
    try {
      await this.updateDriverAvailability(driverId, isAvailable);
      
      // Notify driver of successful update
      this.io.to(`driver:${driverId}`).emit('driver:availability_updated', {
        isAvailable,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error handling driver availability update:', error);
    }
  }

  /**
   * Handle order acceptance by driver (transaction-safe)
   * @param {string} driverId - Driver ID
   * @param {string} orderId - Order ID
   */
  async handleOrderAcceptance(driverId, orderId) {
    return prisma.$transaction(async (tx) => {
      // 1) Check if order is available (with implicit lock via transaction)
      const order = await tx.orders.findFirst({
        where: {
          id: orderId,
          driverId: null,
          status: {
            in: ['PENDING', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER'],
          },
        },
      });

      if (!order) {
        return { success: false, code: 409, error: 'Order already accepted or not available' };
      }

      // 2) Attempt atomic update
      const updated = await tx.orders.updateMany({
        where: {
          id: orderId,
          driverId: null,
          status: {
            in: ['PENDING', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER'],
          },
        },
        data: {
          driverId,
          status: 'ALLOCATED_DRIVER', // Driver has been allocated/assigned
          driverAssignedAt: new Date(),
          driverAllocatedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return { success: false, code: 409, error: 'Order already accepted by another driver' };
      }

      const finalOrder = await tx.orders.findUnique({ where: { id: orderId } });
      return { success: true, order: finalOrder };
    }).then(result => {
      if (result.success) {
        // Notify user
        this.sendOrderUpdate(result.order.userId, {
          orderId,
          status: 'ALLOCATED_DRIVER',
          driverId,
          message: 'A driver has been assigned to your order',
          timestamp: new Date().toISOString(),
        });

        // Notify driver
        this.io.to(`driver:${driverId}`).emit('order:accepted', {
          orderId,
          order: result.order,
          timestamp: new Date().toISOString(),
        });

        console.log(`Order ${orderId} allocated to driver ${driverId}`);
      } else {
        // Notify driver of conflict
        this.io.to(`driver:${driverId}`).emit('order:error', {
          orderId,
          error: result.error,
          code: result.code,
          timestamp: new Date().toISOString(),
        });
      }
      return result;
    }).catch(error => {
      console.error('Error handling order acceptance:', error);

      // Notify driver of error
      this.io.to(`driver:${driverId}`).emit('order:error', {
        orderId,
        error: 'Failed to accept order',
        timestamp: new Date().toISOString(),
      });

      return { success: false, error: error.message };
    });
  }

  /**
   * Handle order rejection by driver
   * @param {string} driverId - Driver ID
   * @param {string} orderId - Order ID
   */
  async handleOrderRejection(driverId, orderId) {
    try {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'REJECTED',
          driverId: null,
          driverAssignedAt: null,
        },
      });

      // Try to reassign to another driver
      const reassignment = await assignmentService.reassignOrder(orderId, driverId);
      
      if (reassignment) {
        // Notify new driver
        this.sendOrderAssignment(reassignment.driver.id, {
          orderId,
          order: reassignment.order,
          distance: reassignment.distance,
        });
      } else {
        // No driver available, notify user
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true },
        });
        
        if (order) {
          this.sendOrderUpdate(order.userId, {
            orderId,
            status: 'PENDING',
            message: 'Looking for another driver...',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Notify rejecting driver
      this.io.to(`driver:${driverId}`).emit('order:rejected', {
        orderId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Order ${orderId} rejected by driver ${driverId}`);
    } catch (error) {
      console.error('Error handling order rejection:', error);
    }
  }

  /**
   * Handle order status update by driver
   * @param {string} driverId - Driver ID
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   */
  async handleOrderStatusUpdate(driverId, orderId, status) {
    try {
      const updateData = { status };
      
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      // Notify user
      this.sendOrderUpdate(updatedOrder.userId, {
        orderId,
        status,
        message: this.getStatusMessage(status),
        timestamp: new Date().toISOString(),
      });

      // Notify driver
      this.io.to(`driver:${driverId}`).emit('order:status_updated', {
        orderId,
        status,
        timestamp: new Date().toISOString(),
      });

      console.log(`Order ${orderId} status updated to ${status} by driver ${driverId}`);
    } catch (error) {
      console.error('Error handling order status update:', error);
    }
  }

  /**
   * Send order assignment to driver
   * @param {string} driverId - Driver ID
   * @param {Object} assignmentData - Assignment data
   */
  sendOrderAssignment(driverId, assignmentData) {
    if (!this.io) return;
    
    this.io.to(`driver:${driverId}`).emit('order:assignment', assignmentData);
    console.log(`Order assignment sent to driver ${driverId}:`, assignmentData);
  }

  /**
   * Get user-friendly status message
   * @param {string} status - Order status
   * @returns {string} User-friendly message
   */
  getStatusMessage(status) {
    const messages = {
      PENDING: 'Looking for a driver...',
      ACCEPTED: 'Order accepted by restaurant',
      READY_FOR_DRIVER: 'Order is ready for pickup',
      ALLOCATING_DRIVER: 'Finding an available driver...',
      ALLOCATED_DRIVER: 'Driver assigned, on the way to restaurant',
      AT_RESTAURANT: 'Driver is at the restaurant',
      PICKED_UP: 'Driver has picked up your order',
      OUT_FOR_DELIVERY: 'Your order is on the way',
      DELIVERED: 'Your order has been delivered',
      REJECTED: 'Looking for another driver...',
      CANCELLED: 'Your order has been cancelled',
    };
    
    return messages[status] || `Order status: ${status}`;
  }
}

export default new RealtimeService();