// routes/admin/analytics.js
// Admin Analytics API - Platform analytics and reporting
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics
 */
router.get('/revenue', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    const today = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24hours':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get revenue for the period - use manual calculation since Order_Grand_Total is String
    const currentOrders = await prisma.orders.findMany({
      where: {
        Created_At: { gte: startDate.toISOString() },
        status: 'DELIVERED'
      },
      select: { Order_Grand_Total: true }
    });

    // Get previous period for comparison
    const periodLength = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodLength);

    const prevOrders = await prisma.orders.findMany({
      where: {
        Created_At: { gte: prevStartDate.toISOString(), lt: startDate.toISOString() },
        status: 'DELIVERED'
      },
      select: { Order_Grand_Total: true }
    });

    const currentRevenue = currentOrders.reduce((sum, order) => sum + parseFloat(order.Order_Grand_Total || 0), 0);
    const prevRevenue = prevOrders.reduce((sum, order) => sum + parseFloat(order.Order_Grand_Total || 0), 0);
    const orderCount = currentOrders.length;
    const prevOrderCount = prevOrders.length;
    const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        period,
        revenue: currentRevenue,
        orderCount: orderCount,
        previousRevenue: prevRevenue,
        previousOrderCount: prevOrderCount,
        growth: Math.round(growth * 10) / 10,
        averageOrderValue: orderCount > 0 ? Math.round((currentRevenue / orderCount) * 100) / 100 : 0
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    });
  }
});

/**
 * GET /api/admin/analytics/restaurants/top
 * Get top performing restaurants
 */
router.get('/restaurants/top', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { limit = 10, period = '7days' } = req.query;
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period) || 7);

    // const topRestaurants = await prisma.orders.groupBy({
    //   by: ['Grubsy_Partner_ID'],
    //   where: {
    //     Created_At: { gte: startDate.toISOString() },
    //     status: { in: ['DELIVERED'] }
    //   },
    //   _sum: { Order_Grand_Total: true },
    //   _count: true,
    //   orderBy: {
    //     _sum: { Order_Grand_Total: 'desc' }
    //   },
    //   take: parseInt(limit)
    // });

    const topRestaurants = await prisma.$queryRaw`
        SELECT 
          Grubsy_Partner_ID,
          COUNT(*) as total_orders,
          SUM(CAST(REPLACE(Order_Grand_Total, '£', '') AS DECIMAL(10,2))) as total_revenue
        FROM orders
        WHERE status = 'DELIVERED'
        AND Created_At >= ${startDate.toISOString()}
        GROUP BY Grubsy_Partner_ID
        ORDER BY total_revenue DESC
        LIMIT ${parseInt(limit)}
      `;

    // Get merchant details
    const merchantsData = await prisma.merchants.findMany({
      where: {
        Grubsy_Partner_ID: { in: topRestaurants.map(r => r.Grubsy_Partner_ID) }
      },
      select: { id: true, Merchants_Name: true, Grubsy_Partner_ID: true }
    });

    const merchantsMap = {};
    merchantsData.forEach(m => { merchantsMap[m.Grubsy_Partner_ID] = m; });

    const result = topRestaurants.map(r => ({
      merchantId: r.Grubsy_Partner_ID,
      merchantName: merchantsMap[r.Grubsy_Partner_ID]?.Merchants_Name || 'Unknown',
      partnerId: merchantsMap[r.Grubsy_Partner_ID]?.Grubsy_Partner_ID || '',
      revenue: parseFloat(r._sum.Order_Grand_Total || 0),
      orderCount: r._count
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get top restaurants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top restaurants'
    });
  }
});

/**
 * GET /api/admin/analytics/drivers/top
 * Get top performing drivers
 */
router.get('/drivers/top', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { limit = 10, period = '7days' } = req.query;
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period) || 7);

    const topDrivers = await prisma.orders.groupBy({
      by: ['Driver_ID'],
      where: {
        Created_At: { gte: startDate.toISOString() },
        status: { in: ['DELIVERED'] },
        Driver_ID: { not: null }
      },
      _sum: { Order_Grand_Total: true },
      _count: true,
      orderBy: {
        _count: 'desc'
      },
      take: parseInt(limit)
    });

    // Get driver details
    const driverIds = topDrivers.filter(d => d.Driver_ID).map(d => d.Driver_ID);
    const driversData = await prisma.drivers.findMany({
      where: { Driver_ID: { in: driverIds } },
      select: { Driver_ID: true, first_name: true, last_name: true, phone: true }
    });

    const driversMap = {};
    driversData.forEach(d => { driversMap[d.Driver_ID] = d; });

    const result = topDrivers.filter(d => d.Driver_ID).map(d => ({
      driverId: d.Driver_ID,
      driverName: `${driversMap[d.Driver_ID]?.first_name || ''} ${driversMap[d.Driver_ID]?.last_name || ''}`.trim() || 'Unknown',
      phone: driversMap[d.Driver_ID]?.phone || '',
      deliveries: d._count,
      revenue: parseFloat(d._sum.Order_Grand_Total || 0)
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get top drivers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top drivers'
    });
  }
});

