// controllers/users.js
// User authentication controller - mirrors driver auth patterns

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validateEmail, validatePassword, validateRequiredFields } = require('../utils/validation');

const prisma = new PrismaClient();

// JWT configuration for users
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.CUSTOMER_JWT_TTL_MINUTES ? `${process.env.CUSTOMER_JWT_TTL_MINUTES}m` : '1440m'; // 24 hours default

/**
 * Register a new user
 * POST /api/users/register
 */
async function registerUser(req, res) {
  try {
    const { fullName, email, address, phone, dob, password } = req.body;

    // Validate required fields
    const requiredFields = { fullName, email, address, phone, dob, password };
    const validation = validateRequiredFields(requiredFields);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: validation.missingFields,
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        address,
        phone,
        dob,
        password: hashedPassword,
        createdAt: new Date(),
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: 'user',
        aud: 'user',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // Return user data (without password) and token
    // eslint-disable-next-line no-unused-vars
    const { password: userPassword, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration',
    });
  }
}

/**
 * Login user
 * POST /api/users/login
 */
async function loginUser(req, res) {
  try {
    const { email, password: loginPassword } = req.body;

    // Validate required fields
    if (!email || !loginPassword) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Determine user role for restaurant operations
    // For now, assign MERCHANT role to all users (this should be configurable based on user type)
    const userRole = 'MERCHANT'; // TODO: Make this configurable based on user type or database field

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: userRole,
        aud: 'user',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // Return user data (without password) and token
    // eslint-disable-next-line no-unused-vars
    const { password: userPassword2, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      error: 'Internal server error during login',
    });
  }
}

/**
 * Refresh user token
 * POST /api/users/refresh
 */
async function refreshUserToken(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);

    // Verify current token (even if expired)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Allow refresh of expired tokens
        decoded = jwt.decode(token);
      } else {
        return res.status(401).json({
          error: 'Invalid token',
        });
      }
    }

    if (!decoded || decoded.aud !== 'user') {
      return res.status(401).json({
        error: 'Invalid user token',
      });
    }

    // Find user to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    // Determine user role for restaurant operations
    const userRole = 'MERCHANT'; // TODO: Make this configurable based on user type or database field

    // Generate new JWT token
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: userRole,
        aud: 'user',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error during token refresh',
    });
  }
}

/**
 * Get user profile
 * GET /api/users/profile
 */
async function getUserProfile(req, res) {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        address: true,
        phone: true,
        dob: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      user,
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshUserToken,
  getUserProfile,
};
