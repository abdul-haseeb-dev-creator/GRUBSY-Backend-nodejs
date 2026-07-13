// grubsy-backend/src/orders.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from './middleware/authRequired.js';
import { badRequest, notFound, ok, forbidden } from './utils/validate.js';

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/orders - Role-based order fetching (as per technical documentation)
router.get('/orders', authRequired, async (req, res) => {
  console.log('🔍 ORDERS API: Called by user type:', req.user.type, 'partnerId:', req.user.partnerId);  const { role, status, near, limit = 20, offset = 0 } = req.query;

  try {
    // Merchant role: fetch authenticated merchant's orders
    if (req.user.type === 'merchant') {
      console.log('🔍 ORDERS API: Fetching orders for merchant partnerId:', req.user.partnerId);      const orders = await prisma.order.findMany({
        where: {
          partnerId: req.user.partnerId, // Filter by authenticated merchant's partner ID
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          merchant: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
              totalCents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      console.log('🔍 ORDERS API: Found', orders.length, 'orders for merchant');      return ok(res, orders);
    }

    // Driver role: fetch available orders
    if (role === 'driver' && status === 'available') {
      const orders = await prisma.order.findMany({
        where: {
          status: 'PENDING',
          driverId: null, // Not assigned to any driver yet
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          merchant: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
              totalCents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      return ok(res, orders);
    }

    // User role: fetch user's orders
    if (role === 'user') {
      const orders = await prisma.order.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
              totalCents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      return ok(res, orders);
    }

    return badRequest(res, 'Invalid role or status parameter');

  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
});

// POST /api/orders
router.post('/orders', authRequired, async (req, res) => {
  const { merchantId, items, deliveryAddress, notes } = req.body || {};
  if (!merchantId) return badRequest(res, 'merchantId required', 'merchantId');
  if (!Array.isArray(items) || items.length === 0) return badRequest(res, 'items required', 'items');
  if (!deliveryAddress) return badRequest(res, 'deliveryAddress required', 'deliveryAddress');

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) return notFound(res, 'merchant not found');

  const itemIds = items.map(i => i.menuItemId);
  const dbItems = await prisma.menuItem.findMany({ where: { id: { in: itemIds }, isAvailable: true } });
  if (dbItems.length !== items.length) return badRequest(res, 'one or more items invalid/unavailable', 'items');

  let subtotalCents = 0;
  const orderItemsData = items.map(i => {
    const found = dbItems.find(d => d.id === i.menuItemId);
    const qty = Math.max(1, Number(i.quantity || 1));
    const line = found.priceCents * qty;
    subtotalCents += line;
    return {
      menuItemId: found.id,
      name: found.name,
      quantity: qty,
      unitPriceCents: found.priceCents,
      totalCents: line,
    };
  });

  const deliveryCents = 0; // simple for now
  const totalCents = subtotalCents + deliveryCents;

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      merchantId,
      status: 'PENDING',
      subtotalCents,
      deliveryCents,
      totalCents,
      currency: 'GBP',
      deliveryAddress,
      notes: notes || null,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  return ok(res, {
    id: order.id,
    status: order.status,
    totals: { subtotalCents, deliveryCents, totalCents, currency: order.currency },
    items: order.items,
  });
});

// GET /api/orders/:id
router.get('/orders/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return notFound(res, 'order not found');
  if (order.userId !== req.user.id) return forbidden(res, 'not your order');

  return ok(res, {
    id: order.id,
    status: order.status,
    totals: {
      subtotalCents: order.subtotalCents,
      deliveryCents: order.deliveryCents,
      totalCents: order.totalCents,
      currency: order.currency,
    },
    items: order.items,
    merchantId: order.merchantId,
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
  });
});

export default router;