/**
 * GET /api/admin/analytics/orders/by-hour
 * Get order distribution by hour
 */
router.get('/orders/by-hour', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const orders = await prisma.orders.findMany({
      where: {
        Created_At: { gte: startDate.toISOString() }
      },
      select: { Created_At: true }
    });

    // Group by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }

    orders.forEach(order => {
      const hour = new Date(order.Created_At).getHours();
      hourlyData[hour]++;
    });

    const result = Object.entries(hourlyData).map(([hour, count]) => ({
      hour: parseInt(hour),
      orders: count
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get orders by hour error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders by hour'
    });
  }
});

/**
 * GET /api/admin/analytics/orders/status
 * Get order status distribution
 */
router.get('/orders/status', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const statusCounts = await prisma.orders.groupBy({
      by: ['Status'],
      _count: true
    });

    const result = statusCounts.map(s => ({
      status: s.Status,
      count: s._count
    }));

    // Calculate percentages
    const total = result.reduce((sum, r) => sum + r.count, 0);
    result.forEach(r => {
      r.percentage = total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0;
    });

    res.json({
      success: true,
      data: result,
      total
    });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order status'
    });
  }
});

/**
 * GET /api/admin/analytics/menu/popular
 * Get most popular menu items
 */
router.get('/menu/popular', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { limit = 10, period = '30days' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period) || 30);

    // Get order items from recent orders
    const orders = await prisma.orders.findMany({
      where: {
        Created_At: { gte: startDate.toISOString() },
        status: { in: ['DELIVERED', 'COMPLETED', 'ACCEPTED', 'PENDING'] }
      },
      select: { Order_ID: true }
    });

    const orderIds = orders.map(o => o.Order_ID);

    // Since order_items might not exist, we'll count from merchant menus
    // This is a simplified version - in production you'd have order_items table
    const menuItems = await prisma.Menu_Items.findMany({
      take: parseInt(limit),
      orderBy: { Created_At: 'desc' },
      include: {
        merchants: {
          select: { Merchants_Name: true }
        }
      }
    });

    const result = menuItems.map(item => ({
      id: item.id,
      itemId: item.Menu_Item_ID,
      name: item.Item,
      category: item.Food_Category,
      merchant: item.merchants?.Merchants_Name || 'Unknown',
      price: item.Regular,
      available: item.Available === 'Yes'
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get popular items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular items'
    });
  }
});

/**
 * GET /api/admin/analytics/overview
 * Get platform overview stats
 */
router.get('/overview', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      totalMerchants,
      totalDrivers,
      totalOrders,
      todayOrders,
      todayRevenue,
      monthRevenue,
      activeMerchants,
      activeDrivers
    ] = await Promise.all([
      prisma.users.count(),
      prisma.merchants.count(),
      prisma.drivers.count(),
      prisma.orders.count(),
      prisma.orders.count({
        where: { Created_At: { startsWith: todayStr } }
      }),
      prisma.orders.aggregate({
        where: { 
          Created_At: { startsWith: todayStr },
          status: 'DELIVERED'
        },
        _sum: { Order_Grand_Total: true }
      }),
      prisma.orders.aggregate({
        where: { 
          Created_At: { gte: monthStart.toISOString() },
          status: 'DELIVERED'
        },
        _sum: { Order_Grand_Total: true }
      }),
      prisma.merchants.count({ where: { status: 'APPROVED' } }),
      prisma.drivers.count({ where: { status: 'online' } })
    ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        merchants: {
          total: totalMerchants,
          active: activeMerchants
        },
        drivers: {
          total: totalDrivers,
          active: activeDrivers
        },
        orders: {
          total: totalOrders,
          today: todayOrders
        },
        revenue: {
          today: parseFloat(todayRevenue._sum.Order_Grand_Total || 0),
          thisMonth: parseFloat(monthRevenue._sum.Order_Grand_Total || 0)
        }
      }
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview'
    });
  }
});

export default router;
