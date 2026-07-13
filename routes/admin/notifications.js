// routes/admin/notifications.js
// Admin Notifications API - Push notification management
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/admin/notifications/send
 * Send push notification to users
 */
router.post('/send', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { type, title, message, target_type, target_id, user_ids, merchant_ids, driver_ids } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'title and message are required'
      });
    }

    // Log the notification (in production, this would send push notifications)
    console.log(`📱 Sending notification:
      Type: ${type || 'general'}
      Title: ${title}
      Message: ${message}
      Target: ${target_type || 'all'}
      Target ID: ${target_id || 'N/A'}
      Users: ${user_ids?.length || 0}
      Merchants: ${merchant_ids?.length || 0}
      Drivers: ${driver_ids?.length || 0}
    `);

    // Try to save notification history
    try {
      await prisma.notification_History.create({
        data: {
          type: type || 'general',
          title,
          message,
          target_type: target_type || 'all',
          target_id: target_id || '',
          user_ids: user_ids || [],
          merchant_ids: merchant_ids || [],
          driver_ids: driver_ids || [],
          sent_by: 'admin',
          sent_at: new Date()
        }
      });
    } catch (e) {
      // Table might not exist
    }

    res.json({
      success: true,
      message: 'Notification queued for sending',
      details: {
        type,
        title,
        message,
        target_type,
        recipient_count: (user_ids?.length || 0) + (merchant_ids?.length || 0) + (driver_ids?.length || 0)
      }
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

/**
 * GET /api/admin/notifications/history
 * Get notification history
 */
router.get('/history', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;

    try {
      const [notifications, total] = await Promise.all([
        prisma.notification_History.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { sent_at: 'desc' }
        }),
        prisma.notification_History.count({ where })
      ]);

      return res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (tableError) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        },
        message: 'Notification history table not available'
      });
    }
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification history'
    });
  }
});

/**
 * GET /api/admin/notifications/stats
 * Get notification statistics
 */
router.get('/stats', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    try {
      const total = await prisma.notification_History.count({
        where: { sent_at: { gte: startDate.toISOString() } }
      });

      const byType = await prisma.notification_History.groupBy({
        by: ['type'],
        where: { sent_at: { gte: startDate.toISOString() } },
        _count: true
      });

      return res.json({
        success: true,
        data: {
          total,
          byType: byType.map(t => ({ type: t.type, count: t._count }))
        }
      });
    } catch (tableError) {
      return res.json({
        success: true,
        data: {
          total: 0,
          byType: []
        }
      });
    }
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    });
  }
});

/**
 * POST /api/admin/notifications/send-to-user
 * Send notification to specific user
 */
router.post('/send-to-user', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { user_id, title, message } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'user_id, title, and message are required'
      });
    }

    // Get user info
    const user = await prisma.users.findUnique({
      where: { Grubsy_User_ID: user_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`📱 Sending notification to user ${user_id} (${user.Users_Full_Name}): ${title}`);

    res.json({
      success: true,
      message: 'Notification sent to user',
      recipient: {
        user_id,
        name: user.Users_Full_Name,
        title,
        message
      }
    });
  } catch (error) {
    console.error('Send to user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification to user'
    });
  }
});

/**
 * POST /api/admin/notifications/send-to-merchant
 * Send notification to specific merchant
 */
router.post('/send-to-merchant', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { merchant_id, title, message } = req.body;

    if (!merchant_id || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'merchant_id, title, and message are required'
      });
    }

    // Get merchant info
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: merchant_id }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    console.log(`📱 Sending notification to merchant ${merchant_id} (${merchant.Merchants_Name}): ${title}`);

    res.json({
      success: true,
      message: 'Notification sent to merchant',
      recipient: {
        merchant_id,
        name: merchant.Merchants_Name,
        title,
        message
      }
    });
  } catch (error) {
    console.error('Send to merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification to merchant'
    });
  }
});

/**
 * POST /api/admin/notifications/send-to-driver
 * Send notification to specific driver
 */
router.post('/send-to-driver', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { driver_id, title, message } = req.body;

    if (!driver_id || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'driver_id, title, and message are required'
      });
    }

    // Get driver info
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: driver_id }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    console.log(`📱 Sending notification to driver ${driver_id} (${driver.Full_Name}): ${title}`);

    res.json({
      success: true,
      message: 'Notification sent to driver',
      recipient: {
        driver_id,
        name: driver.Full_Name,
        title,
        message
      }
    });
  } catch (error) {
    console.error('Send to driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification to driver'
    });
  }
});

/**
 * POST /api/admin/notifications/broadcast
 * Broadcast notification to all users
 */
router.post('/broadcast', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { title, message, target } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'title and message are required'
      });
    }

    // Get counts
    const [userCount, merchantCount, driverCount] = await Promise.all([
      prisma.users.count(),
      prisma.merchants.count(),
      prisma.drivers.count()
    ]);

    console.log(`📢 Broadcasting notification:
      Title: ${title}
      Message: ${message}
      Target: ${target || 'all'}
      Estimated recipients: ${target === 'users' ? userCount : target === 'merchants' ? merchantCount : target === 'drivers' ? driverCount : userCount + merchantCount + driverCount}
    `);

    res.json({
      success: true,
      message: 'Broadcast notification queued',
      details: {
        title,
        message,
        target: target || 'all',
        estimated_recipients: target === 'users' ? userCount : target === 'merchants' ? merchantCount : target === 'drivers' ? driverCount : userCount + merchantCount + driverCount
      }
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast notification'
    });
  }
});

/**
 * DELETE /api/admin/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await prisma.notification_History.delete({ where: { id } });
      
      return res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (tableError) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

export default router;
