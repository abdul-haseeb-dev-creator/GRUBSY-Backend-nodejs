// middleware/auth.js
// Authentication middleware for users and drivers

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authenticate user requests
 * Validates JWT token with aud=user and supports restaurant staff roles
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is for user audience
    if (decoded.aud !== 'user') {
      return res.status(401).json({
        error: 'Invalid user token',
      });
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    // Validate role for restaurant operations
    const allowedRoles = ['MERCHANT', 'PARTNER', 'ADMIN', 'DEVSTAFF'];
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({
        error: 'Access denied. Restaurant operations require appropriate staff privileges.',
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      aud: decoded.aud,
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication',
    });
  }
}

/**
 * Authenticate driver requests
 * Validates JWT token with aud=driver
 */
async function authenticateDriver(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is for driver audience
    if (decoded.aud !== 'driver') {
      return res.status(401).json({
        error: 'Invalid driver token',
      });
    }

    // Verify driver still exists
    const driver = await prisma.driver.findUnique({
      where: { id: decoded.driverId },
      select: { id: true, email: true, fullName: true, status: true },
    });

    if (!driver) {
      return res.status(401).json({
        error: 'Driver not found',
      });
    }

    // Add driver info to request
    req.driver = {
      driverId: decoded.driverId,
      email: decoded.email,
      role: decoded.role,
      aud: decoded.aud,
      status: driver.status,
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
      });
    }

    console.error('Driver authentication error:', error);
    res.status(500).json({
      error: 'Internal server error during authentication',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 * Used for endpoints that work for both authenticated and anonymous users
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      req.driver = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.aud === 'user') {
      // User token
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, fullName: true },
      });

      if (user) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          aud: decoded.aud,
        };
      }
    } else if (decoded.aud === 'driver') {
      // Driver token
      const driver = await prisma.driver.findUnique({
        where: { id: decoded.driverId },
        select: { id: true, email: true, fullName: true, status: true },
      });

      if (driver) {
        req.driver = {
          driverId: decoded.driverId,
          email: decoded.email,
          role: decoded.role,
          aud: decoded.aud,
          status: driver.status,
        };
      }
    }

    next();

  } catch (error) {
    // On any error, continue without authentication
    req.user = null;
    req.driver = null;
    next();
  }
}

module.exports = {
  authenticateUser,
  authenticateDriver,
  optionalAuth,
};
