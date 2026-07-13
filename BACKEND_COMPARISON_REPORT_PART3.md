# Grubsy Backend Comparison Report - Part 3

## Advanced Middleware and Security Analysis

### 3.1 Security Enhancements in Grubsy-Backend-2

#### Advanced Authentication Middleware

**Driver Authentication (`src/middleware/driverAuth.js`)**:
```javascript
// Grubsy-Backend-2/src/middleware/driverAuth.js
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

export const authenticateDriver = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const driver = await prisma.drivers.findUnique({
      where: { id: decoded.driverId }
    });

    if (!driver) {
      return res.status(401).json({
        success: false,
        error: 'Driver not found'
      });
    }

    req.driver = driver;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};
```

**Rate Limiting (`middleware/rateLimiting.js`)**:
```javascript
// Grubsy-Backend-2/middleware/rateLimiting.js
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const strictRateLimit = createRateLimit(15 * 60 * 1000, 10); // 10 requests per 15 minutes
export const generalRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = createRateLimit(60 * 60 * 1000, 5); // 5 auth attempts per hour
```

#### Webhook Security (`middleware/webhookSecurity.js`)
```javascript
// Grubsy-Backend-2/middleware/webhookSecurity.js
import crypto from 'crypto';

export const validateWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const body = JSON.stringify(req.body);

  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      error: 'Missing webhook signature or timestamp'
    });
  }

  // Check timestamp to prevent replay attacks
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  const timeDiff = Math.abs(now - requestTime);

  if (timeDiff > 300000) { // 5 minutes
    return res.status(401).json({
      success: false,
      error: 'Webhook timestamp too old'
    });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    return res.status(401).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }

  next();
};
```

#### Socket Security (`middleware/socketSecurity.js`)
```javascript
// Grubsy-Backend-2/middleware/socketSecurity.js
import jwt from 'jsonwebtoken';

export const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userType = decoded.userType;
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};

export const authorizeSocketRoom = (socket, roomName, next) => {
  // Check if user has permission to join this room
  const allowedRooms = {
    'driver': ['driver-updates', 'order-notifications'],
    'merchant': ['merchant-orders', 'restaurant-updates'],
    'customer': ['order-tracking', 'customer-support']
  };

  const userType = socket.userType;
  const allowedUserRooms = allowedRooms[userType] || [];

  if (!allowedUserRooms.includes(roomName)) {
    return next(new Error('Unauthorized room access'));
  }

  next();
};
```

### 3.2 Advanced Logging System

#### Winston Logger Configuration (`src/utils/logger.js`)
```javascript
// Grubsy-Backend-2/src/utils/logger.js
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }

    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'grubsy-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),

    // Security log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Custom logging methods
logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, category: 'security' });
};

logger.audit = (action, userId, details = {}) => {
  logger.info(`AUDIT: ${action}`, {
    userId,
    action,
    ...details,
    category: 'audit'
  });
};

export default logger;
```

### 3.3 Idempotency Middleware

#### Idempotency Implementation (`middleware/idempotency.js`)
```javascript
// Grubsy-Backend-2/middleware/idempotency.js
import crypto from 'crypto';
import { prisma } from '../config/database.js';

const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const IDEMPOTENCY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

export const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()];

  if (!idempotencyKey) {
    return next();
  }

  // Validate idempotency key format
  if (!/^[a-zA-Z0-9-_]{10,128}$/.test(idempotencyKey)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid idempotency key format'
    });
  }

  try {
    // Create hash of the request for comparison
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        method: req.method,
        url: req.url,
        body: req.body,
        userId: req.user?.id
      }))
      .digest('hex');

    // Check for existing idempotency record
    const existingRecord = await prisma.idempotency_Keys.findUnique({
      where: { key: idempotencyKey }
    });

    if (existingRecord) {
      // Check if request hash matches
      if (existingRecord.request_Hash !== requestHash) {
        return res.status(409).json({
          success: false,
          error: 'Idempotency key used with different request'
        });
      }

      // Check if within time window
      const keyAge = Date.now() - new Date(existingRecord.created_At).getTime();
      if (keyAge > IDEMPOTENCY_WINDOW) {
        // Clean up old key and allow new request
        await prisma.idempotency_Keys.delete({
          where: { key: idempotencyKey }
        });
      } else {
        // Return cached response
        const response = JSON.parse(existingRecord.response);
        return res.status(existingRecord.status_Code).json(response);
      }
    }

    // Store request details for potential caching
    req.idempotencyKey = idempotencyKey;
    req.requestHash = requestHash;

    // Override res.json to cache successful responses
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.idempotencyKey) {
        // Cache successful response
        prisma.idempotency_Keys.create({
          data: {
            key: req.idempotencyKey,
            request_Hash: req.requestHash,
            response: JSON.stringify(data),
            status_Code: res.statusCode,
            created_At: new Date()
          }
        }).catch(error => {
          console.error('Failed to cache idempotency response:', error);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    next();
  }
};
```

### 3.4 Advanced Validation System

