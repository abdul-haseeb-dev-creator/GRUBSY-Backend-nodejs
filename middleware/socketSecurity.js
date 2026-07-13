// middleware/socketSecurity.js
// Socket.IO rate limiting and payload validation

const Joi = require('joi');
const { socketSchemas } = require('./schemas');

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  constructor(capacity, refillRate, refillInterval = 1000) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
  }

  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.refillInterval) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  getTokens() {
    this.refill();
    return this.tokens;
  }
}

/**
 * Socket rate limiter manager
 */
class SocketRateLimiter {
  constructor() {
    this.buckets = new Map();
    this.config = {
      join_order: { capacity: 5, refillRate: 5, interval: 60000 }, // 5 per minute
      location_update: { capacity: 10, refillRate: 10, interval: 1000 }, // 10 per second
      default: { capacity: 20, refillRate: 20, interval: 60000 }, // 20 per minute
    };
  }

  getBucket(socketId, eventType) {
    const key = `${socketId}:${eventType}`;
    
    if (!this.buckets.has(key)) {
      const config = this.config[eventType] || this.config.default;
      this.buckets.set(key, new TokenBucket(
        config.capacity,
        config.refillRate,
        config.interval
      ));
    }
    
    return this.buckets.get(key);
  }

  checkLimit(socketId, eventType, tokens = 1) {
    const bucket = this.getBucket(socketId, eventType);
    return bucket.consume(tokens);
  }

  cleanup() {
    // Remove old buckets to prevent memory leaks
    const cutoff = Date.now() - 300000; // 5 minutes
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.lastRefill < cutoff) {
        this.buckets.delete(key);
      }
    }
  }

  getStats() {
    return {
      totalBuckets: this.buckets.size,
      config: this.config,
    };
  }
}

// Global rate limiter instance
const rateLimiter = new SocketRateLimiter();

// Cleanup old buckets every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 300000);

/**
 * Create rate limiting middleware for socket events
 * @param {string} eventType - Type of event to rate limit
 * @param {Object} options - Rate limiting options
 * @returns {Function} Socket middleware function
 */
function createSocketRateLimit(eventType, options = {}) {
  const {
    onLimitExceeded = (socket) => {
      socket.emit('error', { 
        error: 'rate_limited',
        message: 'Rate limit exceeded for this action',
        eventType 
      });
    },
    silentDrop = false, // For location updates, silently drop excess
  } = options;

  return (socket, next) => {
    const allowed = rateLimiter.checkLimit(socket.id, eventType);
    
    if (!allowed) {
      if (silentDrop) {
        // Silently drop the event (don't call next)
        return;
      } else {
        onLimitExceeded(socket);
        return; // Don't call next() to prevent event processing
      }
    }
    
    next();
  };
}

/**
 * Create payload validation middleware for socket events
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Socket middleware function
 */
function createSocketValidation(schema, options = {}) {
  const {
    onValidationError = (socket, error) => {
      socket.emit('error', {
        error: 'validation_failed',
        message: 'Invalid payload format',
        details: error.details?.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })) || [],
      });
    },
  } = options;

  return (socket, data, next) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      onValidationError(socket, error);
      return; // Don't call next() to prevent event processing
    }

    // Replace data with validated and sanitized version
    next(value);
  };
}

/**
 * Enhanced socket middleware that combines rate limiting and validation
 * @param {string} eventType - Type of event
 * @param {Joi.Schema} schema - Validation schema
 * @param {Object} options - Combined options
 * @returns {Function} Socket middleware function
 */
function createSocketMiddleware(eventType, schema, options = {}) {
  const rateLimitMiddleware = createSocketRateLimit(eventType, options.rateLimit);
  const validationMiddleware = createSocketValidation(schema, options.validation);

  return (socket, data, next) => {
    // First check rate limit
    rateLimitMiddleware(socket, (rateLimitNext) => {
      if (rateLimitNext) {
        // Then validate payload
        validationMiddleware(socket, data, (validatedData) => {
          if (validatedData !== undefined) {
            next(validatedData);
          }
        });
      }
    });
  };
}

/**
 * Predefined middleware for common socket events
 */
const socketMiddleware = {
  joinOrder: createSocketMiddleware('join_order', socketSchemas.joinOrder, {
    rateLimit: {
      onLimitExceeded: (socket) => {
        socket.emit('order_joined', {
          success: false,
          error: 'rate_limited',
          message: 'Too many join attempts. Please wait a moment.',
        });
      },
    },
  }),

  leaveOrder: createSocketMiddleware('leave_order', socketSchemas.leaveOrder),

  locationUpdate: createSocketMiddleware('location_update', socketSchemas.locationUpdate, {
    rateLimit: {
      silentDrop: true, // Silently drop excess location updates
    },
    validation: {
      onValidationError: (socket, error) => {
        // Log validation errors for location updates but don't emit to client
        console.warn(`Location update validation failed for socket ${socket.id}:`, error.message);
      },
    },
  }),
};

/**
 * Apply security middleware to socket server
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function applySocketSecurity(io) {
  // Add connection-level middleware
  io.use((socket, next) => {
    // Add rate limiter reference to socket
    socket.rateLimiter = rateLimiter;
    
    // Add security headers
    socket.handshake.headers['x-frame-options'] = 'DENY';
    socket.handshake.headers['x-content-type-options'] = 'nosniff';
    
    next();
  });

  // Add event-specific middleware
  io.on('connection', (socket) => {
    // Apply middleware to specific events
    socket.use((packet, next) => {
      const [eventName, data] = packet;
      
      // Apply appropriate middleware based on event name
      switch (eventName) {
        case 'join_order':
          return socketMiddleware.joinOrder(socket, data, (validatedData) => {
            packet[1] = validatedData;
            next();
          });
          
        case 'leave_order':
          return socketMiddleware.leaveOrder(socket, data, (validatedData) => {
            packet[1] = validatedData;
            next();
          });
          
        case 'location_update':
          return socketMiddleware.locationUpdate(socket, data, (validatedData) => {
            packet[1] = validatedData;
            next();
          });
          
        default:
          // Apply default rate limiting to unknown events
          const allowed = rateLimiter.checkLimit(socket.id, 'default');
          if (!allowed) {
            socket.emit('error', {
              error: 'rate_limited',
              message: 'Rate limit exceeded',
            });
            return;
          }
          next();
      }
    });
  });
}

/**
 * Get rate limiter statistics
 * @returns {Object} Rate limiter statistics
 */
function getSocketSecurityStats() {
  return rateLimiter.getStats();
}

module.exports = {
  TokenBucket,
  SocketRateLimiter,
  createSocketRateLimit,
  createSocketValidation,
  createSocketMiddleware,
  socketMiddleware,
  applySocketSecurity,
  getSocketSecurityStats,
  rateLimiter,
};