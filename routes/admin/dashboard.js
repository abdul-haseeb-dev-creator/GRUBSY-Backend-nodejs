// routes/admin/dashboard.js
// Admin Dashboard API - Statistics and overview data
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/dashboard/stats
 * Get overall platform statistics
 */
router.get('/stats', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get counts in parallel
    const [
      totalUsers,
      totalMerchants,
      totalDrivers,
      totalOrdersResult,
      todayOrdersResult,
      activeDrivers,
      pendingMerchants
    ] = await Promise.all([
      prisma.users.count(),
      prisma.merchants.count(),
      prisma.drivers.count(),
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM orders
        WHERE status = 'DELIVERED'
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM orders
        WHERE status = 'DELIVERED'
        AND DATE(Created_At) = CURDATE()
      `,
      prisma.drivers.count({
        where: { status: 'active' }
      }),
      prisma.merchants.count({
        where: { Merchant_Enrolement_Status: 'Pending' }
      })
    ]);

    const totalOrders = parseInt(totalOrdersResult[0]?.count || 0);
    const todayOrders = parseInt(todayOrdersResult[0]?.count || 0);
    const todayRevenue = await prisma.$queryRaw`
      SELECT
        SUM(CAST(REPLACE(Order_Grand_Total, '£', '') AS DECIMAL(10,2))) as total
      FROM orders
      WHERE status = 'DELIVERED'
      AND DATE(Created_At) = CURDATE()
    `;
    const monthRevenue = await prisma.$queryRaw`
      SELECT
        SUM(CAST(REPLACE(Order_Grand_Total, '£', '') AS DECIMAL(10,2))) as total
      FROM orders
      WHERE status = 'DELIVERED'
      AND YEAR(Created_At) = YEAR(CURDATE())
      AND MONTH(Created_At) = MONTH(CURDATE())
      `;
      console.log(todayRevenue,monthRevenue)
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers
        },
        merchants: {
          total: totalMerchants,
          pending: pendingMerchants
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
          today: parseFloat(todayRevenue[0]?.total || 0),
          thisMonth: parseFloat(monthRevenue[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/admin/dashboard/overview
 * Get overall platform statistics (same as stats endpoint)
 */
router.get('/overview', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get counts in parallel
    const [
      totalUsers,
      totalMerchants,
      totalDrivers,
      totalOrdersResult,
      todayOrdersResult,
      activeDrivers,
      pendingMerchants
    ] = await Promise.all([
      prisma.users.count(),
      prisma.merchants.count(),
      prisma.drivers.count(),
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM orders
        WHERE status = 'DELIVERED'
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM orders
        WHERE status = 'DELIVERED'
        AND DATE(Created_At) = CURDATE()
      `,
      prisma.drivers.count({
        where: { status: 'active' }
      }),
      prisma.merchants.count({
        where: { Merchant_Enrolement_Status: 'Pending' }
      })
    ]);

    const totalOrders = parseInt(totalOrdersResult[0]?.count || 0);
    const todayOrders = parseInt(todayOrdersResult[0]?.count || 0);
    const todayRevenue = await prisma.$queryRaw`
      SELECT
        SUM(CAST(REPLACE(Order_Grand_Total, '£', '') AS DECIMAL(10,2))) as total
      FROM orders
      WHERE status = 'DELIVERED'
      AND DATE(Created_At) = CURDATE()
    `;
    const monthRevenue = await prisma.$queryRaw`
      SELECT
        SUM(CAST(REPLACE(Order_Grand_Total, '£', '') AS DECIMAL(10,2))) as total
      FROM orders
      WHERE status = 'DELIVERED'
      AND YEAR(Created_At) = YEAR(CURDATE())
      AND MONTH(Created_At) = MONTH(CURDATE())
      `;
      console.log(todayRevenue,monthRevenue)
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers
        },
        merchants: {
          total: totalMerchants,
          pending: pendingMerchants
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
          today: parseFloat(todayRevenue[0]?.total || 0),
          thisMonth: parseFloat(monthRevenue[0]?.total || 0)
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard overview'
    });
  }
});

/**
 * GET /api/admin/dashboard/recent-activity
 * Get recent platform activity
 */
router.get('/recent-activity', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [recentOrders, recentUsers, recentMerchants, topRestaurants] = await Promise.all([
      prisma.orders.findMany({
        take: limit,
        orderBy: { Created_At: 'desc' },
        select: {
          orderId: true,
          status: true,
          Created_At: true,
          Users_Full_Name: true,
          Merchants_Name: true,
          Order_ID: true,
          Order_Grand_Total: true
        }
      }),
      prisma.users.findMany({
        take: limit,
        orderBy: { Created_At: 'desc' },
        select: {
          Grubsy_User_ID: true,
          Users_Full_Name: true,
          Users_Email: true,
          Created_At: true
        }
      }),
      prisma.merchants.findMany({
        take: limit,
        orderBy: { Created_At: 'desc' },
        select: {
          Merchants_ID: true,
          Merchants_Name: true,
          status: true,
          Created_At: true
        }
      }),
      prisma.$queryRaw`
        SELECT m.Merchants_Name, COUNT(o.id) as order_count, SUM(CAST(REPLACE(o.Order_Grand_Total, '£', '') AS DECIMAL(10,2))) as revenue
        FROM merchants m
        LEFT JOIN orders o ON m.Merchants_ID = o.Merchants_ID AND o.status = 'DELIVERED'
        GROUP BY m.Merchants_ID, m.Merchants_Name
        ORDER BY revenue DESC
        LIMIT 5
      `
    ]);

    res.json({
      success: true,
      data: {
        recentOrders,
        recentUsers,
        recentMerchants,
        top_restaurants: topRestaurants
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity'
    });
  }
});

/**
 * GET /api/admin/dashboard/charts
 * Get chart data for dashboard visualizations
 */
router.get('/charts', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders per day
    const orders = await prisma.orders.findMany({
      where: {
        Created_At: { gte: startDate.toISOString() }
      },
      select: {
        Created_At: true,
        status: true,
        Order_Grand_Total: true
      }
    });

    // Group by day
    const dailyStats = {};
    orders.forEach(order => {
      const day = order.Created_At.split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { orders: 0, revenue: 0 };
      }
      dailyStats[day].orders++;
      if (order.status === 'DELIVERED') {
        dailyStats[day].revenue += parseFloat(order.Order_Grand_Total || 0);
      }
    });

    // Format for charts
    const chartData = Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        orders: stats.orders,
        revenue: stats.revenue
      }));

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data'
    });
  }
});

export default router;
