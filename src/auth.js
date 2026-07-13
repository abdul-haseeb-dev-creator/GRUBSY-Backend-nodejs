// grubsy-backend/src/auth.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { badRequest, ok, unauthorized } from './utils/validate.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { getRateLimiter } from '../middleware/rateLimiting.js';

const prisma = new PrismaClient();
const router = express.Router();

// User JWT TTL in minutes (default 24 hours)
const USER_JWT_TTL_MINUTES = parseInt(process.env.USER_JWT_TTL_MINUTES || '1440');

/**
 * Generate JWT tokens for user
 */
function generateUserTokens(userId, role = 'CUSTOMER') {
  const accessToken = jwt.sign(
    {
      sub: userId,
      role: role,
      aud: 'user',
    },
    process.env.JWT_SECRET,
    { expiresIn: `${USER_JWT_TTL_MINUTES}m` },
  );

  const refreshToken = jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      role: role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );

  return { accessToken, refreshToken };
}

/**
 * Generate JWT tokens for merchant
 */
function generateMerchantTokens(merchantId, partnerId, role = 'MERCHANT') {
  const accessToken = jwt.sign(
    {
      sub: merchantId,
      partnerId: partnerId,
      role: role,
      aud: 'merchant',
    },
    process.env.JWT_SECRET,
    { expiresIn: `${USER_JWT_TTL_MINUTES}m` },
  );

  const refreshToken = jwt.sign(
    {
      sub: merchantId,
      partnerId: partnerId,
      type: 'refresh',
      role: role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );

  return { accessToken, refreshToken };
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'user@example.com'
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: 'securepassword123'
 *                 description: User's password (minimum 6 characters)
 *               name:
 *                 type: string
 *                 example: 'John Smith'
 *                 description: User's full name
 *               phone:
 *                 type: string
 *                 example: '+44 7123 456789'
 *                 description: User's phone number (optional)
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *       400:
 *         description: Missing required fields or user already exists
 *       500:
 *         description: Server error
 */

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, phone } = req.body || {};

  if (!email || !password || !name) {
    return badRequest(res, 'email, password, and name required', 'email,password,name');
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { Users_Email: email },
    });

    if (existingUser) {
      return badRequest(res, 'User already exists with this email', 'email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        Users_Email: email,
        Users_Password: passwordHash,
        Users_Full_Name: name,
        Users_Phone_Number: phone || null,
        Grubsy_User_ID: `GU-${Date.now()}`,
        Is_New_User: 'Yes',
        Status: 'Active',
        Acc_Created_At: new Date().toISOString(),
      },
    });

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateUserTokens(user.id, user.role);

    return ok(res, {
      user: {
        id: user.id,
        email: user.Users_Email,
        name: user.Users_Full_Name,
        phone: user.Users_Phone_Number,
        role: 'CUSTOMER',
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('User registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'user@example.com'
 *               password:
 *                 type: string
 *                 example: 'securepassword123'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return badRequest(res, 'email and password required', 'email,password');
  }

  try {
    // Find user by email
    const user = await prisma.users.findUnique({
      where: { Users_Email: email },
    });

    if (!user) {
      return unauthorized(res, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.Users_Password);
    if (!isValidPassword) {
      return unauthorized(res, 'Invalid email or password');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateUserTokens(user.id, user.role);

    return ok(res, {
      user: {
        id: user.id,
        email: user.Users_Email,
        name: user.Users_Full_Name,
        phone: user.Users_Phone_Number,
        role: 'CUSTOMER',
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('User login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * @swagger
 * /api/auth/merchant/login:
 *   post:
 *     summary: Login merchant with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'merchant@restaurant.com'
 *               password:
 *                 type: string
 *                 example: 'merchantpassword123'
 *     responses:
 *       200:
 *         description: Merchant login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     merchant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         partnerId:
 *                           type: string
 *                         photo:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

// POST /api/auth/merchant/login
router.post('/merchant/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return badRequest(res, 'email and password required', 'email,password');
  }

  try {
    console.log('🔐 Merchant login attempt:', { email, hasPassword: !!password });

    // Find merchant by email OR partner ID
    let merchant;
    if (email.includes('@')) {
      // If it contains @, treat as email
      console.log('📧 Looking up merchant by email:', email);
      merchant = await prisma.merchants.findUnique({
        where: { Merchants_Email: email },
        select: {
          id: true,
          Grubsy_Partner_ID: true,
          Merchants_Name: true,
          Merchants_Email: true,
          Merchants_Password: true,
          Photo: true,
          Owners_Number: true,
          Address: true,
          PostCode: true,
          Cuisine: true,
          Opening_Times: true,
          Halal_Friendly: true,
          Hygiene_Rating: true,
          Active: true,
          Description: true,
          Area: true,
          Booking_Available: true,
        },
      });
    } else {
      // If no @, treat as partner ID
      console.log('🏷️ Looking up merchant by partner ID:', email);
      merchant = await prisma.merchants.findUnique({
        where: { Grubsy_Partner_ID: email },
        select: {
          id: true,
          Grubsy_Partner_ID: true,
          Merchants_Name: true,
          Merchants_Email: true,
          Merchants_Password: true,
          Photo: true,
          Owners_Number: true,
          Address: true,
          PostCode: true,
          Cuisine: true,
          Opening_Times: true,
          Halal_Friendly: true,
          Hygiene_Rating: true,
          Active: true,
          Description: true,
          Area: true,
          Booking_Available: true,
        },
      });
    }

    console.log('👤 Merchant lookup result:', {
      found: !!merchant,
      merchantId: merchant?.id,
      merchantName: merchant?.Merchants_Name,
      hasPassword: !!merchant?.Merchants_Password,
      partnerId: merchant?.Grubsy_Partner_ID
    });

    if (!merchant) {
      console.log('❌ Merchant not found');
      return unauthorized(res, 'Invalid email or password');
    }

    // Check if password field exists
    if (!merchant.Merchants_Password) {
      console.log('❌ No password set for merchant');
      return unauthorized(res, 'Account not configured for login');
    }

    // Verify password
    console.log('🔒 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, merchant.Merchants_Password);
    console.log('🔒 Password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return unauthorized(res, 'Invalid email or password');
    }

    console.log('✅ Authentication successful');

    // Generate JWT tokens with partner ID
    const { accessToken, refreshToken } = generateMerchantTokens(
      merchant.id,
      merchant.Grubsy_Partner_ID,
      'MERCHANT'
    );

    return ok(res, {
      accessToken,
      refreshToken,
      Grubsy_Partner_ID: merchant.Grubsy_Partner_ID,
      user: {
        email: merchant.Merchants_Email,
        name: merchant.Merchants_Name,
      },
      merchant: {
        id: merchant.id,
        email: merchant.Merchants_Email,
        name: merchant.Merchants_Name,
        businessName: merchant.Merchants_Name,
        partnerId: merchant.Grubsy_Partner_ID,
        photo: merchant.Photo,
        phone: merchant.Owners_Number,
        address: merchant.Address,
        postcode: merchant.PostCode,
        cuisine: merchant.Cuisine,
        openingTimes: merchant.Opening_Times,
        halalFriendly: merchant.Halal_Friendly,
        hygieneRating: merchant.Hygiene_Rating,
        active: merchant.Active,
      },
    });

  } catch (error) {
    console.error('Merchant login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token obtained from login/register
 *                 example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New JWT access token
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return badRequest(res, 'refreshToken required', 'refreshToken');
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (payload.type !== 'refresh') {
      return unauthorized(res, 'invalid refresh token');
    }

    // Check if user still exists
    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return unauthorized(res, 'user not found');
    }

    // Generate new access token
    const { accessToken } = generateUserTokens(user.id, 'CUSTOMER');

    return ok(res, {
      accessToken,
    });

  } catch (error) {
    console.error('User token refresh error:', error);
    return unauthorized(res, 'invalid refresh token');
  }
});

// =============================================================================
// MERCHANT PASSWORD RESET ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/auth/merchant/forgot-password:
 *   post:
 *     summary: Request password reset for merchant
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'merchant@example.com'
 *     responses:
 *       200:
 *         description: Password reset code sent (always returns success for security)
 *       400:
 *         description: Invalid email format
 *       429:
 *         description: Too many requests
 */
router.post('/merchant/forgot-password', 
  getRateLimiter('passwordReset'), // Rate limit: 3-5 requests per hour
  async (req, res) => {
    const { email } = req.body || {};

    if (!email) {
      return badRequest(res, 'email is required', 'email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequest(res, 'Invalid email format');
    }

    try {
      console.log('🔐 Password reset request for merchant:', email);

      // Check if merchant exists (but don't reveal if they don't for security)
      const merchant = await prisma.merchants.findUnique({
        where: { Merchants_Email: email },
        select: { Merchants_Email: true, Merchants_Name: true },
      });

      // Always return success for security (don't reveal if email exists)
      // But only send email if merchant exists
      if (merchant) {
        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set expiration to 30 minutes from now
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);

        // Invalidate any existing unused tokens for this email
        await prisma.Merchant_Password_Resets.updateMany({
          where: {
            email: email,
            used: false,
            expires_at: { gt: new Date() }, // Only active tokens
          },
          data: {
            used: true, // Mark as used/invalid
          },
        });

        // Create new reset token record
        await prisma.Merchant_Password_Resets.create({
          data: {
            email: email,
            token: resetCode,
            expires_at: expiresAt,
            used: false,
          },
        });

        // Send email with reset code
        await sendPasswordResetEmail(email, resetCode);

        console.log('✅ Password reset code generated and sent to:', email);
      } else {
        console.log('⚠️ Password reset requested for non-existent email:', email, '(returning success for security)');
      }

      // Always return success message (security best practice)
      return ok(res, {
        message: 'Password reset code sent to your email',
      });

    } catch (error) {
      console.error('❌ Password reset request error:', error);
      // Still return success for security
      return ok(res, {
        message: 'Password reset code sent to your email',
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/merchant/reset-password:
 *   post:
 *     summary: Reset merchant password using reset code
 *     tags: [Merchant Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               token:
 *                 type: string
 *                 description: 6-digit reset code from email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset code, or password doesn't meet requirements
 */
router.post('/merchant/reset-password',
  getRateLimiter('passwordResetAttempt'), // Rate limit: 5-10 attempts per token
  async (req, res) => {
    const { email, token, newPassword } = req.body || {};

    if (!email || !token || !newPassword) {
      return badRequest(res, 'email, token, and newPassword are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return badRequest(res, 'Invalid email format');
    }

    // Validate password requirements (minimum 8 characters)
    if (newPassword.length < 8) {
      return badRequest(res, 'Password must be at least 8 characters long');
    }

    try {
      console.log('🔐 Password reset attempt for merchant:', email);

      // Find valid reset token
      const resetRecord = await prisma.Merchant_Password_Resets.findFirst({
        where: {
          email: email,
          token: token,
          used: false,
          expires_at: { gt: new Date() }, // Not expired
        },
        orderBy: {
          created_at: 'desc', // Get most recent
        },
      });

      if (!resetRecord) {
        console.log('❌ Invalid or expired reset token for:', email);
        return badRequest(res, 'Invalid or expired reset code');
      }

      // Check if merchant exists
      const merchant = await prisma.merchants.findUnique({
        where: { Merchants_Email: email },
        select: { id: true, Merchants_Email: true },
      });

      if (!merchant) {
        return badRequest(res, 'Invalid or expired reset code');
      }

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update merchant password
      await prisma.merchants.update({
        where: { Merchants_Email: email },
        data: {
          Merchants_Password: hashedPassword,
        },
      });

      // Mark reset token as used
      await prisma.Merchant_Password_Resets.update({
        where: { id: resetRecord.id },
        data: {
          used: true,
        },
      });

      // Invalidate any other active tokens for this email
      await prisma.Merchant_Password_Resets.updateMany({
        where: {
          email: email,
          used: false,
          id: { not: resetRecord.id },
        },
        data: {
          used: true,
        },
      });

      console.log('✅ Password reset successful for merchant:', email);

      return ok(res, {
        message: 'Password reset successfully',
      });

    } catch (error) {
      console.error('❌ Password reset error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reset password',
      });
    }
  }
);

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  try {
    // For now, return success - profile updates not implemented yet
    return ok(res, { message: 'Profile update not implemented yet' });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

export default router;