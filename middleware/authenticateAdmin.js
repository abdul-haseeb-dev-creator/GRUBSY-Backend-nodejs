// middleware/authenticateAdmin.js
// Admin authentication middleware - validates JWT tokens for admin users
// Uses ES modules to align with existing codebase

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authenticate admin/user requests
 * Validates JWT token and checks for admin roles
 */
export async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify this is an admin token
    if (decoded.aud !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin token',
      });
    }

    // Check if admin user still exists
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.sub },
    });

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Admin user not found',
      });
    }

    // Add user info to request
    req.user = {
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      aud: decoded.aud,
      partnerId: decoded.partnerId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
}

/**
 * Require specific roles for accessing admin endpoints
 * @param {...string} allowedRoles - Roles that are allowed to access the endpoint
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

export default { authenticateAdmin, requireRole };
