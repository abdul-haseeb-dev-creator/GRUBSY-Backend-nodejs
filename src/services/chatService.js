// grubsy-backend/src/services/chatService.js
import { PrismaClient } from '@prisma/client';
import pushService from './pushService.js';

const prisma = new PrismaClient();

class ChatService {
  /**
   * Create a chat message from a driver (driver -> customer | support)
   * This performs validation, persists to DB, and triggers push for driver-targeted messages.
   */
  async createDriverMessage(payload) {
    const {
      driverId,
      conversationId,
      orderId,
      to,
      text,
      timestamp,
      metadata,
    } = payload;

    if (!driverId) {
      throw new Error('driverId is required');
    }
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    if (!to) {
      throw new Error('`to` is required');
    }
    if (!text || typeof text !== 'string') {
      throw new Error('`text` is required');
    }

    let order = null;
    let userId = null;

    if (orderId) {
      order = await prisma.orders.findUnique({
        where: { orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Validate driver is assigned (current or reallocated)
      const validDriverIds = [order.driverId, order.reallocatedDriverId].filter(Boolean);
      if (!validDriverIds.includes(driverId)) {
        throw new Error('Driver is not assigned to this order');
      }

      userId = order.userId || null;
    }

    const created = await prisma.chat_Message.create({
      data: {
        conversationId,
        orderId: orderId || null,
        fromRole: 'driver',
        toRole: to,
        driverId,
        userId,
        text,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        metadata: metadata ? metadata : undefined,
      },
    });

    const message = {
      id: created.id,
      conversationId: created.conversationId,
      orderId: created.orderId || null,
      from: 'driver',
      to,
      driverId,
      userId,
      text: created.text,
      timestamp: created.timestamp.toISOString(),
      metadata: created.metadata || null,
    };

    // Trigger push if message is addressed to driver (for completeness)
    await pushService.sendDriverChatNotification(message);

    return message;
  }

  /**
   * Fetch historical messages for a driver (by conversation or order).
   * Mirrors the WebSocket payload shape for the mobile client.
   */
  async getDriverMessages({ driverId, orderId, conversationId, limit = 100 }) {
    if (!driverId) {
      throw new Error('driverId is required');
    }

    const where = {
      driverId,
    };

    if (orderId) {
      where.orderId = orderId;
    }
    if (conversationId) {
      where.conversationId = conversationId;
    }

    // Basic validation: ensure driver is actually related to the order when orderId provided
    if (orderId) {
      const order = await prisma.orders.findUnique({
        where: { orderId },
      });
      if (!order) {
        throw new Error('Order not found');
      }
      const validDriverIds = [order.driverId, order.reallocatedDriverId].filter(Boolean);
      if (!validDriverIds.includes(driverId)) {
        throw new Error('Driver is not assigned to this order');
      }
    }

    const messages = await prisma.chat_Message.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      orderId: m.orderId,
      from: m.fromRole,
      to: m.toRole,
      driverId: m.driverId,
      userId: m.userId,
      text: m.text,
      timestamp: m.timestamp.toISOString(),
      metadata: m.metadata || null,
    }));
  }
}

export default new ChatService();

