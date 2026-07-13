// middleware/validate.js
// Request validation middleware using Joi schemas

const Joi = require('joi');

/**
 * Create validation middleware for request body
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
function validateBody(schema, options = {}) {
  const defaultOptions = {
    abortEarly: false, // Return all validation errors
    stripUnknown: true, // Remove unknown fields
    allowUnknown: false, // Reject unknown fields
    ...options,
  };

  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, defaultOptions);

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

/**
 * Create validation middleware for query parameters
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
function validateQuery(schema, options = {}) {
  const defaultOptions = {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
    ...options,
  };

  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, defaultOptions);

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: 'Query validation failed',
        details: validationErrors,
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Create validation middleware for URL parameters
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
function validateParams(schema, options = {}) {
  const defaultOptions = {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
    ...options,
  };

  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, defaultOptions);

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: 'Parameter validation failed',
        details: validationErrors,
      });
    }

    req.params = value;
    next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
};