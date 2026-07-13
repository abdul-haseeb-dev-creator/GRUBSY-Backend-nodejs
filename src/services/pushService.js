// grubsy-backend/src/services/pushService.js
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

class PushService {
  constructor() {
    this.fcmServerKey = process.env.FCM_SERVER_KEY || null;
  }

  isConfigured() {
    return !!this.fcmServerKey;
  }

  async getDriverTokens(driverId) {
    if (!driverId) return [];
    return prisma.drivers.findMany({
      where: { Driver_ID: driverId },
      select: { fcmToken: true },
    });
  }

  async getNearbyDriverTokens(restaurantLat, restaurantLng, radiusKm = 3.2) {
    // Get all available drivers with location and FCM tokens
    const drivers = await prisma.drivers.findMany({
      where: {
        availability: true,
        current_location_lat: { not: null },
        current_location_lng: { not: null },
        fcmToken: { not: null },
      },
      select: {
        Driver_ID: true,
        fcmToken: true,
        current_location_lat: true,
        current_location_lng: true,
        max_distance: true,
      },
    });

    // Filter by distance and driver's max_distance preference
    const nearbyDrivers = drivers.filter((driver) => {
      const distance = this.calculateDistance(
        restaurantLat,
        restaurantLng,
        driver.current_location_lat,
        driver.current_location_lng
      );
      const maxDist = driver.max_distance || radiusKm;
      return distance <= maxDist;
    });

    return nearbyDrivers.map((d) => d.fcmToken).filter(Boolean);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async sendToTokens(tokens, notification, data) {
    if (!this.isConfigured()) {
      console.warn('⚠️ FCM not configured (FCM_SERVER_KEY missing) – skipping push');
      return;
    }

    const tokenValues = tokens.map((t) => (typeof t === 'string' ? t : t.token)).filter(Boolean);
    if (!tokenValues.length) return;

    const body = {
      registration_ids: tokenValues,
      notification,
      data,
      priority: 'high',
    };

    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.fcmServerKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.warn('⚠️ FCM push failed:', res.status, text);
      } else {
        console.log('✅ FCM push sent to', tokenValues.length, 'devices');
      }
    } catch (err) {
      console.error('❌ FCM push error:', err);
    }
  }

  /**
   * Send notification to nearby drivers when order is ready for pickup
   * @param {string} orderId - Order ID
   * @param {object} order - Order with restaurant info
   */
  async notifyNearbyDrivers(orderId, order) {
    try {
      // Get restaurant location
      const merchant = await prisma.merchants.findUnique({
        where: { Grubsy_Partner_ID: order.partnerId },
        select: { coordinate_lat: true, coordinate_lng: true, Merchants_Name: true },
      });

      if (!merchant?.coordinate_lat || !merchant?.coordinate_lng) {
        console.log('⚠️ No restaurant coordinates for order', orderId);
        return;
      }

      // Get nearby driver FCM tokens (2 mile / 3.2km radius)
      const driverTokens = await this.getNearbyDriverTokens(
        merchant.coordinate_lat,
        merchant.coordinate_lng,
        3.2 // 2 miles in km
      );

      if (driverTokens.length === 0) {
        console.log('📭 No nearby drivers to notify for order', orderId);
        return;
      }

      const notification = {
        title: '🚗 New Order Available!',
        body: `Order #${orderId.slice(-6)} from ${merchant.Merchants_Name} - Tap to accept`,
      };

      const data = {
        type: 'new_order_available',
        orderId: orderId,
        restaurantName: merchant.Merchants_Name,
        click_action: 'AVAILABLE_ORDERS',
      };

      await this.sendToTokens(driverTokens, notification, data);
      console.log('📱 Notified', driverTokens.length, 'drivers about order', orderId);
    } catch (error) {
      console.error('❌ Error notifying nearby drivers:', error);
    }
  }

  async sendDriverChatNotification(message) {
    if (message.to !== 'driver' || !message.driverId) return;

    const tokens = await this.getDriverTokens(message.driverId);
    if (!tokens.length) return;

    const notification = {
      title: message.from === 'customer' ? 'New customer message' : 'New support message',
      body: message.text?.slice(0, 80) || 'New message',
    };

    const data = {
      type: 'order_update',
      orderId: message.orderId || '',
      conversationId: message.conversationId,
      messageId: message.id,
      from: message.from,
      to: message.to,
    };

    await this.sendToTokens(tokens, notification, data);
  }
}

export default new PushService();

