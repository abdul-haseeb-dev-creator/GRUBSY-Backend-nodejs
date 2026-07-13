// routes/admin/users.js
// Admin Users API - User management for admin panel
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/users
 * Get all users with search, filter, and pagination
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const { search, status, page = '1', limit = '50' } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { Users_Full_Name: { contains: search, mode: 'insensitive' } },
        { Users_Email: { contains: search, mode: 'insensitive' } },
        { Users_Phone_Number: { contains: search, mode: 'insensitive' } },
        { Grubsy_User_ID: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.Status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { Acc_Created_At: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          Grubsy_User_ID: true,
          Users_Full_Name: true,
          Users_Email: true,
          Users_Phone_Number: true,
          Status: true,
          Acc_Created_At: true,
          Last_Login: true,
          Users_Registered_Address: true,
          Users_Registered_PostCode: true,
          Total_Orders: true,
          Email_Verified: true,
          Phone_Verified: true,
          Total_Spent: true,
          Device_Type : true,
          App_Version : true,
          Referral_Code: true,
          Referred_By: true
          
        }
      }),
      prisma.users.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user by ID
 */
router.get('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { Grubsy_User_ID: req.params.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user orders
    const orders = await prisma.orders.findMany({
      where: { Grubsy_User_ID: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        user,
        orders
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { Users_Full_Name, Users_Email, Users_Phone_Number, Users_Registered_Address, Users_Registered_PostCode, Status } = req.body;

    // Validate required fields
    if (!Users_Full_Name || !Users_Email) {
      return res.status(400).json({
        success: false,
        error: 'Users_Full_Name and Users_Email are required'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { Users_Email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Generate unique user ID
    const grubsyUserId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newUser = await prisma.users.create({
      data: {
        id: grubsyUserId,
        Grubsy_User_ID: grubsyUserId,
        Users_Full_Name,
        Users_Email,
        Users_Phone_Number: Users_Phone_Number || '',
        Users_Registered_Address: Users_Registered_Address || '',
        Users_Registered_PostCode: Users_Registered_PostCode || '',
        Status: Status || 'active',
        Acc_Created_At: new Date().toISOString(),
        Last_Login: null
      }
    });

    res.status(201).json({
      success: true,
      data: { user: newUser },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user - aligned with frontend fields and database schema
 */
router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Accept all frontend field names and map to database fields
    const { 
      Users_Full_Name, 
      Users_Email, 
      Users_Phone_Number, 
      Users_Registered_Address, 
      Users_Registered_PostCode, 
      Status 
    } = req.body;

    const updateData = {};
    
    // Map frontend fields to database fields
    if (Users_Full_Name !== undefined) updateData.Users_Full_Name = Users_Full_Name;
    if (Users_Email !== undefined) updateData.Users_Email = Users_Email;
    if (Users_Phone_Number !== undefined) updateData.Users_Phone_Number = Users_Phone_Number;
    if (Users_Registered_Address !== undefined) updateData.Users_Registered_Address = Users_Registered_Address;
    if (Users_Registered_PostCode !== undefined) updateData.Users_Registered_PostCode = Users_Registered_PostCode;
    if (Status !== undefined) updateData.Status = Status;
    
    updateData.Updated_At = new Date().toISOString();

    const user = await prisma.users.update({
      where: { Grubsy_User_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { user },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (activate/suspend/block)
 */
router.put('/:id/status', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const validStatuses = ['active', 'suspended', 'blocked'];
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

    const user = await prisma.users.update({
      where: { Grubsy_User_ID: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      data: { user },
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

/**
 * GET /api/admin/users/:id/full
 * Get single user by ID with all database columns (full details)
 */
router.get('/:id/full', authenticateAdmin, requireRole('super_admin', 'admin', 'operations', 'support'), async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { Grubsy_User_ID: req.params.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get all column names from the user object
    const columns = Object.keys(user);

    res.json({
      success: true,
      data: {
        user,
        columns
      }
    });
  } catch (error) {
    console.error('Get user full details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user full details'
    });
  }
});

/**
 * GET /api/admin/users/all-columns
 * Get all users with all database columns
 */
router.get('/all-columns', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    
    if (users.length === 0) {
      return res.json({
        success: true,
        data: {
          users: [],
          columns: []
        }
      });
    }

    // Get all column names from the first user
    const columns = Object.keys(users[0]);

    res.json({
      success: true,
      data: {
        users,
        columns
      }
    });
  } catch (error) {
    console.error('Get all users with columns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users with all columns'
    });
  }
});

/**
 * GET /api/admin/users/stats/overview
 * Get user statistics
 */
router.get('/stats/overview', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [total, newToday, newThisMonth, activeLast7Days, verified, blocked] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: { Acc_Created_At: { startsWith: todayStr } }
      }),
      prisma.users.count({
        where: { Acc_Created_At: { gte: monthStart.toISOString() } }
      }),
      prisma.users.count({
        where: { Last_Login: { gte: weekAgo.toISOString() } }
      }),
      prisma.users.count({
        where: {
          OR: [
            { Email_Verified: true },
            { Phone_Verified: true }
          ]
        }
      }),
      prisma.users.count({
        where: { Status: 'blocked' }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        new_today: newToday,
        new_this_month: newThisMonth,
        active_last_7_days: activeLast7Days,
        verified,
        blocked
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats'
    });
  }
});

export default router;
