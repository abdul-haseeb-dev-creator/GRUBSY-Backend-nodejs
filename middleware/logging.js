// middleware/logging.js
// Logging middleware with PII and sensitive data redaction

const winston = require('winston');

// Sensitive fields that should be redacted from logs
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'stripe-signature',
  'idempotency-key',
  'phone',
  'email',
  'address',
  'postcode',
  'dob',
  'nameOnCard',
  'registeredAddress',
  'registeredPostcode',
];

// Patterns to match sensitive data
const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, // Bearer tokens
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b(?:\+44|0)[1-9]\d{8,9}\b/g, // UK phone numbers
  /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi, // UK postcodes
  /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card numbers
];

/**
 * Redact sensitive information from an object
 * @param {any} obj - Object to redact
 * @param {number} depth - Current recursion depth
 * @returns {any} Redacted object
 */
function redactSensitiveData(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field name is sensitive
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value, depth + 1);
      }
    }
    
    return redacted;
  }

  return obj;
}

/**
 * Redact sensitive patterns from strings
 * @param {string} str - String to redact
 * @returns {string} Redacted string
 */
function redactString(str) {
  if (typeof str !== 'string') {
    return str;
  }

  let redacted = str;
  
  // Apply pattern-based redaction
  SENSITIVE_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });

  return redacted;
}

/**
 * Redact headers object
 * @param {Object} headers - Headers object
 * @returns {Object} Redacted headers
 */
function redactHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const redacted = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactString(value);
    }
  }
  
  return redacted;
}

/**
 * Create request logging middleware
 * @param {Object} options - Logging options
 * @returns {Function} Express middleware function
 */
function createRequestLogger(options = {}) {
  const {
    logLevel = 'info',
    includeBody = false,
    includeHeaders = false,
    excludePaths = ['/health', '/favicon.ico'],
    maxBodySize = 1000, // Max characters to log from body
  } = options;

  return (req, res, next) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    
    // Capture original end function
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      
      // Prepare log data
      const logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: redactString(req.get('User-Agent')),
        ip: req.ip || req.connection.remoteAddress,
      };

      // Add headers if requested
      if (includeHeaders) {
        logData.headers = redactHeaders(req.headers);
      }

      // Add body if requested and present
      if (includeBody && req.body) {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length <= maxBodySize) {
          logData.body = redactSensitiveData(req.body);
        } else {
          logData.body = '[BODY_TOO_LARGE]';
        }
      }

      // Add user context if available
      if (req.user?.userId) {
        logData.userId = req.user.userId;
      }
      if (req.driver?.driverId) {
        logData.driverId = req.driver.driverId;
      }

      // Log the request
      winston.log(logLevel, 'HTTP Request', logData);
      
      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Create error logging middleware
 * @param {Object} options - Logging options
 * @returns {Function} Express error middleware function
 */
function createErrorLogger(options = {}) {
  const {
    logLevel = 'error',
    includeStack = process.env.NODE_ENV !== 'production',
  } = options;

  return (err, req, res, next) => {
    const logData = {
      error: err.message,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode || 500,
      userAgent: redactString(req.get('User-Agent')),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Add stack trace in development
    if (includeStack && err.stack) {
      logData.stack = err.stack;
    }

    // Add user context if available
    if (req.user?.userId) {
      logData.userId = req.user.userId;
    }
    if (req.driver?.driverId) {
      logData.driverId = req.driver.driverId;
    }

    winston.log(logLevel, 'HTTP Error', logData);
    
    next(err);
  };
}

/**
 * Safe JSON stringify with redaction
 * @param {any} obj - Object to stringify
 * @param {number} space - Indentation spaces
 * @returns {string} Redacted JSON string
 */
function safeStringify(obj, space = 0) {
  try {
    const redacted = redactSensitiveData(obj);
    return JSON.stringify(redacted, null, space);
  } catch (error) {
    return '[STRINGIFY_ERROR]';
  }
}

module.exports = {
  redactSensitiveData,
  redactString,
  redactHeaders,
  createRequestLogger,
  createErrorLogger,
  safeStringify,
  SENSITIVE_FIELDS,
  SENSITIVE_PATTERNS,
};