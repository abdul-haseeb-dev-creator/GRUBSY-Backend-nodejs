// middleware/webhookSecurity.js
// Webhook security middleware with signature verification and idempotency

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Raw webhook payload
 * @param {string} signature - Stripe signature header
 * @param {string} secret - Webhook secret
 * @returns {boolean} True if signature is valid
 */
function verifyStripeSignature(payload, signature, secret) {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Parse signature header
    const elements = signature.split(',');
    const signatureElements = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureElements[key] = value;
    }

    if (!signatureElements.t || !signatureElements.v1) {
      return false;
    }

    const timestamp = signatureElements.t;
    const expectedSignature = signatureElements.v1;

    // Check timestamp (prevent replay attacks)
    const timestampMs = parseInt(timestamp) * 1000;
    const now = Date.now();
    const tolerance = 300000; // 5 minutes

    if (Math.abs(now - timestampMs) > tolerance) {
      console.warn('Webhook timestamp outside tolerance window');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Compare signatures using constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );

  } catch (error) {
    console.error('Stripe signature verification error:', error);
    return false;
  }
}

/**
 * Create Stripe webhook verification middleware
 * @param {Object} options - Webhook options
 * @returns {Function} Express middleware function
 */
function createStripeWebhookMiddleware(options = {}) {
  const {
    secretEnvVar = 'STRIPE_WEBHOOK_SECRET',
    signatureHeader = 'stripe-signature',
    onVerificationFailed = (req, res) => {
      res.status(400).json({
        error: 'Webhook signature verification failed',
      });
    },
  } = options;

  return (req, res, next) => {
    const secret = process.env[secretEnvVar];
    
    if (!secret) {
      console.error(`Webhook secret not found in environment variable: ${secretEnvVar}`);
      return onVerificationFailed(req, res);
    }

    const signature = req.headers[signatureHeader.toLowerCase()];
    const payload = req.body;

    // Ensure we have raw body for signature verification
    if (!Buffer.isBuffer(payload) && typeof payload !== 'string') {
      console.error('Webhook payload must be raw (Buffer or string) for signature verification');
      return res.status(400).json({
        error: 'Invalid payload format for webhook verification',
      });
    }

    const isValid = verifyStripeSignature(payload.toString(), signature, secret);
    
    if (!isValid) {
      console.warn('Stripe webhook signature verification failed', {
        hasSignature: !!signature,
        hasSecret: !!secret,
        payloadLength: payload.length,
      });
      return onVerificationFailed(req, res);
    }

    // Parse JSON payload after verification
    try {
      req.body = JSON.parse(payload.toString());
      next();
    } catch (error) {
      console.error('Failed to parse webhook JSON:', error);
      return res.status(400).json({
        error: 'Invalid JSON payload',
      });
    }
  };
}

/**
 * Create webhook idempotency middleware
 * Prevents duplicate processing of webhook events
 * @param {Object} options - Idempotency options
 * @returns {Function} Express middleware function
 */
function createWebhookIdempotencyMiddleware(options = {}) {
  const {
    eventIdField = 'id',
    ttlHours = 72, // How long to remember processed events
    onDuplicateEvent = (req, res, eventId) => {
      console.log(`Duplicate webhook event ignored: ${eventId}`);
      res.status(200).json({ received: true, duplicate: true });
    },
  } = options;

  return async (req, res, next) => {
    try {
      const eventId = req.body?.[eventIdField];
      
      if (!eventId) {
        console.warn('Webhook event missing ID field');
        return next(); // Continue without idempotency protection
      }

      // Check if we've already processed this event
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { eventId },
      });

      if (existingEvent) {
        return onDuplicateEvent(req, res, eventId);
      }

      // Store the event ID to prevent future duplicates
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      await prisma.webhookEvent.create({
        data: {
          eventId,
          eventType: req.body.type || 'unknown',
          processed: false,
          expiresAt,
          createdAt: new Date(),
        },
      });

      // Mark as processed after successful handling
      req.markWebhookProcessed = async () => {
        try {
          await prisma.webhookEvent.update({
            where: { eventId },
            data: { 
              processed: true,
              processedAt: new Date(),
            },
          });
        } catch (error) {
          console.error('Failed to mark webhook as processed:', error);
        }
      };

      next();

    } catch (error) {
      console.error('Webhook idempotency middleware error:', error);
      // Continue without idempotency protection on error
      next();
    }
  };
}

/**
 * Combined Stripe webhook middleware with signature verification and idempotency
 * @param {Object} options - Combined options
 * @returns {Function} Express middleware function
 */
function createStripeWebhookSecurity(options = {}) {
  const signatureMiddleware = createStripeWebhookMiddleware(options.signature);
  const idempotencyMiddleware = createWebhookIdempotencyMiddleware(options.idempotency);

  return (req, res, next) => {
    signatureMiddleware(req, res, (signatureNext) => {
      if (signatureNext) {
        idempotencyMiddleware(req, res, next);
      }
    });
  };
}

/**
 * Cleanup expired webhook events
 * Should be called periodically (e.g., via cron job)
 */
async function cleanupExpiredWebhookEvents() {
  try {
    const result = await prisma.webhookEvent.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    console.log(`Cleaned up ${result.count} expired webhook events`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired webhook events:', error);
    throw error;
  }
}

/**
 * Get webhook processing statistics
 */
async function getWebhookStats() {
  try {
    const total = await prisma.webhookEvent.count();
    const processed = await prisma.webhookEvent.count({
      where: { processed: true },
    });
    const expired = await prisma.webhookEvent.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      total,
      processed,
      pending: total - processed,
      expired,
    };
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    return { total: 0, processed: 0, pending: 0, expired: 0 };
  }
}

module.exports = {
  verifyStripeSignature,
  createStripeWebhookMiddleware,
  createWebhookIdempotencyMiddleware,
  createStripeWebhookSecurity,
  cleanupExpiredWebhookEvents,
  getWebhookStats,
};