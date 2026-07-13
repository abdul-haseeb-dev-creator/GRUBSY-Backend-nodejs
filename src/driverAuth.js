// grubsy-backend/src/driverAuth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ok, badRequest, unauthorized } from './utils/validate.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = express.Router();

// Driver JWT TTL in minutes (default 30 days)
const DRIVER_JWT_TTL_MINUTES = parseInt(process.env.DRIVER_JWT_TTL_MINUTES || '43200');

/**
 * Generate JWT tokens for driver
 */
function generateDriverTokens(driverId) {
  const accessToken = jwt.sign(
    {
      sub: driverId,
      role: 'driver',
      aud: 'driver',
    },
    process.env.JWT_SECRET,
    { expiresIn: `${DRIVER_JWT_TTL_MINUTES}m` },
  );

  const refreshToken = jwt.sign(
    {
      sub: driverId,
      type: 'refresh',
      role: 'driver',
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );

  return { accessToken, refreshToken };
}

/**
 * Stub OTP verification - for Phase 5, simple non-empty check
 * In production, this would integrate with SMS service
 */
function verifyOTP(phone, otp) {
  // Phase 5 stub: accept any non-empty OTP
  return otp && otp.trim().length > 0;
}

// POST /api/driver/auth/login
router.post('/login', async (req, res) => {
  const { phone, otp, email, password } = req.body || {};

  try {
    let driver;

    // Phone/OTP authentication
    if (phone && otp) {
      // Verify OTP (stubbed for Phase 5)
      if (!verifyOTP(phone, otp)) {
        return unauthorized(res, 'invalid OTP');
      }

      // Find or create driver by phone
      driver = await prisma.drivers.findFirst({
        where: { phone },
      });

      if (!driver) {
        // Create new driver
        driver = await prisma.drivers.create({
          data: {
            Driver_ID: `DRV-${Date.now()}`, // Generate unique ID
            first_name: `Driver`,
            last_name: phone.slice(-4),
            phone,
            email: null,
            status: 'active',
            vehicle_type: 'car',
            Registered_address: 'Not specified',
            address_line1: 'Not specified',
            city: 'Not specified',
            postcode: 'Not specified',
            country: 'GB',
          },
        });
      }
    }
    // Email/Password authentication
    else if (email && password) {
      // Find driver by email or phone
      driver = await prisma.drivers.findFirst({
        where: {
          OR: [
            { email: email },
            { phone: email } // Allow phone as email fallback
          ]
        },
      });

      if (!driver) {
        return unauthorized(res, 'invalid credentials');
      }

      // Verify password - handle both hashed and plain text for testing
      let isValidPassword = false;
      if (driver.driver_pw && (driver.driver_pw.startsWith('$2a$') || driver.driver_pw.startsWith('$2b$') || driver.driver_pw.startsWith('$2y$'))) {
        // Password is hashed
        isValidPassword = await bcrypt.compare(password, driver.driver_pw);
      } else if (driver.driver_pw) {
        // Password is plain text (for testing)
        isValidPassword = password === driver.driver_pw;
      } else {
        // No password set for this driver
        return unauthorized(res, 'No password set for this account');
      }

      if (!isValidPassword) {
        return unauthorized(res, 'invalid credentials');
      }
    }
    else {
      return badRequest(res, 'phone/otp or email/password required', 'phone,otp,email,password');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateDriverTokens(driver.Driver_ID);

    return ok(res, {
      driver: {
        id: driver.Driver_ID,
        phone: driver.phone,
        name: `${driver.first_name} ${driver.last_name}`,
        vehicle: driver.vehicle_type,
        rating: driver.rating_avg,
        isAvailable: driver.availability === 'available',
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Driver login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// POST /api/driver/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return badRequest(res, 'refreshToken required', 'refreshToken');
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (payload.type !== 'refresh' || payload.role !== 'driver') {
      return unauthorized(res, 'invalid refresh token');
    }

    // Check if driver still exists
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: payload.sub },
    });

    if (!driver) {
      return unauthorized(res, 'driver not found');
    }

    // Generate new access token
    const { accessToken } = generateDriverTokens(driver.Driver_ID);

    return ok(res, {
      accessToken,
    });

  } catch (error) {
    console.error('Driver token refresh error:', error);
    return unauthorized(res, 'invalid refresh token');
  }
});

export default router;
