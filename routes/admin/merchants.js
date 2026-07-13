// routes/admin/merchants.js
// Admin Merchants API - Merchant management for admin panel
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/merchants
 * Get all merchants with search, filter, and pagination
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const { search, status, area, cuisine, page = '1', limit = '50' } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { Merchants_Name: { contains: search } },
        { Merchants_Email: { contains: search } },
        { Grubsy_Partner_ID: { contains: search } }
      ];
    }

    if (status) {
      where.Active = status; // Keep Status as the working API uses it
    }
    console.log(status)
    if (area) {
      where.Area = { contains: area };
    }

    if (cuisine) {
      where.Cuisine = { contains: cuisine };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [merchants, total] = await Promise.all([
      prisma.merchants.findMany({
        where,
        orderBy: { Created_at: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          Merchants_Name: true,
          Merchants_Email: true,
          Merchants_Phone_Number: true,
          Address: true,
          Area: true,
          PostCode: true,
          Cuisine: true,
          Active: true,
          Merchant_Enrolement_Status: true,
          Grubsy_Partner_ID: true,
          Created_at: true,
          Description: true,
          Opening_Times: true,
          Delivery_Radius: true,
          Average_Preparation_Time: true
        }
      }),
      prisma.merchants.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.log('Get merchants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchants'
    });
  }
});

/**
 * GET /api/admin/merchants/:id
 * Get single merchant by ID with detailed info
 */
router.get('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: req.params.id }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Get merchant's orders count
    const ordersCount = await prisma.orders.count({
      where: { Grubsy_Partner_ID: req.params.id }
    });

    // Get recent orders
    const recentOrders = await prisma.orders.findMany({
      where: { Grubsy_Partner_ID: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        orderId: true,
        Status: true,
        createdAt: true,
        Order_Grand_total: true
      }
    });

    res.json({
      success: true,
      data: {
        merchant,
        stats: {
          totalOrders: ordersCount
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant'
    });
  }
});

/**
 * POST /api/admin/merchants
 * Create new merchant
 */
