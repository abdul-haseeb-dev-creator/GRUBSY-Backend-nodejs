// routes/admin/drivers.js
// Admin Drivers API - Driver management for admin panel
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/drivers
 * Get all drivers with search, filter, and pagination
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [drivers, total] = await Promise.all([
      prisma.drivers.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.drivers.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        drivers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers'
    });
  }
});

/**
 * GET /api/admin/drivers/:id
 * Get single driver by ID with detailed info
 */
router.get('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const driver = await prisma.drivers.findUnique({
      where: { id: req.params.id }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    // Get driver's deliveries count
    const deliveriesCount = await prisma.orders.count({
      where: { 
        Driver_ID: req.params.id,
        Status: 'DELIVERED'
      }
    });

    // Get recent deliveries
    const recentDeliveries = await prisma.orders.findMany({
      where: { Driver_ID: req.params.id },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        orderId: true,
        Status: true,
        created_at: true,
        deliveredAt: true,
        Order_Grand_total: true
      }
    });

    // Get current/active order
    const activeOrder = await prisma.orders.findFirst({
      where: {
        Driver_ID: req.params.id,
        Status: { in: ['DRIVER_ASSIGNED', 'PICKED_UP'] }
      }
    });

    res.json({
      success: true,
      data: {
        driver,
        stats: {
          totalDeliveries: deliveriesCount
        },
        activeOrder,
        recentDeliveries
      }
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver'
    });
  }
});

/**
 * POST /api/admin/drivers
 * Create new driver
 */
router.post('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Accept frontend field names and map to database fields
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      vehicle_type, 
      vehicle_reg,
      Registered_address,
      address_line1,
      address_line2,
      city,
      state_region,
      postcode,
      country,
      status
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'first_name, last_name, and phone are required'
      });
    }

    // Generate unique driver ID (max 20 chars)
    const driverId = `DRV${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4)}`.toUpperCase();

    const newDriver = await prisma.drivers.create({
      data: {
        Driver_ID: driverId,
        first_name,
        last_name,
        email: email || '',
        phone,
        drivers_vehicle_type: vehicle_type || 'car',
        vehicle_reg: vehicle_reg || '',
        Registered_address: Registered_address || address_line1 || '',
        address_line1: address_line1 || '',
        address_line2: address_line2 || '',
        city: city || '',
        state_region: state_region || '',
        postcode: postcode || '',
        country: country || 'GB',
        status: status || 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    res.status(201).json({
      success: true,
      data: { driver: newDriver },
      message: 'Driver created successfully'
    });
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create driver'
    });
  }
});

/**
 * PUT /api/admin/drivers/:id
 * Update driver - aligned with frontend fields and database schema
 */
router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Accept frontend field names and map to database fields
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      vehicle_type, 
      vehicle_reg,
      Registered_address,
      address_line1,
      address_line2,
      city,
      state_region,
      postcode,
      country,
      status
    } = req.body;
    
    const updateData = {};
    
    // Map frontend fields to database fields
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
    if (vehicle_reg !== undefined) updateData.vehicle_reg = vehicle_reg;
    if (Registered_address !== undefined) updateData.Registered_address = Registered_address;
    if (address_line1 !== undefined) updateData.address_line1 = address_line1;
    if (address_line2 !== undefined) updateData.address_line2 = address_line2;
    if (city !== undefined) updateData.city = city;
    if (state_region !== undefined) updateData.state_region = state_region;
    if (postcode !== undefined) updateData.postcode = postcode;
    if (country !== undefined) updateData.country = country;
    if (status !== undefined) updateData.status = status;
    
    updateData.updated_at = new Date();

    const driver = await prisma.drivers.update({
      where: { Driver_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { driver },
      message: 'Driver updated successfully'
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver'
    });
  }
});

/**
 * PUT /api/admin/drivers/:id/status
 * Update driver status (activate/suspend/block)
 */
router.put('/:id/status', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const validStatuses = ['online', 'offline', 'busy', 'suspended', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const updateData = {
      status: status,
      updatedAt: new Date().toISOString()
    };

    const driver = await prisma.drivers.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { driver },
      message: `Driver status updated to ${status}`
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver status'
    });
  }
});

/**
 * GET /api/admin/drivers/stats/overview
 * Get driver statistics
 */
router.get('/stats/overview', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const [total, online, offline, busy, suspended] = await Promise.all([
      prisma.drivers.count(),
      prisma.drivers.count({ where: { status: 'online' } }),
      prisma.drivers.count({ where: { status: 'offline' } }),
      prisma.drivers.count({ where: { status: 'busy' } }),
      prisma.drivers.count({ where: { status: 'suspended' } })
    ]);

    // Get average rating
    const ratingResult = await prisma.drivers.aggregate({
      _avg: { rating: true }
    });

    res.json({
      success: true,
      data: {
        total,
        online,
        offline,
        busy,
        suspended,
        averageRating: parseFloat(ratingResult._avg.rating || 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver stats'
    });
  }
});

/**
 * GET /api/admin/drivers/:id/full
 * Get single driver by ID with all database columns (full details)
 */
router.get('/:id/full', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: req.params.id }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    // Get all column names from the driver object
    const columns = Object.keys(driver);

    res.json({
      success: true,
      data: {
        driver,
        columns
      }
    });
  } catch (error) {
    console.error('Get driver full details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver full details'
    });
  }
});

/**
 * GET /api/admin/drivers/all-columns
 * Get all drivers with all database columns
 */
router.get('/all-columns', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const drivers = await prisma.drivers.findMany();
    
    if (drivers.length === 0) {
      return res.json({
        success: true,
        data: {
          drivers: [],
          columns: []
        }
      });
    }

    // Get all column names from the first driver
    const columns = Object.keys(drivers[0]);

    res.json({
      success: true,
      data: {
        drivers,
        columns
      }
    });
  } catch (error) {
    console.error('Get all drivers with columns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drivers with all columns'
    });
  }
});

/**
 * GET /api/admin/drivers/location/:id
 * Get driver's current location
 */
router.get('/location/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const driver = await prisma.drivers.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        fullName: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
        status: true
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: {
        driverId: driver.id,
        fullName: driver.fullName,
        location: {
          lat: driver.currentLat,
          lng: driver.currentLng
        },
        lastUpdate: driver.lastLocationUpdate,
        status: driver.status
      }
    });
  } catch (error) {
    console.error('Get driver location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver location'
    });
  }
});

export default router;
