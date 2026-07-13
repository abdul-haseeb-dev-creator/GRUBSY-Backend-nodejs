// controllers/orders.js
// Updated controller to use Prisma database instead of SheetBest
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Status mapping between frontend and backend
const STATUS_MAPPING = {
  // Frontend -> Backend
  'NEW': 'Placed',
  'IN_PROGRESS': 'preparing',
  'READY': 'ready',
  'OUT_FOR_DELIVERY': 'delivered',
  'COMPLETED': 'delivered',
  'CANCELLED': 'cancelled',

  // Backend -> Frontend
  'Placed': 'NEW',
  'preparing': 'IN_PROGRESS',
  'ready': 'READY',
  'delivered': 'COMPLETED',
  'cancelled': 'CANCELLED'
};

function mapBackendStatusToFrontend(backendStatus) {
  return STATUS_MAPPING[backendStatus] || backendStatus;
}

function mapFrontendStatusToBackend(frontendStatus) {
  return STATUS_MAPPING[frontendStatus] || frontendStatus;
}

exports.getAll = async (req, res) => {
  try {
    const { status, restaurantId, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (status) {
      // Map frontend status to backend status
      const statusMapping = {
        'NEW': 'Placed',
        'IN_PROGRESS': 'preparing',
        'READY': 'ready',
        'OUT_FOR_DELIVERY': 'delivered',
        'COMPLETED': 'delivered',
        'CANCELLED': 'cancelled'
      };
      where.status = statusMapping[status] || status;
    }
    if (restaurantId) {
      where.merchantId = restaurantId;
    }

    // Fetch orders with filtering
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        merchant: {
          select: {
            id: true,
            Merchants_Name: true,
            Active: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => ({
      id: order.id,
      code: order.id.substring(0, 8).toUpperCase(), // Generate order code
      restaurantId: order.merchantId,
      status: mapBackendStatusToFrontend(order.status),
      customerId: order.userId,
      customer: {
        id: order.user.id,
        name: order.user.fullName,
        phone: order.user.phone
      },
      dueAt: order.createdAt, // Use createdAt as dueAt for now
      subtotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0, // Calculate tax if needed
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    }));

    res.json({
      success: true,
      data: transformedOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

exports.create = async (req, res) => {
  try {
    // Create new order in Prisma database
    const order = await prisma.order.create({
      data: req.body
    });
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        merchant: true,
        items: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Map frontend status to backend status
    const backendStatus = mapFrontendStatusToBackend(status);

    // Validate status
    const validStatuses = ['Placed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(backendStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Update order status in database
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: backendStatus, updatedAt: new Date() },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        merchant: {
          select: {
            id: true,
            Merchants_Name: true,
            Active: true
          }
        },
        items: true
      }
    });

    // Transform response to match frontend expectations
    const transformedOrder = {
      id: updatedOrder.id,
      code: updatedOrder.id.substring(0, 8).toUpperCase(),
      restaurantId: updatedOrder.merchantId,
      status: mapBackendStatusToFrontend(updatedOrder.status),
      customerId: updatedOrder.userId,
      customer: {
        id: updatedOrder.user.id,
        name: updatedOrder.user.fullName,
        phone: updatedOrder.user.phone
      },
      dueAt: updatedOrder.createdAt,
      subtotal: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0,
      total: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      items: updatedOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    res.json({
      success: true,
      data: transformedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
};


exports.updateLocation = async (req, res) => {
  // Update driver location for order (stub)
  const data = await bitrix24.updateOrderLocation(req.params.orderId, req.body.location);
  res.json(data);
};

exports.uploadPhotos = async (req, res) => {
  try {
    const orderId = req.params.id;
    const files = req.files || {};
    
    // Validate photo types
    const validTypes = ['beforePacked', 'inBag', 'driverPickup'];
    const uploadedTypes = Object.keys(files);
    const invalidTypes = uploadedTypes.filter(type => !validTypes.includes(type));
    
    if (invalidTypes.length > 0) {
      return res.status(400).json({ error: `Invalid photo types: ${invalidTypes.join(', ')}` });
    }
     // Store file paths in database
    const photoData = {
      beforePacked: files.beforePacked ? files.beforePacked[0].path : null,
      inBag: files.inBag ? files.inBag[0].path : null,
      driverPickup: files.driverPickup ? files.driverPickup[0].path : null,
    };

    // Update the order with photo paths in database
    await prisma.order.update({
      where: { id: orderId },
      data: photoData
    });
    res.json({ photos: photoData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photos' });
  }
};

// Update order (PUT)
exports.updateOrder = async (req, res) => {
  try {
    const data = await bitrix24.updateOrderStatus(req.params.orderId, req.body.status);
    res.json(data);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Restaurant operations endpoints

exports.acceptOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Update order status to IN_PROGRESS (READY_FOR_DRIVER)
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'READY_FOR_DRIVER',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        merchant: {
          select: {
            id: true,
            Merchants_Name: true,
            Active: true
          }
        },
        items: true
      }
    });

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      code: updatedOrder.id.substring(0, 8).toUpperCase(),
      restaurantId: updatedOrder.merchantId,
      status: 'IN_PROGRESS',
      customerId: updatedOrder.userId,
      customer: {
        id: updatedOrder.user.id,
        name: updatedOrder.user.fullName,
        phone: updatedOrder.user.phone
      },
      dueAt: updatedOrder.createdAt,
      subtotal: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0,
      total: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      items: updatedOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    res.json({
      success: true,
      data: transformedOrder
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept order'
    });
  }
};

exports.markReady = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'READY_FOR_DRIVER',
        updatedAt: new Date()
      },
      include: {
        user: true,
        merchant: true,
        items: true
      }
    });

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      code: updatedOrder.id.substring(0, 8).toUpperCase(),
      restaurantId: updatedOrder.merchantId,
      status: 'READY',
      customerId: updatedOrder.userId,
      customer: {
        id: updatedOrder.user.id,
        name: updatedOrder.user.fullName,
        phone: updatedOrder.user.phone
      },
      dueAt: updatedOrder.createdAt,
      subtotal: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0,
      total: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      items: updatedOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    res.json({
      success: true,
      data: transformedOrder
    });
  } catch (error) {
    console.error('Error marking order ready:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark order ready'
    });
  }
};

