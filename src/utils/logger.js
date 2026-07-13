// src/utils/logger.js
// Structured logging utility to replace console.* calls (ESM)

import { createRequire } from "module";
import winston from "winston";

const require = createRequire(import.meta.url);
const {
  LOGGING_CONSTANTS,
  ENVIRONMENT_CONSTANTS,
} = require("../config/constants.js");

// Get current environment
const NODE_ENV = process.env.NODE_ENV || ENVIRONMENT_CONSTANTS.DEVELOPMENT;
const IS_PRODUCTION = NODE_ENV === ENVIRONMENT_CONSTANTS.PRODUCTION;
const IS_TEST = NODE_ENV === ENVIRONMENT_CONSTANTS.TEST;

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.SSS",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    // Add stack trace for errors
    if (stack) {
      logEntry.stack = stack;
    }

    // Add environment context
    logEntry.environment = NODE_ENV;
    logEntry.service = "grubsy-backend";

    return JSON.stringify(logEntry);
  }),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logLine = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logLine += ` ${JSON.stringify(meta)}`;
    }

    // Add stack trace for errors
    if (stack) {
      logLine += `\n${stack}`;
    }

    return logLine;
  }),
);

// Create transports based on environment
const transports = [];

// Console transport (always present in development/test)
if (!IS_PRODUCTION || process.env.ENABLE_CONSOLE_LOGS === "true") {
  transports.push(
    new winston.transports.Console({
      format: IS_PRODUCTION ? logFormat : consoleFormat,
      level: IS_TEST ? "error" : "debug",
    }),
  );
}

// File transports for production
if (IS_PRODUCTION) {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: logFormat,
      maxsize: LOGGING_CONSTANTS.MAX_LOG_SIZE,
      maxFiles: LOGGING_CONSTANTS.MAX_LOG_FILES,
    }),
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log",
      format: logFormat,
      maxsize: LOGGING_CONSTANTS.MAX_LOG_SIZE,
      maxFiles: LOGGING_CONSTANTS.MAX_LOG_FILES,
    }),
  );
}

// Create the winston logger instance
const winstonInstance = winston.createLogger({
  level: IS_PRODUCTION ? "info" : "debug",
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Enhanced logging methods with context
 */
class StructuredLogger {
  constructor(context = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   * @param {Object} additionalContext - Additional context to merge
   * @returns {StructuredLogger} New logger instance with merged context
   */
  child(additionalContext = {}) {
    return new StructuredLogger({
      ...this.context,
      ...additionalContext,
    });
  }

  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (NODE_ENV !== ENVIRONMENT_CONSTANTS.PRODUCTION) {
      winstonInstance.error(message, { ...this.context, ...meta });
    } else {
      // In production, ensure no sensitive data is logged
      const sanitizedMeta = this._sanitizeMetadata({
        ...this.context,
        ...meta,
      });
      winstonInstance.error(message, sanitizedMeta);
    }
  }

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (NODE_ENV !== ENVIRONMENT_CONSTANTS.PRODUCTION) {
      winstonInstance.warn(message, { ...this.context, ...meta });
    } else {
      const sanitizedMeta = this._sanitizeMetadata({
        ...this.context,
        ...meta,
      });
      winstonInstance.warn(message, sanitizedMeta);
    }
  }

  /**
   * Log info messages
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (NODE_ENV !== ENVIRONMENT_CONSTANTS.PRODUCTION) {
      winstonInstance.info(message, { ...this.context, ...meta });
    } else {
      const sanitizedMeta = this._sanitizeMetadata({
        ...this.context,
        ...meta,
      });
      winstonInstance.info(message, sanitizedMeta);
    }
  }

  /**
   * Log HTTP requests (only in non-production or when explicitly enabled)
   * @param {string} message - HTTP message
   * @param {Object} meta - Additional metadata
   */
  http(message, meta = {}) {
    if (
      NODE_ENV !== ENVIRONMENT_CONSTANTS.PRODUCTION ||
      process.env.ENABLE_HTTP_LOGS === "true"
    ) {
      winstonInstance.http(message, { ...this.context, ...meta });
    }
  }

  /**
   * Log debug messages (only in development)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (NODE_ENV === ENVIRONMENT_CONSTANTS.DEVELOPMENT) {
      winstonInstance.debug(message, { ...this.context, ...meta });
    }
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} meta - Additional metadata
   */
  performance(operation, duration, meta = {}) {
    const level =
      duration > LOGGING_CONSTANTS.VERY_SLOW_REQUEST_THRESHOLD
        ? "warn"
        : duration > LOGGING_CONSTANTS.SLOW_REQUEST_THRESHOLD
          ? "info"
          : "debug";

    this[level](`Performance: ${operation}`, {
      ...meta,
      duration,
      performance: true,
      slow: duration > LOGGING_CONSTANTS.SLOW_REQUEST_THRESHOLD,
    });
  }

  /**
   * Log security events
   * @param {string} event - Security event type
   * @param {Object} meta - Additional metadata
   */
  security(event, meta = {}) {
    winstonInstance.warn(`Security Event: ${event}`, {
      ...this.context,
      ...this._sanitizeMetadata(meta),
      security: true,
    });
  }

  /**
   * Log business events
   * @param {string} event - Business event type
   * @param {Object} meta - Additional metadata
   */
  business(event, meta = {}) {
    winstonInstance.info(`Business Event: ${event}`, {
      ...this.context,
      ...this._sanitizeMetadata(meta),
      business: true,
    });
  }

  /**
   * Sanitize metadata to remove sensitive information
   * @param {Object} meta - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   * @private
   */
  _sanitizeMetadata(meta) {
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
      "cookie",
      "session",
      "jwt",
      "apiKey",
      "privateKey",
      "cardNumber",
      "cvv",
      "ssn",
      "socialSecurityNumber",
    ];

    const sanitized = { ...meta };

    const sanitizeObject = (obj, path = "") => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        // Check if field is sensitive
        if (sensitiveFields.some((field) => lowerKey.includes(field))) {
          obj[key] = "[REDACTED]";
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          sanitizeObject(value, fullPath);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }
}

// Create default logger instance
const defaultLogger = new StructuredLogger();

/**
 * Create a logger with specific context
 * @param {Object} context - Context to attach to all log messages
 * @returns {StructuredLogger} Logger instance with context
 */
export function createLogger(context = {}) {
  return new StructuredLogger(context);
}

/**
 * Express middleware for request logging
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId =
    req.headers["x-request-id"] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to request object
  req.requestId = requestId;

  // Create request-specific logger
  req.logger = createLogger({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Log request start
  req.logger.http("Request started");

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;

    req.logger.http("Request completed", {
      statusCode: res.statusCode,
      duration,
    });

    // Log performance if slow
    if (duration > LOGGING_CONSTANTS.SLOW_REQUEST_THRESHOLD) {
      req.logger.performance("HTTP Request", duration, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
      });
    }

    originalEnd.apply(this, args);
  };

  next();
}

export const logger = defaultLogger;
export const winstonLogger = winstonInstance;

// Convenience re-exports
export const error = defaultLogger.error.bind(defaultLogger);
export const warn = defaultLogger.warn.bind(defaultLogger);
export const info = defaultLogger.info.bind(defaultLogger);
export const http = defaultLogger.http.bind(defaultLogger);
export const debug = defaultLogger.debug.bind(defaultLogger);
export const performance = defaultLogger.performance.bind(defaultLogger);
export const security = defaultLogger.security.bind(defaultLogger);
export const business = defaultLogger.business.bind(defaultLogger);

export default logger;