router.post('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Accept frontend field names and map to database fields
    const { 
      Merchants_Name, 
      Merchants_Email, 
      Merchants_Phone, 
      Merchants_Address, 
      Area, 
      PostCode, 
      Cuisine, 
      Description, 
      Opening_Times, 
      Active,
      Merchants_Phone_Number
    } = req.body;

    // Validate required fields
    if (!Merchants_Name) {
      return res.status(400).json({
        success: false,
        error: 'Merchants_Name is required'
      });
    }

    // Check for duplicate email if provided
    if (Merchants_Email) {
      const existingMerchant = await prisma.merchants.findUnique({
        where: { Merchants_Email }
      });
      if (existingMerchant) {
        return res.status(409).json({
          success: false,
          error: 'Merchant with this email already exists'
        });
      }
    }

    // Generate unique partner ID
    const partnerId = `PARTNER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newMerchant = await prisma.merchants.create({
      data: {
        id: partnerId,
        Grubsy_Partner_ID: partnerId,
        Merchants_Name,
        Description: Description || '',
        Cuisine: Cuisine || '',
        Address: Merchants_Address || '',
        Area: Area || '',
        PostCode: PostCode || '',
        Opening_Times: Opening_Times || '',
        Active: Active || '1',
        Merchants_Email: Merchants_Email || '',
        Merchants_Phone_Number: Merchants_Phone_Number || Merchants_Phone || '',
        Merchant_Enrolement_Status: 'PENDING',
        Created_at: new Date().toISOString()
      }
    });

    res.status(201).json({
      success: true,
      data: { merchant: newMerchant },
      message: 'Merchant created successfully'
    });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create merchant'
    });
  }
});

/**
 * PUT /api/admin/merchants/:id
 * Update merchant - aligned with frontend fields and database schema
 */
router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Accept frontend field names and map to database fields
    const { 
      Merchants_Name, 
      Merchants_Email, 
      Merchants_Phone, 
      Merchants_Phone_Number, 
      Merchants_Address, 
      Area, 
      PostCode, 
      Cuisine, 
      Description, 
      Opening_Times, 
      Active,
      Status
    } = req.body;
    
    const updateData = {};
    
    // Map frontend fields to database fields
    if (Merchants_Name !== undefined) updateData.Merchants_Name = Merchants_Name;
    if (Merchants_Email !== undefined) updateData.Merchants_Email = Merchants_Email;
    if (Merchants_Phone !== undefined) updateData.Merchants_Phone_Number = Merchants_Phone;
    if (Merchants_Phone_Number !== undefined) updateData.Merchants_Phone_Number = Merchants_Phone_Number;
    if (Merchants_Address !== undefined) updateData.Address = Merchants_Address;
    if (Area !== undefined) updateData.Area = Area;
    if (PostCode !== undefined) updateData.PostCode = PostCode;
    if (Cuisine !== undefined) updateData.Cuisine = Cuisine;
    if (Description !== undefined) updateData.Description = Description;
    if (Opening_Times !== undefined) updateData.Opening_Times = Opening_Times;
    if (Active !== undefined) updateData.Active = Active;
    if (Status !== undefined) updateData.Status = Status;
    
    updateData.Updated_At = new Date().toISOString();

    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { merchant },
      message: 'Merchant updated successfully'
    });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update merchant'
    });
  }
});

/**
 * PUT /api/admin/merchants/:id/status
 * Update merchant status (approve/reject/suspend)
 */
router.put('/:id/status', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const validStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const updateData = {
      Status: status,
      Updated_At: new Date().toISOString()
    };

    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { merchant },
      message: `Merchant status updated to ${status}`
    });
  } catch (error) {
    console.error('Update merchant status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update merchant status'
    });
  }
});

/**
 * GET /api/admin/merchants/:id/full
 * Get single merchant by ID with all database columns (full details)
 */
router.get('/:id/full', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: req.params.id }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Get all column names from the merchant object
    const columns = Object.keys(merchant);

    res.json({
      success: true,
      data: {
        merchant,
        columns
      }
    });
  } catch (error) {
    console.error('Get merchant full details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant full details'
    });
  }
});

/**
 * GET /api/admin/merchants/all-columns
 * Get all merchants with all database columns
 */
router.get('/all-columns', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const merchants = await prisma.merchants.findMany();
    
    if (merchants.length === 0) {
      return res.json({
        success: true,
        data: {
          merchants: [],
          columns: []
        }
      });
    }

    // Get all column names from the first merchant
    const columns = Object.keys(merchants[0]);

    res.json({
      success: true,
      data: {
        merchants,
        columns
      }
    });
  } catch (error) {
    console.error('Get all merchants with columns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchants with all columns'
    });
  }
});

/**
 * GET /api/admin/merchants/applications
 * Get pending merchant applications
 */
router.get('/applications', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const applications = await prisma.merchants.findMany({
      where: { Status: 'PENDING' },
      orderBy: { Created_at: 'desc' }
    });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    console.error('Get merchant applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant applications'
    });
  }
});

/**
 * POST /api/admin/merchants/applications/:id/approve
 * Approve merchant application
 */
router.post('/applications/:id/approve', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: req.params.id },
      data: {
        Status: 'ACTIVE',
        Updated_At: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: { merchant },
      message: 'Merchant application approved'
    });
  } catch (error) {
    console.error('Approve merchant application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve merchant application'
    });
  }
});

/**
 * POST /api/admin/merchants/applications/:id/reject
 * Reject merchant application
 */
router.post('/applications/:id/reject', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: req.params.id },
      data: {
        Status: 'REJECTED',
        Updated_At: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: { merchant },
      message: 'Merchant application rejected'
    });
  } catch (error) {
    console.error('Reject merchant application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject merchant application'
    });
  }
});

/**
 * GET /api/admin/merchants/stats/overview
 * Get merchant statistics
 */
router.get('/stats/overview', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const [total, active, pending, suspended] = await Promise.all([
      prisma.merchants.count(),
      prisma.merchants.count({ where: { Status: 'ACTIVE' } }),
      prisma.merchants.count({ where: { Status: 'PENDING' } }),
      prisma.merchants.count({ where: { Status: 'SUSPENDED' } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        suspended
      }
    });
  } catch (error) {
    console.error('Get merchant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant stats'
    });
  }
});

export default router;
