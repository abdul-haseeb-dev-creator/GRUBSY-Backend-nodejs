// routes/admin/payouts.js
// Admin Payouts API - Manage driver and merchant payouts
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/payouts
 * Get all payouts with optional filtering
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { type, status, driver_id, merchant_id, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Try driver payouts first
    let where = {};
    if (driver_id) where.driver_id = driver_id;
    if (status) where.status = status;

    let payouts = [];
    let total = 0;

    if (type === 'driver' || !type) {
      const driverPayouts = await prisma.driver_Payouts.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { requested_at: 'desc' }
      });
      
      // Get total count
      total = await prisma.driver_Payouts.count({ where });
      
      payouts = driverPayouts.map(p => ({
        ...p,
        payout_type: 'driver',
        entity_name: p.driver_id
      }));
    }

    // If merchant payouts exist, fetch them too
    try {
      const merchantPayouts = await prisma.Merchant_Payouts.findMany({
        where: merchant_id ? { partner_id: merchant_id } : {},
        skip,
        take: parseInt(limit),
        orderBy: { requested_at: 'desc' }
      });
      
      const merchantPayoutData = merchantPayouts.map(p => ({
        ...p,
        payout_type: 'merchant',
        entity_name: p.partner_id
      }));
      
      payouts = [...payouts, ...merchantPayoutData];
    } catch (e) {
      // Merchant_Payouts table might not exist
    }

    // Sort by date
    payouts.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

    res.json({
      success: true,
      data: payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payouts'
    });
  }
});

/**
 * GET /api/admin/payouts/summary
 * Get payout summary statistics
 */
router.get('/summary', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { type = 'driver' } = req.query;

    let pendingTotal = 0;
    let processingTotal = 0;
    let paidTotal = 0;
    let failedTotal = 0;

    if (type === 'driver' || !type) {
      const [pending, processing, paid, failed] = await Promise.all([
        prisma.driver_Payouts.aggregate({
          where: { status: 'PENDING' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.driver_Payouts.aggregate({
          where: { status: 'PROCESSING' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.driver_Payouts.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.driver_Payouts.aggregate({
          where: { status: 'FAILED' },
          _sum: { amount: true },
          _count: true
        })
      ]);

      pendingTotal = parseFloat(pending._sum.amount || 0);
      processingTotal = parseFloat(processing._sum.amount || 0);
      paidTotal = parseFloat(paid._sum.amount || 0);
      failedTotal = parseFloat(failed._sum.amount || 0);
    }

    res.json({
      success: true,
      data: {
        pending: {
          amount: pendingTotal,
          count: pendingTotal > 0 ? await prisma.driver_Payouts.count({ where: { status: 'PENDING' } }) : 0
        },
        processing: {
          amount: processingTotal,
          count: processingTotal > 0 ? await prisma.driver_Payouts.count({ where: { status: 'PROCESSING' } }) : 0
        },
        paid: {
          amount: paidTotal,
          count: paidTotal > 0 ? await prisma.driver_Payouts.count({ where: { status: 'PAID' } }) : 0
        },
        failed: {
          amount: failedTotal,
          count: failedTotal > 0 ? await prisma.driver_Payouts.count({ where: { status: 'FAILED' } }) : 0
        },
        total: pendingTotal + processingTotal + paidTotal + failedTotal
      }
    });
  } catch (error) {
    console.error('Get payout summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payout summary'
    });
  }
});

/**
 * POST /api/admin/payouts
 * Create a new payout request
 */
router.post('/', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { type, driver_id, merchant_id, amount, method, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    let payout;
    if (type === 'driver' || !driver_id) {
      if (!driver_id) {
        return res.status(400).json({
          success: false,
          error: 'driver_id is required for driver payouts'
        });
      }

      payout = await prisma.driver_Payouts.create({
        data: {
          driver_id,
          amount,
          method: method || 'BANK_TRANSFER',
          status: 'PENDING',
          notes: notes || ''
        }
      });
    } else {
      if (!merchant_id) {
        return res.status(400).json({
          success: false,
          error: 'merchant_id is required for merchant payouts'
        });
      }

      // Try to create merchant payout
      try {
        payout = await prisma.Merchant_Payouts.create({
          data: {
            partner_id: merchant_id,
            amount,
            method: method || 'BANK_TRANSFER',
            status: 'PENDING',
            notes: notes || ''
          }
        });
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Merchant payouts table not available'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: payout
    });
  } catch (error) {
    console.error('Create payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payout'
    });
  }
});

/**
 * PATCH /api/admin/payouts/:id
 * Update payout status
 */
router.patch('/:id', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_reference, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // Try driver payouts first
    let payout = await prisma.driver_Payouts.findUnique({ where: { id } });
    
    if (!payout) {
      // Try merchant payouts
      try {
        payout = await prisma.Merchant_Payouts.findUnique({ where: { id } });
        if (payout) {
          payout = await prisma.Merchant_Payouts.update({
            where: { id },
            data: {
              status,
              payment_reference: payment_reference || null,
              notes: notes || payout.notes,
              processed_at: status === 'PAID' ? new Date() : payout.processed_at
            }
          });
        }
      } catch (e) {
        // Table might not exist
      }
    } else {
      payout = await prisma.driver_Payouts.update({
        where: { id },
        data: {
          status,
          payment_reference: payment_reference || null,
          notes: notes || payout.notes,
          processed_at: status === 'PAID' ? new Date() : payout.processed_at
        }
      });
    }

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      });
    }

    res.json({
      success: true,
      data: payout
    });
  } catch (error) {
    console.error('Update payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payout'
    });
  }
});

