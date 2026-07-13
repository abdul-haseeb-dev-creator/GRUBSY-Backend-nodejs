// middleware/schemas.js
// Joi validation schemas for Phase 6 routes

const Joi = require("joi");

// Common validation patterns
const patterns = {
  email: Joi.string().email().max(255),
  password: Joi.string().min(6).max(128),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,20}$/),
  name: Joi.string().min(1).max(255).trim(),
  address: Joi.string().min(5).max(500).trim(),
  postcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i),
  dob: Joi.date().max("now").min("1900-01-01"),
  orderId: Joi.string().pattern(/^order_\d+_[a-z0-9]+$/),
  paymentIntentId: Joi.string().pattern(/^pi_[a-zA-Z0-9_]+$/),
  currency: Joi.string().valid("GBP", "USD", "EUR").default("GBP"),
  amount: Joi.number().positive().precision(2).max(10000), // Max £10,000
  amountPence: Joi.number().integer().positive().max(1000000), // Max £10,000 in pence
};

// User Authentication Schemas
const userSchemas = {
  register: Joi.object({
    fullName: patterns.name.required(),
    email: patterns.email.required(),
    address: patterns.address.required(),
    phone: patterns.phone.required(),
    dob: patterns.dob.required(),
    password: patterns.password.required(),
  }),

  login: Joi.object({
    email: patterns.email.required(),
    password: Joi.string().required(), // Don't validate password strength on login
  }),

  refresh: Joi.object({
    // No body validation needed - uses Authorization header
  }),
};

// Order Schemas
const orderSchemas = {
  create: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          name: patterns.name.required(),
          size: Joi.string().max(50).required(),
          quantity: Joi.number().integer().positive().max(99).required(),
          price: patterns.amount.optional(), // Optional - server calculates
          notes: Joi.string().max(200).optional(),
        }),
      )
      .min(1)
      .max(50)
      .required(),

    deliveryAddress: patterns.address.required(),
    postcode: patterns.postcode.required(),
    nameOnCard: patterns.name.optional(),
    registeredAddress: patterns.address.optional(),
    registeredPostcode: patterns.postcode.optional(),

    paymentMethod: Joi.string().valid("stripe", "cash", "card").required(),
    giftCard: Joi.string().max(100).optional(),

    subtotal: patterns.amount.required(),
    deliveryFee: patterns.amount.min(0).required(),
    serviceFee: patterns.amount.min(0).required(),
    grandTotal: patterns.amount.required(),
  }),

  query: Joi.object({
    status: Joi.string().valid("active", "completed", "cancelled").optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    offset: Joi.number().integer().min(0).default(0).optional(),
  }),

  params: Joi.object({
    id: Joi.alternatives()
      .try(patterns.orderId, Joi.number().integer().positive())
      .required(),
  }),
};

// Payment Schemas
const paymentSchemas = {
  createIntent: Joi.object({
    orderId: patterns.orderId.required(),
    provider: Joi.string().valid("stripe").default("stripe").optional(),
  }),

  confirm: Joi.object({
    paymentIntentId: patterns.paymentIntentId.required(),
    orderId: patterns.orderId.required(),
  }),

  refund: Joi.object({
    orderId: patterns.orderId.required(),
    amount: patterns.amount.optional(), // Optional - defaults to full refund
    reason: Joi.string().max(500).optional(),
  }),

  webhook: Joi.object({
    // Stripe webhook - validate basic structure
    id: Joi.string().required(),
    object: Joi.string().valid("event").required(),
    type: Joi.string().required(),
    data: Joi.object({
      object: Joi.object().required(),
    }).required(),
    created: Joi.number().integer().required(),
    livemode: Joi.boolean().required(),
  }),

  processCard: Joi.object({
    amount: patterns.amount.required(),
    currency: patterns.currency.optional(),
    orderId: Joi.string().required(),
    orderData: Joi.object({
      userEmail: patterns.email.required(),
      deliveryAddress: Joi.object({
        street: Joi.string().required(),
        postcode: patterns.postcode.required(),
        coordinates: Joi.object({
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
        }).optional(),
      }).required(),
      items: Joi.array().items(Joi.object()).optional(),
      subtotal: patterns.amount.optional(),
      deliveryFee: patterns.amount.optional(),
      serviceFee: patterns.amount.optional(),
      grandTotal: patterns.amount.optional(),
      billingAddress: Joi.object({
        name: patterns.name.required(),
        address: Joi.string().required(),
        postcode: patterns.postcode.required(),
      }).optional(),
    }).required(),
  }),
};

// Socket.IO payload schemas
const socketSchemas = {
  joinOrder: Joi.object({
    orderId: patterns.orderId.required(),
  }),

  leaveOrder: Joi.object({
    orderId: patterns.orderId.required(),
  }),

  locationUpdate: Joi.object({
    orderId: patterns.orderId.required(),
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }),
};

// Common query parameter schemas
const commonSchemas = {
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    offset: Joi.number().integer().min(0).default(0).optional(),
  }),

  idParam: Joi.object({
    id: Joi.alternatives()
      .try(
        Joi.string().uuid(),
        Joi.number().integer().positive(),
        patterns.orderId,
      )
      .required(),
  }),
};

module.exports = {
  patterns,
  userSchemas,
  orderSchemas,
  paymentSchemas,
  socketSchemas,
  commonSchemas,
};