exports.handOff = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { courierId } = req.body;

    if (!courierId) {
      return res.status(400).json({
        error: 'Courier ID is required'
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        updatedAt: new Date()
      },
      include: {
        user: true,
        merchant: true,
        items: true
      }
    });

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      code: updatedOrder.id.substring(0, 8).toUpperCase(),
      restaurantId: updatedOrder.merchantId,
      status: 'OUT_FOR_DELIVERY',
      customerId: updatedOrder.userId,
      customer: {
        id: updatedOrder.user.id,
        name: updatedOrder.user.fullName,
        phone: updatedOrder.user.phone
      },
      dueAt: updatedOrder.createdAt,
      subtotal: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0,
      total: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      items: updatedOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    res.json({
      success: true,
      data: transformedOrder
    });
  } catch (error) {
    console.error('Error handing off order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to hand off order'
    });
  }
};

exports.delayOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({
        error: 'Valid delay minutes are required'
      });
    }

    // For now, just update the order - in a real implementation,
    // you might want to store delay information separately
    await prisma.order.update({
      where: { id: orderId },
      data: {
        updatedAt: new Date()
      },
      include: {
        user: true,
        merchant: true,
        items: true
      }
    });

    res.json({
      success: true,
      message: `Order delayed by ${minutes} minutes`
    });
  } catch (error) {
    console.error('Error delaying order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delay order'
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { reason, refund } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        user: true,
        merchant: true,
        items: true
      }
    });

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      code: updatedOrder.id.substring(0, 8).toUpperCase(),
      restaurantId: updatedOrder.merchantId,
      status: 'CANCELLED',
      customerId: updatedOrder.userId,
      customer: {
        id: updatedOrder.user.id,
        name: updatedOrder.user.fullName,
        phone: updatedOrder.user.phone
      },
      dueAt: updatedOrder.createdAt,
      subtotal: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: 0,
      total: updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      items: updatedOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    };

    res.json({
      success: true,
      data: transformedOrder,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
};

exports.createAdjustment = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { type, amount, reason } = req.body;

    if (!type || !amount || !reason) {
      return res.status(400).json({
        error: 'Type, amount, and reason are required'
      });
    }

    // For now, just return success - in a real implementation,
    // you would store adjustment records
    res.json({
      success: true,
      message: `Adjustment of ${type} £${amount} created: ${reason}`
    });
  } catch (error) {
    console.error('Error creating adjustment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create adjustment'
    });
  }
};

// Get available orders for drivers
exports.getAvailableOrders = async (req, res) => {
  try {
    console.log('🔍 Fetching available orders for drivers');

    // Get orders that are ready for drivers (status = 'ready', 'READY_FOR_DRIVER', or 'PENDING')
    // and don't have a driver assigned yet
    const availableOrders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'ready' },
          { status: 'READY_FOR_DRIVER' },
          { status: 'PENDING' }
        ],
        driverId: null // No driver assigned yet
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        merchant: {
          select: {
            id: true,
            Merchants_Name: true,
            Address: true,
            PostCode: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    console.log(`✅ Found ${availableOrders.length} available orders`);

    // Transform orders to match driver app expectations
    const formattedOrders = availableOrders.map(order => ({
      id: order.id,
      orderId: order.id,
      restaurantName: order.merchant?.Merchants_Name || 'Restaurant',
      restaurantAddress: order.merchant?.Address || '',
      restaurantPostcode: order.merchant?.PostCode || '',
      customerName: order.user?.fullName || 'Customer',
      customerPhone: order.user?.phone || '',
      deliveryAddress: order.deliveryAddress || '',
      deliveryPostcode: order.deliveryPostcode || '',
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      createdAt: order.createdAt,
      status: order.status
    }));

    console.log(`✅ Formatted ${formattedOrders.length} available orders: ${formattedOrders.map(o => o.id).join(', ')}`);

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('❌ Error fetching available orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available orders'
    });
  }
};
