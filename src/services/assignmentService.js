// grubsy-backend/src/services/assignmentService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Assignment Service for matching orders with available drivers
 */
class AssignmentService {
  /**
   * Find available drivers near a restaurant location
   * @param {number} restaurantLat - Restaurant latitude
   * @param {number} restaurantLng - Restaurant longitude
   * @param {number} radiusKm - Search radius in kilometers (default: 10km)
   * @returns {Promise<Array>} Available drivers sorted by distance
   */
  async findAvailableDrivers(restaurantLat, restaurantLng, radiusKm = 10) {
    try {
      // Get all available drivers with location data
      const drivers = await prisma.driver.findMany({
        where: {
          isAvailable: true,
          lastLat: { not: null },
          lastLng: { not: null },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          vehicle: true,
          rating: true,
          lastLat: true,
          lastLng: true,
          updatedAt: true,
        },
      });

      // Calculate distances and filter by radius
      const driversWithDistance = drivers
        .map(driver => ({
          ...driver,
          distance: this.calculateDistance(
            restaurantLat,
            restaurantLng,
            driver.lastLat,
            driver.lastLng,
          ),
        }))
        .filter(driver => driver.distance <= radiusKm)
        .sort((a, b) => {
          // Sort by rating first (higher is better), then by distance (lower is better)
          if (Math.abs(a.rating - b.rating) > 0.1) {
            return b.rating - a.rating;
          }
          return a.distance - b.distance;
        });

      return driversWithDistance;

    } catch (error) {
      console.error('Error finding available drivers:', error);
      return [];
    }
  }

  /**
   * Auto-assign an order to the best available driver
   * @param {string} orderId - Order ID to assign
   * @returns {Promise<Object|null>} Assigned driver or null if no driver available
   */
  async autoAssignOrder(orderId) {
    try {
      // Get order with restaurant location
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              // Note: Restaurant location fields would need to be added to schema
              // For now, using mock coordinates for London
              // lat: true,
              // lng: true,
            },
          },
        },
      });

      if (!order || order.status !== 'PENDING') {
        console.log(`Order ${orderId} not found or not pending`);
        return null;
      }

      // Mock restaurant coordinates (London area)
      // In production, these would come from the restaurant record
      const restaurantLat = 51.5074 + (Math.random() - 0.5) * 0.1;
      const restaurantLng = -0.1278 + (Math.random() - 0.5) * 0.1;

      // Find available drivers
      const availableDrivers = await this.findAvailableDrivers(
        restaurantLat,
        restaurantLng,
        15, // 15km radius
      );

      if (availableDrivers.length === 0) {
        console.log(`No available drivers found for order ${orderId}`);
        return null;
      }

      // Assign to the best driver (first in sorted list)
      const bestDriver = availableDrivers[0];

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: bestDriver.id,
          driverAssignedAt: new Date(),
          // Note: Status remains PENDING until driver accepts
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicle: true,
              rating: true,
            },
          },
        },
      });

      console.log(`Order ${orderId} assigned to driver ${bestDriver.id} (${bestDriver.name})`);

      return {
        order: updatedOrder,
        driver: bestDriver,
        distance: bestDriver.distance,
      };

    } catch (error) {
      console.error('Error auto-assigning order:', error);
      return null;
    }
  }

  /**
   * Reassign an order to a different driver (e.g., after rejection)
   * @param {string} orderId - Order ID to reassign
   * @param {string} excludeDriverId - Driver ID to exclude from assignment
   * @returns {Promise<Object|null>} New assigned driver or null
   */
  async reassignOrder(orderId, excludeDriverId = null) {
    try {
      // Reset order assignment
      await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: null,
          driverAssignedAt: null,
          status: 'PENDING',
        },
      });

      // Get order with restaurant location
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      if (!order) {
        return null;
      }

      // Mock restaurant coordinates
      const restaurantLat = 51.5074 + (Math.random() - 0.5) * 0.1;
      const restaurantLng = -0.1278 + (Math.random() - 0.5) * 0.1;

      // Find available drivers, excluding the specified driver
      let availableDrivers = await this.findAvailableDrivers(
        restaurantLat,
        restaurantLng,
        20, // Wider radius for reassignment
      );

      if (excludeDriverId) {
        availableDrivers = availableDrivers.filter(
          driver => driver.id !== excludeDriverId,
        );
      }

      if (availableDrivers.length === 0) {
        console.log(`No available drivers found for reassignment of order ${orderId}`);
        return null;
      }

      // Assign to the best available driver
      const bestDriver = availableDrivers[0];

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: bestDriver.id,
          driverAssignedAt: new Date(),
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicle: true,
              rating: true,
            },
          },
        },
      });

      console.log(`Order ${orderId} reassigned to driver ${bestDriver.id} (${bestDriver.name})`);

      return {
        order: updatedOrder,
        driver: bestDriver,
        distance: bestDriver.distance,
      };

    } catch (error) {
      console.error('Error reassigning order:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - First point latitude
   * @param {number} lng1 - First point longitude
   * @param {number} lat2 - Second point latitude
   * @param {number} lng2 - Second point longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees to convert
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get driver statistics for assignment optimization
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object>} Driver statistics
   */
  async getDriverStats(driverId) {
    try {
      const stats = await prisma.order.aggregate({
        where: {
          driverId,
          status: 'DELIVERED',
        },
        _count: {
          id: true,
        },
        _avg: {
          // Note: Would need delivery time tracking fields in schema
          // deliveryTimeMinutes: true,
        },
      });

      const recentRejections = await prisma.order.count({
        where: {
          driverId,
          status: 'REJECTED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return {
        totalDeliveries: stats._count.id || 0,
        recentRejections,
        // averageDeliveryTime: stats._avg.deliveryTimeMinutes || null,
      };

    } catch (error) {
      console.error('Error getting driver stats:', error);
      return {
        totalDeliveries: 0,
        recentRejections: 0,
      };
    }
  }
}

// Export singleton instance
export default new AssignmentService();