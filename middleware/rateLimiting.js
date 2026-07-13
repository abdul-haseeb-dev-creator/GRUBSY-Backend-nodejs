// middleware/rateLimiting.js
// HTTP rate limiting middleware using express-rate-limit

import rateLimit from 'express-rate-limit';

// Check if rate limiting is disabled in development
const isRateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true' && process.env.NODE_ENV === 'development';

/**
 * Create rate limiter with custom key generator for user-based limiting
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware function
 */
function createRateLimiter(options) {
  if (isRateLimitDisabled) {
    // Return no-op middleware if rate limiting is disabled
    return (req, res, next) => next();
  }

  const defaultOptions = {
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      });
    },
    ...options,
  };

  return rateLimit(defaultOptions);
}

/**
 * Generate key for user-based rate limiting
 * Falls back to IP if user is not authenticated
 */
function getUserBasedKey(req) {
  // Try to get user ID from authenticated request
  const userId = req.user?.userId || req.driver?.driverId;
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  return req.ip || req.connection.remoteAddress || 'unknown';
}

// Rate limiters for different endpoints
const rateLimiters = {
  // User authentication endpoints
  userLogin: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute per IP
    message: 'Too many login attempts. Please try again in a minute.',
    keyGenerator: (req) => req.ip,
  }),

  userRegister: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: 'Too many registration attempts. Please try again in an hour.',
    keyGenerator: (req) => req.ip,
  }),

  // Order creation - user-based limiting
  createOrder: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // 2 orders per minute per user
    message: 'Too many order creation attempts. Please wait a minute.',
    keyGenerator: getUserBasedKey,
  }),

  // Payment intents - user-based limiting
  createPaymentIntent: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 payment intents per minute per user
    message: 'Too many payment attempts. Please wait a minute.',
    keyGenerator: getUserBasedKey,
  }),

  // General API rate limiting
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes per IP
    message: 'Too many requests from this IP. Please try again later.',
    keyGenerator: (req) => req.ip,
  }),

  // Webhook endpoints - more lenient but still protected
  webhook: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 webhook calls per minute per IP
    message: 'Webhook rate limit exceeded.',
    keyGenerator: (req) => req.ip,
  }),

  // Password reset request - limit requests per email per hour
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 reset requests per hour per IP
    message: 'Too many password reset requests. Please try again in an hour.',
    keyGenerator: (req) => {
      // Use email if provided, otherwise IP
      const email = req.body?.email;
      return email ? `email:${email}` : req.ip;
    },
  }),

  // Password reset attempt - limit attempts per token
  passwordResetAttempt: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 reset attempts per hour per IP
    message: 'Too many password reset attempts. Please try again later.',
    keyGenerator: (req) => {
      // Use email+token combination if provided, otherwise IP
      const email = req.body?.email;
      const token = req.body?.token;
      if (email && token) {
        return `reset:${email}:${token}`;
      }
      return req.ip;
    },
  }),
};

/**
 * Get rate limiter by name
 * @param {string} name - Rate limiter name
 * @returns {Function} Rate limiter middleware
 */
function getRateLimiter(name) {
  const limiter = rateLimiters[name];
  if (!limiter) {
    throw new Error(`Rate limiter '${name}' not found`);
  }
  return limiter;
}

/**
 * Create custom rate limiter with specific options
 * @param {Object} options - Rate limiting options
 * @returns {Function} Rate limiter middleware
 */
function createCustomRateLimiter(options) {
  return createRateLimiter(options);
}

export {
  rateLimiters,
  getRateLimiter,
  createRateLimiter,
  createCustomRateLimiter,
  getUserBasedKey,
};

// Also export as CommonJS for backward compatibility
export default {
  rateLimiters,
  getRateLimiter,
  createRateLimiter,
  createCustomRateLimiter,
  getUserBasedKey,
};

// CommonJS export for files using require()
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    rateLimiters,
    getRateLimiter,
    createRateLimiter,
    createCustomRateLimiter,
    getUserBasedKey,
  };
}