/**
 * POST /api/admin/payouts/:id/approve
 * Approve a pending payout
 */
router.post('/:id/approve', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_reference } = req.body;

    let payout = await prisma.driver_Payouts.findUnique({ where: { id } });
    
    if (!payout) {
      try {
        payout = await prisma.Merchant_Payouts.findUnique({ where: { id } });
        if (payout) {
          payout = await prisma.Merchant_Payouts.update({
            where: { id },
            data: { status: 'PROCESSING', payment_reference }
          });
        }
      } catch (e) {}
    } else {
      payout = await prisma.driver_Payouts.update({
        where: { id },
        data: { status: 'PROCESSING', payment_reference }
      });
    }

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      });
    }

    res.json({
      success: true,
      data: payout,
      message: 'Payout approved'
    });
  } catch (error) {
    console.error('Approve payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve payout'
    });
  }
});

/**
 * POST /api/admin/payouts/:id/mark-paid
 * Mark payout as paid
 */
router.post('/:id/mark-paid', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_reference } = req.body;

    let payout = await prisma.driver_Payouts.findUnique({ where: { id } });
    
    if (!payout) {
      try {
        payout = await prisma.Merchant_Payouts.findUnique({ where: { id } });
        if (payout) {
          payout = await prisma.Merchant_Payouts.update({
            where: { id },
            data: {
              status: 'PAID',
              payment_reference: payment_reference || `PAY-${Date.now()}`,
              processed_at: new Date()
            }
          });
        }
      } catch (e) {}
    } else {
      payout = await prisma.driver_Payouts.update({
        where: { id },
        data: {
          status: 'PAID',
          payment_reference: payment_reference || `PAY-${Date.now()}`,
          processed_at: new Date()
        }
      });
    }

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      });
    }

    res.json({
      success: true,
      data: payout,
      message: 'Payout marked as paid'
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark payout as paid'
    });
  }
});

/**
 * POST /api/admin/payouts/:id/reject
 * Reject a payout
 */
router.post('/:id/reject', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    let payout = await prisma.driver_Payouts.findUnique({ where: { id } });
    
    if (!payout) {
      try {
        payout = await prisma.Merchant_Payouts.findUnique({ where: { id } });
        if (payout) {
          payout = await prisma.Merchant_Payouts.update({
            where: { id },
            data: { 
              status: 'FAILED', 
              notes: reason || 'Rejected by admin'
            }
          });
        }
      } catch (e) {}
    } else {
      payout = await prisma.driver_Payouts.update({
        where: { id },
        data: { 
          status: 'FAILED', 
          notes: reason || 'Rejected by admin'
        }
      });
    }

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found'
      });
    }

    res.json({
      success: true,
      data: payout,
      message: 'Payout rejected'
    });
  } catch (error) {
    console.error('Reject payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject payout'
    });
  }
});

export default router;
