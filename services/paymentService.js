import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Use mock service in test environment or if no Stripe key is provided
const isTestMode = process.env.NODE_ENV === "test" || !process.env.STRIPE_SECRET_KEY;
let stripe, axios;

if (!isTestMode) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  axios = require("axios");
}

// Payment Constants
const PAYMENT_CONSTANTS = {
  // Currency conversion
  PENCE_MULTIPLIER: 100,
  DECIMAL_PLACES: 2,

  // Klarna limits and rates
  KLARNA_MINIMUM_AMOUNT: 30,
  VAT_RATE: 0.2,
  VAT_RATE_BASIS_POINTS: 2000, // 20% in basis points

  // Risk scoring thresholds
  RISK_THRESHOLD_ACCEPT: 70,
  RISK_THRESHOLD_LOW: 30,
  RISK_THRESHOLD_MEDIUM: 50,
  RISK_THRESHOLD_HIGH: 70,
  RISK_SCORE_CAP: 100,

  // Risk scoring factors
  RISK_HIGH_AMOUNT_THRESHOLD: 100,
  RISK_HIGH_AMOUNT_SCORE: 10,
  RISK_VERY_HIGH_AMOUNT_THRESHOLD: 500,
  RISK_VERY_HIGH_AMOUNT_SCORE: 20,
  RISK_ADDRESS_MISMATCH_SCORE: 15,
  RISK_MANY_ITEMS_THRESHOLD: 10,
  RISK_MANY_ITEMS_SCORE: 10,

  // Payment method risk scores
  RISK_CARD_SCORE: 5,
  RISK_PAYPAL_SCORE: 2,
  RISK_DIGITAL_WALLET_SCORE: 1,
};

class PaymentService {
  constructor() {
    this.isTestMode = process.env.NODE_ENV === "test";

    if (!this.isTestMode) {
      this.stripe = stripe;
      this.paypalClientId = process.env.PAYPAL_CLIENT_ID;
      this.paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
      this.klarnaUsername = process.env.KLARNA_USERNAME;
      this.klarnaPassword = process.env.KLARNA_PASSWORD;
      this.paypalBaseUrl =
        process.env.NODE_ENV === "production"
          ? "https://api.paypal.com"
          : "https://api.sandbox.paypal.com";
      this.klarnaBaseUrl =
        process.env.NODE_ENV === "production"
          ? "https://api.klarna.com"
          : "https://api.playground.klarna.com";
    }
  }

  /**
   * Create a Stripe payment intent
   * @param {number} amount - Payment amount in GBP
   * @param {string} currency - Currency code (default 'gbp')
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Payment intent result
   */
  async createStripePaymentIntent(amount, currency = "gbp", metadata = {}) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.createStripePaymentIntent(
        amount,
        currency,
        metadata,
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * PAYMENT_CONSTANTS.PENCE_MULTIPLIER), // Convert to pence
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log("[PaymentService] Stripe payment intent created", {
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
      });

      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error("[PaymentService] Stripe payment intent creation failed", {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Confirm a Stripe payment intent
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<object>} Confirmation result
   */
  async confirmStripePayment(paymentIntentId) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.confirmStripePayment(paymentIntentId);
    }

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        paymentIntent,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error("Stripe payment confirmation failed", {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // PayPal Payment Methods
  /**
   * Get PayPal access token
   * @returns {Promise<string>} Access token
   */
  async getPayPalAccessToken() {
    if (this.isTestMode) {
      // Mock implementation - return a mock token
      return "mock_paypal_access_token";
    }

    try {
      const auth = Buffer.from(
        `${this.paypalClientId}:${this.paypalClientSecret}`,
      ).toString("base64");

      const response = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      logger.error("PayPal access token retrieval failed", {
        error: error.message,
      });
      throw new Error("PayPal authentication failed");
    }
  }

  /**
   * Create a PayPal order
   * @param {number} amount - Payment amount
   * @param {string} currency - Currency code
   * @param {string} orderId - Order reference ID
   * @returns {Promise<object>} Order result
   */
  async createPayPalOrder(amount, orderId, currency = "GBP") {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.createPayPalOrder(amount, orderId, currency);
    }

    try {
      const accessToken = await this.getPayPalAccessToken();

      const orderData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: currency,
              value: amount.toFixed(PAYMENT_CONSTANTS.DECIMAL_PLACES),
            },
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        },
      };

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("PayPal order created", {
        paypalOrderId: response.data.id,
        amount,
        currency,
      });

