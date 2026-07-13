// middleware/idempotency.js
// Idempotency-Key support for preventing duplicate operations

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Create idempotency middleware for specific operations
 * @param {Object} options - Idempotency options
 * @returns {Function} Express middleware function
 */
function createIdempotencyMiddleware(options = {}) {
  const {
    keyHeader = 'idempotency-key',
    ttlHours = 24, // How long to store idempotency records
    generateKey = false, // Whether to generate key if not provided
  } = options;

  return async (req, res, next) => {
    try {
      let idempotencyKey = req.headers[keyHeader.toLowerCase()];

      // Generate key if not provided and generateKey is true
      if (!idempotencyKey && generateKey) {
        idempotencyKey = crypto.randomUUID();
        req.headers[keyHeader.toLowerCase()] = idempotencyKey;
      }

      // If no idempotency key, continue without idempotency protection
      if (!idempotencyKey) {
        return next();
      }

      // Validate idempotency key format (UUID or similar)
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(idempotencyKey)) {
        return res.status(400).json({
          error: 'Invalid idempotency key format',
          message: 'Idempotency-Key must be a valid UUID',
        });
      }

      // Create composite key with user context for security
      const userId = req.user?.userId || req.driver?.driverId || 'anonymous';
      const compositeKey = `${userId}:${req.method}:${req.path}:${idempotencyKey}`;
      const keyHash = crypto.createHash('sha256').update(compositeKey).digest('hex');

      // Check if this operation has been performed before
      const existingRecord = await prisma.idempotencyRecord.findUnique({
        where: { keyHash },
      });

      if (existingRecord) {
        // Return the stored response
        const storedResponse = JSON.parse(existingRecord.responseData);
        return res.status(existingRecord.statusCode).json(storedResponse);
      }

      // Store the idempotency key for this request
      req.idempotencyKey = idempotencyKey;
      req.idempotencyKeyHash = keyHash;

      // Intercept the response to store it
      const originalSend = res.send;
      const originalJson = res.json;
      let responseStored = false;

      const storeResponse = async (data, statusCode) => {
        if (responseStored) return;
        responseStored = true;

        try {
          // Only store successful responses (2xx status codes)
          if (statusCode >= 200 && statusCode < 300) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + ttlHours);

            await prisma.idempotencyRecord.create({
              data: {
                keyHash,
                originalKey: idempotencyKey,
                userId,
                method: req.method,
                path: req.path,
                statusCode,
                responseData: JSON.stringify(data),
                expiresAt,
                createdAt: new Date(),
              },
            });
          }
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to store idempotency record:', error);
        }
      };

      // Override res.json
      res.json = function(data) {
        storeResponse(data, this.statusCode);
        return originalJson.call(this, data);
      };

      // Override res.send
      res.send = function(data) {
        if (typeof data === 'object') {
          storeResponse(data, this.statusCode);
        }
        return originalSend.call(this, data);
      };

      next();

    } catch (error) {
      console.error('Idempotency middleware error:', error);
      // Continue without idempotency protection on error
      next();
    }
  };
}

/**
 * Cleanup expired idempotency records
 * Should be called periodically (e.g., via cron job)
 */
async function cleanupExpiredRecords() {
  try {
    const result = await prisma.idempotencyRecord.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    console.log(`Cleaned up ${result.count} expired idempotency records`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired idempotency records:', error);
    throw error;
  }
}

/**
 * Get idempotency statistics
 */
async function getIdempotencyStats() {
  try {
    const total = await prisma.idempotencyRecord.count();
    const expired = await prisma.idempotencyRecord.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      total,
      active: total - expired,
      expired,
    };
  } catch (error) {
    console.error('Failed to get idempotency stats:', error);
    return { total: 0, active: 0, expired: 0 };
  }
}

// Predefined middleware for common operations
const idempotencyMiddleware = {
  orders: createIdempotencyMiddleware({
    keyHeader: 'idempotency-key',
    ttlHours: 24,
    generateKey: false,
  }),

  payments: createIdempotencyMiddleware({
    keyHeader: 'idempotency-key',
    ttlHours: 48, // Longer TTL for payment operations
    generateKey: false,
  }),

  webhooks: createIdempotencyMiddleware({
    keyHeader: 'stripe-idempotency-key',
    ttlHours: 72, // Even longer for webhooks
    generateKey: false,
  }),
};

module.exports = {
  createIdempotencyMiddleware,
  cleanupExpiredRecords,
  getIdempotencyStats,
  idempotencyMiddleware,
};