#### Enhanced Validation (`middleware/validate.js`)
```javascript
// Grubsy-Backend-2/middleware/validate.js
import Joi from 'joi';

// Response helpers
export const ok = (res, data) => res.json({ success: true, data });
export const badRequest = (res, message, field = null) =>
  res.status(400).json({ success: false, error: message, field });
export const notFound = (res, message = 'Resource not found') =>
  res.status(404).json({ success: false, error: message });
export const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, error: message });
export const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, error: message });
export const serverError = (res, message = 'Internal server error') =>
  res.status(500).json({ success: false, error: message });

// Validation schemas
export const schemas = {
  createOrder: Joi.object({
    userEmail: Joi.string().email().required(),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        specialInstructions: Joi.string().max(500).optional()
      })
    ).min(1).required(),
    subtotal: Joi.number().positive().required(),
    deliveryFee: Joi.number().min(0).required(),
    serviceFee: Joi.number().min(0).required(),
    grandTotal: Joi.number().positive().required(),
    deliveryAddress: Joi.string().min(10).required(),
    deliveryPostcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i).required(),
    paymentMethod: Joi.string().valid('CARD', 'CASH', 'DIGITAL_WALLET').required()
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid(
      'PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    ).required(),
    notes: Joi.string().max(500).optional()
  }),

  createMerchant: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    cuisine: Joi.string().min(2).max(50).required(),
    address: Joi.string().min(10).required(),
    postcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i).required(),
    description: Joi.string().max(500).optional()
  }),

  updateMerchantProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    cuisine: Joi.string().min(2).max(50).optional(),
    address: Joi.string().min(10).optional(),
    postcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i).optional(),
    openingTimes: Joi.string().max(500).optional(),
    bookingAvailable: Joi.boolean().optional()
  })
};

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};
```

### 3.5 Deployment and Infrastructure

#### Environment Configuration Management

**Production Environment (`Grubsy-Backend-2/.env.prod`)**
```bash
# Database
DATABASE_URL="mysql://prod_user:prod_password@prod_host:3306/grubsy_prod"

# JWT
JWT_SECRET="your-production-jwt-secret-here"
JWT_EXPIRES_IN="24h"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Bitrix24
BITRIX24_WEBHOOK_URL="https://your-domain.com/webhooks/bitrix24"
BITRIX24_CLIENT_ID="your-client-id"
BITRIX24_CLIENT_SECRET="your-client-secret"

# Redis
REDIS_URL="redis://prod-redis-host:6379"

# Logging
LOG_LEVEL="info"

# CORS
CORS_ORIGIN="https://your-frontend-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

#### Docker Configuration

**Dockerfile (`Grubsy-Backend-2/Dockerfile`)**
```dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Change ownership to node user
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

**Docker Compose (`Grubsy-Backend-2/docker-compose.yml`)**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.prod
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: grubsy_prod
      MYSQL_USER: grubsy_user
      MYSQL_PASSWORD: grubsy_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

### 3.6 Performance Optimizations

#### Database Connection Pooling
```javascript
// Grubsy-Backend-2/src/config/database.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool configuration
prisma.$connect().catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
```

#### Caching Strategy
```javascript
// Grubsy-Backend-2/src/services/cacheService.js
import Redis from 'ioredis';

class CacheService {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.defaultTTL = 3600; // 1 hour
  }

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Cache restaurant data
  async getRestaurant(id) {
    return this.get(`restaurant:${id}`);
  }

  async setRestaurant(id, data) {
    await this.set(`restaurant:${id}`, data, 1800); // 30 minutes
  }

  // Cache menu data
  async getMenu(restaurantId) {
    return this.get(`menu:${restaurantId}`);
  }

  async setMenu(restaurantId, data) {
    await this.set(`menu:${restaurantId}`, data, 900); // 15 minutes
  }

  // Cache user preferences
  async getUserPreferences(userId) {
    return this.get(`user:prefs:${userId}`);
  }

  async setUserPreferences(userId, data) {
    await this.set(`user:prefs:${userId}`, data, 7200); // 2 hours
  }
}

export default new CacheService();
```

### 3.7 Monitoring and Health Checks

#### Health Check Endpoint (`scripts/healthcheck.js`)
```javascript
// Grubsy-Backend-2/scripts/healthcheck.js
import { prisma } from '../src/config/database.js';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function healthCheck() {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }

  try {
    // Redis check
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error.message);
  }

  const isHealthy = checks.database && checks.redis;

  if (!isHealthy) {
    console.error('Health check failed:', checks);
    process.exit(1);
  }

  console.log('Health check passed');
  process.exit(0);
}

healthCheck();
```

#### Application Monitoring
```javascript
// Grubsy-Backend-2/src/middleware/monitoring.js
import responseTime from 'response-time';
import logger from '../utils/logger.js';

export const responseTimeMiddleware = responseTime((req, res, time) => {
  const { method, url } = req;
  const { statusCode } = res;
  const userAgent = req.get('User-Agent') || '';

  logger.info('Request completed', {
    method,
    url,
    statusCode,
    responseTime: Math.round(time),
    userAgent: userAgent.substring(0, 100),
    ip: req.ip,
    category: 'performance'
  });
});

export const errorMonitoring = (error, req, res, next) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    category: 'error'
  });

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

### 3.8 Security Headers and CORS

#### Helmet Configuration (`src/middleware/security.js`)
```javascript
// Grubsy-Backend-2/src/middleware/security.js
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Idempotency-Key'
    ]
  })
];
```

---

*Part 3 of the detailed comparison report. This concludes the comprehensive analysis of middleware, security, deployment, and infrastructure enhancements in Grubsy-Backend-2.*