      return {
        success: true,
        orderId: response.data.id,
        approvalUrl: response.data.links.find((link) => link.rel === "approve")
          ?.href,
      };
    } catch (error) {
      logger.error("PayPal order creation failed", { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Capture a PayPal order
   * @param {string} paypalOrderId - PayPal order ID
   * @returns {Promise<object>} Capture result
   */
  async capturePayPalOrder(paypalOrderId) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.capturePayPalOrder(paypalOrderId);
    }

    try {
      const accessToken = await this.getPayPalAccessToken();

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("PayPal order captured", { paypalOrderId });

      return {
        success: true,
        captureId: response.data.purchase_units[0].payments.captures[0].id,
        status: response.data.status,
      };
    } catch (error) {
      logger.error("PayPal order capture failed", { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Klarna Payment Methods
  /**
   * Create a Klarna payment session
   * @param {number} amount - Payment amount
   * @param {string} currency - Currency code
   * @param {object} orderData - Order details
   * @returns {Promise<object>} Klarna session result
   */
  async createKlarnaSession(amount, orderData, currency = "GBP") {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.createKlarnaSession(
        amount,
        orderData,
        currency,
      );
    }

    try {
      // Only allow Klarna for orders over minimum amount
      if (amount < PAYMENT_CONSTANTS.KLARNA_MINIMUM_AMOUNT) {
        return {
          success: false,
          error: `Klarna is only available for orders over £${PAYMENT_CONSTANTS.KLARNA_MINIMUM_AMOUNT}`,
        };
      }

      const auth = Buffer.from(
        `${this.klarnaUsername}:${this.klarnaPassword}`,
      ).toString("base64");

      const sessionData = {
        purchase_country: "GB",
        purchase_currency: currency,
        locale: "en-GB",
        order_amount: Math.round(amount * PAYMENT_CONSTANTS.PENCE_MULTIPLIER), // Convert to pence
        order_tax_amount: Math.round(
          amount *
            PAYMENT_CONSTANTS.VAT_RATE *
            PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
        ), // VAT calculation
        order_lines: orderData.items.map((item) => ({
          type: "physical",
          reference: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: Math.round(
            item.price * PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
          ),
          tax_rate: PAYMENT_CONSTANTS.VAT_RATE_BASIS_POINTS, // 20% VAT in basis points
          total_amount: Math.round(
            item.price * item.quantity * PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
          ),
          total_tax_amount: Math.round(
            item.price *
              item.quantity *
              PAYMENT_CONSTANTS.VAT_RATE *
              PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
          ),
        })),
        merchant_urls: {
          terms: `${process.env.FRONTEND_URL}/terms`,
          checkout: `${process.env.FRONTEND_URL}/checkout`,
          confirmation: `${process.env.FRONTEND_URL}/payment/success`,
          push: `${process.env.BACKEND_URL}/api/payments/klarna/webhook`,
        },
      };

      const response = await axios.post(
        `${this.klarnaBaseUrl}/payments/v1/sessions`,
        sessionData,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("Klarna session created", {
        sessionId: response.data.session_id,
        amount,
        currency,
      });

      return {
        success: true,
        sessionId: response.data.session_id,
        clientToken: response.data.client_token,
      };
    } catch (error) {
      logger.error("Klarna session creation failed", { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a Klarna order
   * @param {string} authToken - Klarna authorization token
   * @returns {Promise<object>} Klarna order result
   */
  async createKlarnaOrder(authToken) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.createKlarnaOrder(authToken);
    }

    try {
      const auth = Buffer.from(
        `${this.klarnaUsername}:${this.klarnaPassword}`,
      ).toString("base64");

      const response = await axios.post(
        `${this.klarnaBaseUrl}/payments/v1/authorizations/${authToken}/order`,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("Klarna order created", { orderId: response.data.order_id });

      return {
        success: true,
        orderId: response.data.order_id,
        status: "authorized",
      };
    } catch (error) {
      logger.error("Klarna order creation failed", { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Apple Pay & Google Pay (handled through Stripe)
  /**
   * Create an Apple Pay session (via Stripe)
   * @param {number} amount - Payment amount
   * @param {string} currency - Currency code
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Payment intent result
   */
  async createApplePaySession(amount, currency = "gbp", metadata = {}) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.createApplePaySession(
        amount,
        currency,
        metadata,
      );
    }

    return this.createStripePaymentIntent(amount, currency, {
      ...metadata,
      payment_method_types: "apple_pay",
    });
  }

  /**
   * Create a Google Pay session (via Stripe)
   * @param {number} amount - Payment amount
   * @param {string} currency - Currency code
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Payment intent result
   */
  async createGooglePaySession(amount, currency = "gbp", metadata = {}) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.createGooglePaySession(
        amount,
        currency,
        metadata,
      );
    }

    return this.createStripePaymentIntent(amount, currency, {
      ...metadata,
      payment_method_types: "google_pay",
    });
  }

  // Refund Methods
  /**
   * Process a refund for any supported payment method
   * @param {string} paymentMethod - Payment method (stripe, paypal, klarna, apple_pay, google_pay)
   * @param {string} paymentId - Payment or order ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<object>} Refund result
   */
  async processRefund(
    paymentMethod,
    paymentId,
    amount,
    reason = "requested_by_customer",
  ) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.processRefund(
        paymentMethod,
        paymentId,
        amount,
        reason,
      );
    }

    try {
      switch (paymentMethod) {
        case "stripe":
        case "apple_pay":
        case "google_pay":
          return await this.processStripeRefund(paymentId, amount, reason);
        case "paypal":
          return await this.processPayPalRefund(paymentId, amount, reason);
        case "klarna":
          return await this.processKlarnaRefund(paymentId, amount, reason);
        default:
          throw new Error(
            `Unsupported payment method for refund: ${paymentMethod}`,
          );
      }
    } catch (error) {
      logger.error("Refund processing failed", {
        paymentMethod,
        paymentId,
        amount,
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process a Stripe refund (full or partial)
   */
  /**
   * Process a Stripe refund (full or partial)
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<object>} Refund result
   */
  async processStripeRefund(paymentIntentId, amount, reason) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount
          ? Math.round(amount * PAYMENT_CONSTANTS.PENCE_MULTIPLIER)
          : undefined, // Partial or full refund
        reason,
      });

      logger.info("Stripe refund processed", {
        refundId: refund.id,
        amount: refund.amount / PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
        status: refund.status,
      };
    } catch (error) {
      logger.error("Stripe refund failed", {
        error: error.message,
        paymentIntentId,
        amount,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process a PayPal refund (full or partial)
   */
  /**
   * Process a PayPal refund (full or partial)
   * @param {string} captureId - PayPal capture ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<object>} Refund result
   */
  async processPayPalRefund(captureId, amount, reason) {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const refundData = {
        amount: {
          value: amount.toFixed(PAYMENT_CONSTANTS.DECIMAL_PLACES),
          currency_code: "GBP",
        },
        note_to_payer: reason,
      };

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("PayPal refund processed", {
        refundId: response.data.id,
        amount,
      });

      return {
        success: true,
        refundId: response.data.id,
        amount,
        status: response.data.status,
      };
    } catch (error) {
      logger.error("PayPal refund failed", {
        error: error.message,
        captureId,
        amount,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process a Klarna refund (full or partial)
   */
  /**
   * Process a Klarna refund (full or partial)
   * @param {string} orderId - Klarna order ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<object>} Refund result
   */
  async processKlarnaRefund(orderId, amount, reason) {
    try {
      const auth = Buffer.from(
        `${this.klarnaUsername}:${this.klarnaPassword}`,
      ).toString("base64");

      const refundData = {
        refunded_amount: Math.round(
          amount * PAYMENT_CONSTANTS.PENCE_MULTIPLIER,
        ),
        description: reason,
      };

      const response = await axios.post(
        `${this.klarnaBaseUrl}/ordermanagement/v1/orders/${orderId}/refunds`,
        refundData,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("Klarna refund processed", {
        refundId: response.data.refund_id,
        amount,
      });

      return {
        success: true,
        refundId: response.data.refund_id,
        amount,
        status: "completed",
      };
    } catch (error) {
      logger.error("Klarna refund failed", {
        error: error.message,
        orderId,
        amount,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Fraud Detection
  /**
   * Validate payment and calculate risk score
   * @param {object} paymentData - Payment details
   * @param {object} orderData - Order details
   * @returns {Promise<object>} Validation result
   */
  async validatePayment(paymentData, orderData) {
    if (this.isTestMode) {
      // Use mock implementation
      const mockPaymentService = require("./mockPaymentService");
      return mockPaymentService.validatePayment(paymentData, orderData);
    }

    const riskScore = await this.calculateRiskScore(paymentData, orderData);

    return {
      isValid: riskScore < PAYMENT_CONSTANTS.RISK_THRESHOLD_ACCEPT, // Risk score threshold
      riskScore,
      recommendations: this.getRiskRecommendations(riskScore),
    };
  }

  /**
   * Calculate risk score for a payment
   * @param {object} paymentData - Payment details
   * @param {object} orderData - Order details
   * @returns {Promise<number>} Risk score
   */
  async calculateRiskScore(paymentData, orderData) {
    let riskScore = 0;

    // Check order amount
    if (orderData.amount > PAYMENT_CONSTANTS.RISK_HIGH_AMOUNT_THRESHOLD)
      riskScore += PAYMENT_CONSTANTS.RISK_HIGH_AMOUNT_SCORE;
    if (orderData.amount > PAYMENT_CONSTANTS.RISK_VERY_HIGH_AMOUNT_THRESHOLD)
      riskScore += PAYMENT_CONSTANTS.RISK_VERY_HIGH_AMOUNT_SCORE;

    // Check delivery address vs billing address mismatch
    if (paymentData.billingAddress && orderData.deliveryAddress) {
      const addressMatch = this.compareAddresses(
        paymentData.billingAddress,
        orderData.deliveryAddress,
      );
      if (!addressMatch)
        riskScore += PAYMENT_CONSTANTS.RISK_ADDRESS_MISMATCH_SCORE;
    }

    // Check for unusual ordering patterns
    if (
      orderData.items &&
      orderData.items.length > PAYMENT_CONSTANTS.RISK_MANY_ITEMS_THRESHOLD
    )
      riskScore += PAYMENT_CONSTANTS.RISK_MANY_ITEMS_SCORE;

    // Check payment method risk
    switch (paymentData.method) {
      case "card":
        riskScore += PAYMENT_CONSTANTS.RISK_CARD_SCORE;
        break;
      case "paypal":
        riskScore += PAYMENT_CONSTANTS.RISK_PAYPAL_SCORE;
        break;
      case "apple_pay":
      case "google_pay":
        riskScore += PAYMENT_CONSTANTS.RISK_DIGITAL_WALLET_SCORE;
        break;
    }

    return Math.min(riskScore, PAYMENT_CONSTANTS.RISK_SCORE_CAP); // Cap at 100
  }

  /**
   * Compare billing and delivery addresses
   * @param {object} billing - Billing address
   * @param {object} delivery - Delivery address
   * @returns {boolean} True if addresses match
   */
  compareAddresses(billing, delivery) {
    // Simple address comparison - in production, use more sophisticated matching
    const billingPostcode = billing.postcode?.replace(/\s/g, "").toLowerCase();
    const deliveryPostcode = delivery.postcode
      ?.replace(/\s/g, "")
      .toLowerCase();

    return billingPostcode === deliveryPostcode;
  }

  /**
   * Get risk recommendations based on risk score
   * @param {number} riskScore - Calculated risk score
   * @returns {string[]} Array of recommendations
   */
  getRiskRecommendations(riskScore) {
    if (riskScore < PAYMENT_CONSTANTS.RISK_THRESHOLD_LOW) return ["low_risk"];
    if (riskScore < PAYMENT_CONSTANTS.RISK_THRESHOLD_MEDIUM)
      return ["medium_risk", "manual_review"];
    if (riskScore < PAYMENT_CONSTANTS.RISK_THRESHOLD_HIGH)
      return ["high_risk", "manual_review", "additional_verification"];
    return ["very_high_risk", "decline", "manual_review"];
  }
}

export default new PaymentService();
