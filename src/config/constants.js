// src/config/constants.js
// Centralized application constants to replace magic numbers

/**
 * Time-related constants (in milliseconds)
 */
const TIME_CONSTANTS = {
  // Cache TTL
  JWT_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  IDEMPOTENCY_TTL: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_TTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Timeouts
  REQUEST_TIMEOUT: 30 * 1000, // 30 seconds
  DATABASE_TIMEOUT: 10 * 1000, // 10 seconds
  PAYMENT_TIMEOUT: 60 * 1000, // 60 seconds
  
  // Intervals
  CACHE_CLEANUP_INTERVAL: 60 * 1000, // 1 minute
  HEALTH_CHECK_INTERVAL: 30 * 1000, // 30 seconds
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Delays
  RETRY_DELAY: 1000, // 1 second
  EXPONENTIAL_BACKOFF_BASE: 2,
  MAX_RETRY_DELAY: 30 * 1000, // 30 seconds
};

/**
 * Rate limiting constants
 */
const RATE_LIMIT_CONSTANTS = {
  // HTTP rate limits (requests per window)
  DEFAULT_RATE_LIMIT: 100,
  AUTH_RATE_LIMIT: 10,
  PAYMENT_RATE_LIMIT: 5,
  UPLOAD_RATE_LIMIT: 20,
  
  // Socket.IO rate limits
  SOCKET_AUTH_LIMIT: 10,
  SOCKET_LOCATION_LIMIT: 5,
  SOCKET_JOIN_LIMIT: 20,
  SOCKET_DEFAULT_LIMIT: 100,
  
  // Rate limit windows (in milliseconds)
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  STRICT_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
};

/**
 * Pagination and limits
 */
const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  DEFAULT_PAGE: 1,
  
  // Search limits
  MAX_SEARCH_RESULTS: 1000,
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_QUERY_LENGTH: 100,
};

/**
 * Validation constants
 */
const VALIDATION_CONSTANTS = {
  // String lengths
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_SPECIAL_INSTRUCTIONS_LENGTH: 200,
  MAX_REASON_LENGTH: 500,
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Phone number
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 20,
  
  // Order limits
  MIN_ORDER_QUANTITY: 1,
  MAX_ORDER_QUANTITY: 20,
  MAX_ORDER_ITEMS: 50,
  
  // Price limits
  MIN_PRICE: 0,
  MAX_PRICE: 10000,
  PRICE_PRECISION: 2,
  
  // Location limits
  MIN_LATITUDE: -90,
  MAX_LATITUDE: 90,
  MIN_LONGITUDE: -180,
  MAX_LONGITUDE: 180,
  MAX_DELIVERY_RADIUS: 50, // km
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
};

/**
 * Business logic constants
 */
const BUSINESS_CONSTANTS = {
  // Commission rates (as decimals)
  DEFAULT_COMMISSION_RATE: 0.15, // 15%
  PREMIUM_COMMISSION_RATE: 0.12, // 12%
  ENTERPRISE_COMMISSION_RATE: 0.10, // 10%
  
  // Delivery constants
  DEFAULT_DELIVERY_FEE: 2.99,
  FREE_DELIVERY_THRESHOLD: 25.00,
  DEFAULT_PREPARATION_TIME: 15, // minutes
  MAX_PREPARATION_TIME: 120, // minutes
  
  // Currency
  DEFAULT_CURRENCY: 'GBP',
  SUPPORTED_CURRENCIES: ['GBP', 'USD', 'EUR'],
  
  // Retry attempts
  MAX_RETRY_ATTEMPTS: 3,
  MAX_PAYMENT_RETRY_ATTEMPTS: 2,
  MAX_WEBHOOK_RETRY_ATTEMPTS: 5,
  
  // Queue sizes
  MAX_QUEUE_SIZE: 1000,
  MAX_PRIORITY_QUEUE_SIZE: 100,
};

/**
 * Socket.IO constants
 */
