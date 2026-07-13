// routes/admin/audit.js
// Admin Audit API - Platform audit logs
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/audit/logs
 * Get audit logs with optional filtering
 */
router.get('/logs', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { action, entity_type, user_id, page = 1, limit = 50, start_date, end_date } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (action) where.action = { contains: action };
    if (entity_type) where.entity_type = { contains: entity_type };
    if (user_id) where.user_id = user_id;
    
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) where.createdAt.gte = new Date(start_date);
      if (end_date) where.createdAt.lte = new Date(end_date);
    }

    // Try to get from audit_logs table
    try {
      const [logs, total] = await Promise.all([
        prisma.audit_Logs.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.audit_Logs.count({ where })
      ]);

      return res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (tableError) {
      // Table doesn't exist, return empty array
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        },
        message: 'Audit logs table not available'
      });
    }
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    });
  }
});

/**
 * GET /api/admin/audit/stats
 * Get audit statistics
 */
router.get('/stats', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    try {
      // Group by action type
      const actionCounts = await prisma.audit_Logs.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate.toISOString() } },
        _count: true
      });

      // Group by entity type
      const entityCounts = await prisma.audit_Logs.groupBy({
        by: ['entity_type'],
        where: { createdAt: { gte: startDate.toISOString() } },
        _count: true
      });

      // Get total
      const total = await prisma.audit_Logs.count({
        where: { createdAt: { gte: startDate.toISOString() } }
      });

      return res.json({
        success: true,
        data: {
          total,
          byAction: actionCounts.map(a => ({ action: a.action, count: a._count })),
          byEntity: entityCounts.map(e => ({ entity_type: e.entity_type, count: e._count }))
        }
      });
    } catch (tableError) {
      return res.json({
        success: true,
        data: {
          total: 0,
          byAction: [],
          byEntity: []
        }
      });
    }
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit statistics'
    });
  }
});

/**
 * GET /api/admin/audit/entity/:type/:id
 * Get audit history for a specific entity
 */
router.get('/entity/:type/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { limit = 20 } = req.query;

    try {
      const logs = await prisma.audit_Logs.findMany({
        where: {
          entity_type: type,
          entity_id: id
        },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: logs
      });
    } catch (tableError) {
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Get entity audit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entity audit history'
    });
  }
});

/**
 * GET /api/admin/audit/user/:userId
 * Get audit logs for a specific user
 */
router.get('/user/:userId', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    try {
      const logs = await prisma.audit_Logs.findMany({
        where: { user_id: userId },
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: logs
      });
    } catch (tableError) {
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Get user audit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user audit logs'
    });
  }
});

/**
 * POST /api/admin/audit/log
 * Create an audit log entry (internal use)
 */
router.post('/log', async (req, res) => {
  try {
    const { action, entity_type, entity_id, user_id, details, ip_address } = req.body;

    if (!action || !entity_type) {
      return res.status(400).json({
        success: false,
        error: 'action and entity_type are required'
      });
    }

    try {
      const log = await prisma.audit_Logs.create({
        data: {
          action,
          entity_type,
          entity_id: entity_id || '',
          user_id: user_id || 'system',
          details: details || {},
          ip_address: ip_address || req.ip,
          createdAt: new Date()
        }
      });

      return res.json({
        success: true,
        data: log
      });
    } catch (tableError) {
      // Table doesn't exist, just return success
      return res.json({
        success: true,
        message: 'Audit log created (table not available)'
      });
    }
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log'
    });
  }
});

/**
 * GET /api/admin/audit/export
 * Export audit logs
 */
router.get('/export', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;

    const where = {};
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) where.createdAt.gte = new Date(start_date);
      if (end_date) where.createdAt.lte = new Date(end_date);
    }

    try {
      const logs = await prisma.audit_Logs.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      if (format === 'csv') {
        // Convert to CSV
        const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'User ID', 'Created At'];
        const rows = logs.map(l => [
          l.id,
          l.action,
          l.entity_type,
          l.entity_id,
          l.user_id,
          l.createdAt
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        return res.send(csv);
      }

      return res.json({
        success: true,
        data: logs,
        count: logs.length
      });
    } catch (tableError) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs'
    });
  }
});

export default router;
