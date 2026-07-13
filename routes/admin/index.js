// routes/admin/index.js
// Admin Panel Routes - Main router that mounts all admin sub-routes
// Uses ES modules to align with existing codebase (src/api.js)

import express from 'express';
const router = express.Router();

// Import admin sub-routes
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';
import merchantsRoutes from './merchants.js';
import usersRoutes from './users.js';
import ordersRoutes from './orders.js';
import driversRoutes from './drivers.js';
import menuRoutes from './menu.js';
import analyticsRoutes from './analytics.js';
import exceptionsRoutes from './exceptions.js';
import payoutsRoutes from './payouts.js';
import couponsRoutes from './coupons.js';
import auditRoutes from './audit.js';
import otpRoutes from './otp.js';
import notificationsRoutes from './notifications.js';
import settingsRoutes from './settings.js';

// Mount admin sub-routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/merchants', merchantsRoutes);
router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);
router.use('/drivers', driversRoutes);
router.use('/menu', menuRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/exceptions', exceptionsRoutes);
router.use('/payouts', payoutsRoutes);
router.use('/coupons', couponsRoutes);
router.use('/audit', auditRoutes);
router.use('/otp', otpRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/settings', settingsRoutes);

// Health check for admin routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;