const SOCKET_CONSTANTS = {
  // Connection limits
  MAX_CONNECTIONS_PER_IP: 10,
  MAX_TOTAL_CONNECTIONS: 10000,
  
  // Payload limits
  MAX_PAYLOAD_SIZE: 1024, // bytes
  MAX_AUTH_PAYLOAD_SIZE: 1024,
  MAX_LOCATION_PAYLOAD_SIZE: 512,
  MAX_ORDER_PAYLOAD_SIZE: 256,
  
  // Timeouts
  CONNECTION_TIMEOUT: 20 * 1000, // 20 seconds
  PING_TIMEOUT: 5 * 1000, // 5 seconds
  PING_INTERVAL: 25 * 1000, // 25 seconds
};

/**
 * Database constants
 */
const DATABASE_CONSTANTS = {
  // Connection pool
  MIN_POOL_SIZE: 2,
  MAX_POOL_SIZE: 20,
  POOL_IDLE_TIMEOUT: 30 * 1000, // 30 seconds
  
  // Query limits
  MAX_QUERY_RESULTS: 10000,
  DEFAULT_QUERY_TIMEOUT: 30 * 1000, // 30 seconds
  SLOW_QUERY_THRESHOLD: 1000, // 1 second
  
  // Batch sizes
  DEFAULT_BATCH_SIZE: 100,
  MAX_BATCH_SIZE: 1000,
};

/**
 * Security constants
 */
const SECURITY_CONSTANTS = {
  // JWT
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '30d',
  
  // Bcrypt rounds
  BCRYPT_ROUNDS: 12,
  
  // CORS
  MAX_AGE: 86400, // 24 hours
  
  // Headers
  MAX_HEADER_SIZE: 8192, // 8KB
  
  // IP whitelist/blacklist
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
};

/**
 * Logging constants
 */
const LOGGING_CONSTANTS = {
  // Log levels
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    HTTP: 3,
    VERBOSE: 4,
    DEBUG: 5,
    SILLY: 6,
  },
  
  // Log rotation
  MAX_LOG_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_LOG_FILES: 14, // 2 weeks
  
  // Performance thresholds
  SLOW_REQUEST_THRESHOLD: 1000, // 1 second
  VERY_SLOW_REQUEST_THRESHOLD: 5000, // 5 seconds
};

/**
 * Environment-specific constants
 */
const ENVIRONMENT_CONSTANTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
  
  // Default ports
  DEFAULT_PORT: 3001,
  DEFAULT_REDIS_PORT: 6379,
  DEFAULT_DB_PORT: 5432,
};

/**
 * API versioning constants
 */
const API_CONSTANTS = {
  CURRENT_VERSION: 'v1',
  SUPPORTED_VERSIONS: ['v1'],
  VERSION_HEADER: 'X-API-Version',
  
  // Content types
  JSON_CONTENT_TYPE: 'application/json',
  FORM_CONTENT_TYPE: 'application/x-www-form-urlencoded',
  MULTIPART_CONTENT_TYPE: 'multipart/form-data',
};

// Freeze all constants to prevent mutations
Object.freeze(TIME_CONSTANTS);
Object.freeze(RATE_LIMIT_CONSTANTS);
Object.freeze(PAGINATION_CONSTANTS);
Object.freeze(VALIDATION_CONSTANTS);
Object.freeze(BUSINESS_CONSTANTS);
Object.freeze(SOCKET_CONSTANTS);
Object.freeze(DATABASE_CONSTANTS);
Object.freeze(SECURITY_CONSTANTS);
Object.freeze(LOGGING_CONSTANTS);
Object.freeze(ENVIRONMENT_CONSTANTS);
Object.freeze(API_CONSTANTS);

module.exports = {
  TIME_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  PAGINATION_CONSTANTS,
  VALIDATION_CONSTANTS,
  BUSINESS_CONSTANTS,
  SOCKET_CONSTANTS,
  DATABASE_CONSTANTS,
  SECURITY_CONSTANTS,
  LOGGING_CONSTANTS,
  ENVIRONMENT_CONSTANTS,
  API_CONSTANTS,
};