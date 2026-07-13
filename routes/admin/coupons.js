// routes/admin/coupons.js
// Admin Coupons API - Manage promotional coupons
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/coupons
 * Get all coupons with optional filtering
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Coupons table doesn't exist - return empty result
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 50);
    const skip = (page - 1) * limit;
    const total = await prisma.coupons.count();

    // return res.json({
    //   success: true,
    //   data: [],
    //   pagination: {
    //     page: parseInt(req.query.page || 1),
    //     limit: parseInt(req.query.limit || 50),
    //     total: 0,
    //     pages: 0
    //   },
    //   message: 'Coupons feature not available'
    // });

    const coupons = await prisma.coupons.findMany({
     
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({
      success: true,
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'Coupons fetched successfully'
    });
  } catch (error) {
    console.error('Get coupons error:', error);

    // Return empty array for any error
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      message: 'Coupons table not available'
    });
  }
});

/**
 * GET /api/admin/coupons/:id
 * Get single coupon by ID
 */
router.get('/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await prisma.coupons.findUnique({
      where: { id }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coupon'
    });
  }
});

/**
 * POST /api/admin/coupons
 * Create new coupon
 */
router.post('/', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      usage_limit_per_user,
      start_date,
      end_date,
      applicable_merchants,
      applicable_categories,
      first_order_only,
      active
    } = req.body;

    // Validate required fields
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({
        success: false,
        error: 'code, discount_type, and discount_value are required'
      });
    }

    // Check if code already exists
    let existing;
    try {
      existing = await prisma.coupons.findUnique({
        where: { code: code.toUpperCase() }
      });
    } catch (e) {
      // Coupons table doesn't exist
      existing = null;
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code already exists'
      });
    }

    let coupon;
    try {

      const {
  code,
  description,
  discount_type,
  discount_value,

  // 👇 frontend fields
  min_order_value,
  max_discount,
  valid_from,
  valid_until,

  usage_limit,
  usage_limit_per_user,
  applicable_merchants,
  applicable_categories,
  first_order_only,
  active
} = req.body;
      coupon = await prisma.coupons.create({
  data: {
    code: code.toUpperCase(),
    description: description || '',
    discount_type,

    discount_value: parseFloat(discount_value),

    // ✅ FIXED MAPPING
    min_order_amount: min_order_value
      ? parseFloat(min_order_value)
      : null,

    max_discount_amount: max_discount
      ? parseFloat(max_discount)
      : null,

    usage_limit: usage_limit ? parseInt(usage_limit) : null,
    usage_limit_per_user: usage_limit_per_user
      ? parseInt(usage_limit_per_user)
      : null,

    start_date: valid_from ? new Date(valid_from) : new Date(),
    end_date: valid_until ? new Date(valid_until) : null,

    applicable_merchants: applicable_merchants
      ? JSON.stringify(applicable_merchants)
      : null,

    applicable_categories: applicable_categories
      ? JSON.stringify(applicable_categories)
      : null,

    first_order_only: first_order_only || false,
    active: active !== false,

    used_count: 0
  }
});
    } catch (e) {
      console.log('Coupon creation error:', e);
      return res.status(400).json({
        success: false,
        error: 'Coupons feature not available'
      });
    }

    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create coupon'
    });
  }
});

/**
 * PUT /api/admin/coupons/:id
 * Update coupon
 */
router.put('/:id', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if coupon exists
    const existing = await prisma.coupons.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Build update object
    const updateData = {};
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.discount_type !== undefined) updateData.discount_type = updates.discount_type;
    if (updates.discount_value !== undefined) updateData.discount_value = parseFloat(updates.discount_value);
    if (updates.min_order_amount !== undefined) updateData.min_order_amount = parseFloat(updates.min_order_amount);
    if (updates.max_discount_amount !== undefined) updateData.max_discount_amount = updates.max_discount_amount ? parseFloat(updates.max_discount_amount) : null;
    if (updates.usage_limit !== undefined) updateData.usage_limit = updates.usage_limit ? parseInt(updates.usage_limit) : null;
    if (updates.usage_limit_per_user !== undefined) updateData.usage_limit_per_user = updates.usage_limit_per_user ? parseInt(updates.usage_limit_per_user) : null;
    if (updates.start_date !== undefined) updateData.start_date = new Date(updates.start_date);
    if (updates.end_date !== undefined) updateData.end_date = updates.end_date ? new Date(updates.end_date) : null;
    if (updates.applicable_merchants !== undefined) updateData.applicable_merchants = updates.applicable_merchants;
    if (updates.applicable_categories !== undefined) updateData.applicable_categories = updates.applicable_categories;
    if (updates.first_order_only !== undefined) updateData.first_order_only = updates.first_order_only;
    if (updates.active !== undefined) updateData.active = updates.active;

    const coupon = await prisma.coupons.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update coupon'
    });
  }
});

/**
 * POST /api/admin/coupons/:id/toggle
 * Toggle coupon active status
 */
router.post('/:id/toggle', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const existing = await prisma.coupons.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    const newStatus = active !== undefined ? active : !existing.active;

    const coupon = await prisma.coupons.update({
      where: { id },
      data: { active: newStatus }
    });

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Toggle coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle coupon'
    });
  }
});

/**
 * DELETE /api/admin/coupons/:id
 * Delete coupon
 */
router.delete('/:id', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.coupons.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Don't allow deletion if coupon has been used
    if (existing.used_count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete coupon that has been used. Consider deactivating it instead.'
      });
    }

    await prisma.coupons.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete coupon'
    });
  }
});

/**
 * GET /api/admin/coupons/stats
 * Get coupon usage statistics
 */
router.get('/stats', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const now = new Date();
    
    const [totalCoupons, activeCoupons, expiredCoupons, totalUses] = await Promise.all([
      prisma.coupons.count(),
      prisma.coupons.count({
        where: {
          active: true,
          start_date: { lte: now.toISOString() },
          OR: [{ end_date: { gte: now.toISOString() } }, { end_date: null }]
        }
      }),
      prisma.coupons.count({
        where: {
          OR: [
            { end_date: { lt: now.toISOString() } },
            { active: false }
          ]
        }
      }),
      prisma.coupons.aggregate({
        _sum: { used_count: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalCoupons,
        active: activeCoupons,
        expired: expiredCoupons,
        totalUses: totalUses._sum.used_count || 0
      }
    });
  } catch (error) {
    console.error('Get coupon stats error:', error);
    res.json({
      success: true,
      data: { total: 0, active: 0, expired: 0, totalUses: 0 }
    });
  }
});

/**
 * POST /api/admin/coupons/:id/duplicate
 * Duplicate a coupon
 */
router.post('/:id/duplicate', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.coupons.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }

    // Create new code
    const newCode = `${existing.code}-COPY-${Date.now()}`;

    const coupon = await prisma.coupons.create({
      data: {
        code: newCode,
        description: existing.description + ' (Copy)',
        discount_type: existing.discount_type,
        discount_value: existing.discount_value,
        min_order_amount: existing.min_order_amount,
        max_discount_amount: existing.max_discount_amount,
        usage_limit: existing.usage_limit,
        usage_limit_per_user: existing.usage_limit_per_user,
        start_date: new Date(),
        end_date: existing.end_date,
        applicable_merchants: existing.applicable_merchants,
        applicable_categories: existing.applicable_categories,
        first_order_only: existing.first_order_only,
        active: false,
        used_count: 0
      }
    });

    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Duplicate coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate coupon'
    });
  }
});

export default router;
