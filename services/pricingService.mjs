// const logger = require('../src/utils/logger');

/**
 * Pricing Service for Grubsy
 * Handles all distance-based pricing calculations
 */
class PricingService {
  constructor() {
    // Fixed delivery fees by distance bands (0-5 miles) with half-mile increments
    this.deliveryFees = [
      { maxMiles: 1, fee: 3.45 },
      { maxMiles: 1.5, fee: 3.9225 }, // 3.45 + 0.4725
      { maxMiles: 2, fee: 4.4 },
      { maxMiles: 2.5, fee: 4.8775 }, // 4.40 + 0.4775
      { maxMiles: 3, fee: 5.35 },
      { maxMiles: 3.5, fee: 5.8275 }, // 5.35 + 0.4775
      { maxMiles: 4, fee: 6.15 },
      { maxMiles: 4.5, fee: 6.55 }, // 6.15 + 0.40
      { maxMiles: 5, fee: 7.1 },
    ];

    // Fixed service charge for all orders (per client requirement)
    this.fixedServiceCharge = 1.5;

    // Small order surcharges by distance bands (per client requirement)
    // These are ADDED to the normal delivery fee for orders ≤ £14.99
    this.smallOrderFees = [
      { maxMiles: 1, fee: 2.45 }, // Client spec: +£2.45 for 0-1 mile
      { maxMiles: 2, fee: 3.25 }, // Client spec: +£3.25 for 1-2 miles
      { maxMiles: 3, fee: 3.99 }, // Client spec: +£3.99 for 2-3 miles
      { maxMiles: 4, fee: 4.8 }, // Client spec: +£4.80 for 3-4 miles
      { maxMiles: 5, fee: 4.99 }, // Client spec: +£4.99 for 4-5 miles
    ];
  }

  /**
   * Calculate delivery fee based on distance
   * @param {number} distance - Distance in miles
   * @returns {number} Delivery fee
   */
  calculateDeliveryFee(distance) {
    if (!distance || distance <= 0) return 0;

    for (const tier of this.deliveryFees) {
      if (distance <= tier.maxMiles) {
        return tier.fee;
      }
    }

    // If distance is over 5 miles, use the highest tier
    return this.deliveryFees[this.deliveryFees.length - 1].fee;
  }

  /**
   * Calculate service charge - Fixed £1.50 for all orders (per client requirement)
   * @returns {number} Service charge (fixed £1.50)
   */
  calculateServiceCharge() {
    // Client requirement: Fixed £1.50 service charge for ALL orders
    return this.fixedServiceCharge;
  }

  /**
   * Calculate small order fee based on distance
   * @param {number} distance - Distance in miles
   * @returns {number} Small order fee
   */
  calculateSmallOrderFee(distance) {
    if (!distance || distance <= 0) return 0;

    for (const tier of this.smallOrderFees) {
      if (distance <= tier.maxMiles) {
        return tier.fee;
      }
    }

    // If distance is over 5 miles, use the highest tier
    return this.smallOrderFees[this.smallOrderFees.length - 1].fee;
  }

  /**
   * Calculate all pricing components for an order
   * @param {number} distance - Distance in miles
   * @param {number} subtotal - Order subtotal
   * @param {boolean} isSmallOrder - Whether this qualifies as a small order
   * @returns {object} Pricing breakdown
   */
  calculateOrderPricing(distance, subtotal, isSmallOrder = false) {
    try {
      const deliveryFee = this.calculateDeliveryFee(distance);
      const serviceCharge = this.calculateServiceCharge(); // Fixed £1.50
      const smallOrderFee = isSmallOrder
        ? this.calculateSmallOrderFee(distance)
        : 0;

      const totalFees = deliveryFee + serviceCharge + smallOrderFee;
      const grandTotal = subtotal + totalFees;

      const pricing = {
        distance,
        subtotal,
        isSmallOrder,
        fees: {
          delivery: deliveryFee,
          service: serviceCharge,
          smallOrder: smallOrderFee,
        },
        totalFees,
        grandTotal,
        breakdown: {
          subtotal: subtotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          serviceCharge: serviceCharge.toFixed(2),
          smallOrderFee: smallOrderFee.toFixed(2),
          totalFees: totalFees.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
        },
      };

      // logger.info('Order pricing calculated', pricing);
      return pricing;
    } catch (error) {
      logger.error("Error calculating order pricing", {
        error: error.message,
        distance,
        subtotal,
        isSmallOrder,
      });
      throw error;
    }
  }

  /**
   * Get pricing preview for a given distance and subtotal
   * @param {number} distance - Distance in miles
   * @param {number} subtotal - Order subtotal
   * @returns {object} Pricing preview
   */
  getPricingPreview(distance, subtotal) {
    // Small order fees apply to orders under £15 (since minimum order validation is being removed)
    const isSmallOrder = subtotal < 15;
    return this.calculateOrderPricing(distance, subtotal, isSmallOrder);
  }

  /**
   * Validate distance input
   * @param {number} distance - Distance to validate
   * @returns {boolean} Whether distance is valid
   */
  isValidDistance(distance) {
    return typeof distance === "number" && distance >= 0 && distance <= 50; // Max 50 miles
  }

  /**
   * Validate subtotal input
   * @param {number} subtotal - Subtotal to validate
   * @returns {boolean} Whether subtotal is valid
   */
  isValidSubtotal(subtotal) {
    return typeof subtotal === "number" && subtotal >= 0;
  }
}

export default new PricingService();
