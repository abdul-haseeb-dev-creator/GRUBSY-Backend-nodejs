import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import Redis from 'ioredis';
import apiRouter from './api.js';
import realtimeService from './realtime.js';
import { specs, swaggerUi } from './swagger.js';

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// Redis singleton to prevent duplicate declarations
class RedisManager {
  static instance = null;
  static isInitializing = false;
  static isConnected = false;

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }

    if (this.isInitializing) {
      // Prevent recursive initialization
      return null;
    }

    this.isInitializing = true;

    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        // Redis disabled - no URL configured (silent)
        this.instance = null;
        this.isInitializing = false;
        return null;
      }

      // Parse Redis URL to extract host and port
      // Supports formats: redis://host:port or rediss://host:port (TLS)
      const url = new URL(redisUrl);
      const useTls = url.protocol === 'rediss:' || redisUrl.includes('.cache.amazonaws.com');
      
      this.instance = new Redis({
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        ...(useTls && { tls: {} }),  // Enable TLS for AWS ElastiCache
        lazyConnect: true, // Don't fail on startup
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            console.warn('⚠️ Redis connection failed after 3 attempts, disabling Redis');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000); // Retry with backoff
        },
        maxRetriesPerRequest: 1,
        connectTimeout: 5000, // 5 second timeout
        commandTimeout: 3000, // 3 second command timeout
      });

      // Handle connection events
      this.instance.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected');
      });

      this.instance.on('error', (err) => {
        this.isConnected = false;
        console.warn('⚠️ Redis error (non-fatal):', err.message);
      });

      this.instance.on('close', () => {
        this.isConnected = false;
        console.warn('⚠️ Redis connection closed');
      });

      console.log(`✅ Redis client initialized (${url.hostname}:${url.port || 6379})`);
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, continuing without Redis:', error.message);
      this.instance = null;
    } finally {
      this.isInitializing = false;
    }

    return this.instance;
  }

  static async ping() {
    if (!this.instance || !this.isConnected) {
      return 'DISABLED';
    }
    try {
      const result = await Promise.race([
        this.instance.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      return result;
    } catch {
      return 'DOWN';
    }
  }
}

const redis = RedisManager.getInstance();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://www.uk-gds.com', 'http://localhost:4173']
    : "*", // 👈 allow all origins (for development)
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Serve static files (photos, uploads)
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Grubsy Platform API Documentation'
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check endpoint
 *     tags: [Health]
 *     description: Provides comprehensive health status including database, Redis, WebSocket, and connected users count
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                   description: Overall system health status
 *                 db:
 *                   type: string
 *                   example: 'up'
 *                   description: Database connection status
 *                 redis:
 *                   type: string
 *                   example: 'up'
 *                   description: Redis connection status
 *                 websocket:
 *                   type: string
 *                   example: 'up'
 *                   description: WebSocket server status
 *                 connectedUsers:
 *                   type: integer
 *                   example: 25
 *                   description: Number of currently connected WebSocket users
 *       500:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Error message describing the issue
 */

app.get('/health', async (req, res) => {
  try {
    // Database check with timeout
    const dbCheck = await Promise.race([
      prisma.$queryRaw`SELECT 1`.then(() => 'up'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 5000))
    ]).catch(() => 'down');

    // Redis check (already has timeout in ping())
    const redisCheck = await RedisManager.ping();
    
    const connectedUsers = realtimeService.getConnectedUsersCount();
    
    res.json({
      ok: dbCheck === 'up',
      db: dbCheck,
      redis: redisCheck === 'PONG' ? 'up' : redisCheck,
      websocket: 'up',
      connectedUsers,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.use('/api', apiRouter);

// Initialize WebSocket server
realtimeService.initialize(server);

const port = Number(process.env.PORT || 3002);
server.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
  console.log('WebSocket server ready');
});