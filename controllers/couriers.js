// controllers/couriers.js
// Courier management for restaurant operations
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get all couriers (admin only or for restaurant assignment)
 */
async function getAll(req, res) {
  try {
    // For now, return mock courier data since we don't have a couriers table
    // In a real implementation, this would query a couriers table
    const mockCouriers = [
      {
        id: 'courier-1',
        name: 'John Smith',
        phone: '+44 7700 123456',
        avatarUrl: 'https://placehold.co/64x64',
        status: 'available',
        currentLocation: { lat: 51.5074, lng: -0.1278 }
      },
      {
        id: 'courier-2',
        name: 'Sarah Johnson',
        phone: '+44 7700 234567',
        avatarUrl: 'https://placehold.co/64x64',
        status: 'busy',
        currentLocation: { lat: 51.5155, lng: -0.0922 }
      },
      {
        id: 'courier-3',
        name: 'Mike Wilson',
        phone: '+44 7700 345678',
        avatarUrl: 'https://placehold.co/64x64',
        status: 'available',
        currentLocation: { lat: 51.5225, lng: -0.1585 }
      }
    ];

    res.json({
      success: true,
      data: mockCouriers
    });
  } catch (error) {
    console.error('Error fetching couriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch couriers'
    });
  }
}

/**
 * Get couriers assigned to orders for the current restaurant
 */
async function getAssigned(req, res) {
  try {
    const userEmail = req.user.email;

    // Find merchant for this user
    const merchant = await prisma.Merchants.findFirst({
      where: { 'Owner Email': userEmail }
    });

    if (!merchant) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get orders that are out for delivery from this merchant
    const ordersInDelivery = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        status: 'delivered'
      },
      select: {
        id: true,
        status: true
      }
    });

    // For now, return mock data with assignments
    // In a real implementation, you'd have a courier_assignments table
    const mockAssignments = ordersInDelivery.map(order => ({
      courierId: 'courier-1',
      orderId: order.id,
      eta: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      status: 'en_route'
    }));

    res.json({
      success: true,
      data: mockAssignments
    });
  } catch (error) {
    console.error('Error fetching assigned couriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assigned couriers'
    });
  }
}

/**
 * Rate a courier for an order
 */
async function rateCourier(req, res) {
  try {
    const { courierId } = req.params;
    const { orderId, rating, comments } = req.body;

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Valid orderId and rating (1-5) are required'
      });
    }

    // Verify the order belongs to the user's merchant
    const userEmail = req.user.email;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (order.merchant['Owner Email'] !== userEmail) {
      return res.status(403).json({
        error: 'You can only rate couriers for your own orders'
      });
    }

    // For now, just return success - in a real implementation,
    // you'd store this in a courier_ratings table
    const ratingData = {
      id: `rating-${Date.now()}`,
      courierId,
      orderId,
      rating,
      comments: comments || '',
      createdAt: new Date(),
      createdBy: userEmail
    };

    res.json({
      success: true,
      data: ratingData,
      message: 'Courier rating submitted successfully'
    });
  } catch (error) {
    console.error('Error rating courier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate courier'
    });
  }
}

export {
  getAll,
  getAssigned,
  rateCourier
};