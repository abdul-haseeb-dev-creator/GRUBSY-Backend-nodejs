const logger = require('../logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CommissionService {
  constructor() {
    // Commission rates (configurable)
    this.commissionRates = {
      establishment: {
        base: 0.15, // 15% base commission
        premium: 0.12, // 12% for premium establishments
        volume_discount: {
          threshold: 1000, // Monthly volume threshold
          rate: 0.13, // Reduced rate for high volume
        },
      },
      driver: {
        // Fixed driver payments per distance band (what drivers actually receive) with half-mile increments
        fixed_payments: [
          { maxMiles: 1, payment: 3.35 },
          { maxMiles: 1.5, payment: 3.825 }, // 3.35 + 0.475
          { maxMiles: 2, payment: 4.30 },
          { maxMiles: 2.5, payment: 4.775 }, // 4.30 + 0.475
          { maxMiles: 3, payment: 5.25 },
          { maxMiles: 3.5, payment: 5.725 }, // 5.25 + 0.475
          { maxMiles: 4, payment: 6.10 },
          { maxMiles: 4.5, payment: 6.50 }, // 6.10 + 0.40
          { maxMiles: 5, payment: 7.10 }
        ],
        time_bonus: {
          peak_hours: 1.50, // Extra during peak hours
          late_night: 2.00, // Extra for late night deliveries
        },
      },
      platform: {
        service_fee: 0.50, // Fixed service fee
        payment_processing: 0.029, // 2.9% payment processing fee
      },
    };
  }

  // Calculate establishment commission
  async calculateEstablishmentCommission(orderData) {
    try {
      const {
        establishmentId,
        subtotal,
        establishmentTier = 'base',
        monthlyVolume = 0,
      } = orderData;

      // Fetch merchant-specific commission rate from database
      const merchant = await prisma.merchants.findUnique({
        where: { Grubsy_Partner_ID: establishmentId },
        select: {
          Grubsy_Partner_ID: true,
          Merchant_Fee_Per_Order: true,
          Merchants_Name: true,
        },
      });

      let commissionRate;

      if (merchant && merchant.Merchant_Fee_Per_Order) {
        // Parse the percentage from the database (e.g., "10%" -> 0.10)
        const feeString = merchant.Merchant_Fee_Per_Order.toString().replace('%', '');
        const parsedRate = parseFloat(feeString) / 100;

        if (!isNaN(parsedRate) && parsedRate >= 0 && parsedRate <= 1) {
          commissionRate = parsedRate;
          logger.info('Using merchant-specific commission rate from database', {
            establishmentId,
            merchantName: merchant.Merchants_Name,
            storedFee: merchant.Merchant_Fee_Per_Order,
            parsedRate: commissionRate,
          });
        } else {
          logger.warn('Invalid merchant commission rate, using fallback', {
            establishmentId,
            storedFee: merchant.Merchant_Fee_Per_Order,
            parsedRate,
          });
          commissionRate = this.commissionRates.establishment.base;
        }
      } else {
        // No merchant-specific rate found, use default
        commissionRate = this.commissionRates.establishment.base;
        logger.info('No merchant-specific commission rate found, using default', {
          establishmentId,
          defaultRate: commissionRate,
        });
      }

      // Apply tier-based adjustments (if still needed for future features)
      if (establishmentTier === 'premium') {
        // Could potentially adjust the merchant-specific rate, but for now keep as-is
        // commissionRate = Math.max(commissionRate - 0.02, 0.05); // Example: reduce by 2% for premium
      }

      // Apply volume discount (if still applicable)
      if (monthlyVolume >= this.commissionRates.establishment.volume_discount.threshold) {
        commissionRate = Math.min(commissionRate, this.commissionRates.establishment.volume_discount.rate);
        logger.info('Volume discount applied', {
          establishmentId,
          originalRate: commissionRate,
          discountedRate: this.commissionRates.establishment.volume_discount.rate,
        });
      }

      const commissionAmount = subtotal * commissionRate;
      const establishmentEarnings = subtotal - commissionAmount;

      logger.info('Establishment commission calculated', {
        establishmentId,
        merchantName: merchant?.Merchants_Name,
        subtotal,
        commissionRate,
        commissionAmount,
        establishmentEarnings,
        source: merchant?.Merchant_Fee_Per_Order ? 'database' : 'default',
      });

      return {
        success: true,
        commission: {
          rate: commissionRate,
          amount: commissionAmount,
          establishmentEarnings,
          tier: establishmentTier,
          volumeDiscount: monthlyVolume >= this.commissionRates.establishment.volume_discount.threshold,
          source: merchant?.Merchant_Fee_Per_Order ? 'database' : 'default',
          merchantName: merchant?.Merchants_Name,
        },
      };
    } catch (error) {
      logger.error('Establishment commission calculation failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Calculate driver earnings
  async calculateDriverEarnings(orderData) {
    try {
      const {
        driverId,
        distance,
        // deliveryTime, // TODO: Use for time-based calculations
        isPeakHour = false,
        isLateNight = false,
        tips = 0,
      } = orderData;

      // Get fixed driver payment based on distance
      let baseDriverPayment = 0;
      for (const tier of this.commissionRates.driver.fixed_payments) {
        if (distance <= tier.maxMiles) {
          baseDriverPayment = tier.payment;
          break;
        }
      }

      // If distance is over 5 miles, use the highest tier
      if (baseDriverPayment === 0) {
        baseDriverPayment = this.commissionRates.driver.fixed_payments[this.commissionRates.driver.fixed_payments.length - 1].payment;
      }

      let timeBonuses = 0;

      // Apply time-based bonuses
      if (isPeakHour) {
        timeBonuses += this.commissionRates.driver.time_bonus.peak_hours;
      }
      if (isLateNight) {
        timeBonuses += this.commissionRates.driver.time_bonus.late_night;
      }

      const totalDriverEarnings = baseDriverPayment + timeBonuses + tips;

      logger.info('Driver earnings calculated', {
        driverId,
        distance,
        baseDriverPayment,
        timeBonuses,
        tips,
        totalDriverEarnings,
      });

      return {
        success: true,
        earnings: {
          basePayment: baseDriverPayment,
          timeBonuses,
          tips,
          totalEarnings: totalDriverEarnings,
          breakdown: {
            base: baseDriverPayment,
            bonuses: timeBonuses,
            tips,
          },
        },
      };
    } catch (error) {
      logger.error('Driver earnings calculation failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Calculate platform fees
  async calculatePlatformFees(orderData) {
    try {
      const {
        // subtotal, // TODO: May be used for future fee calculations
        // deliveryFee, // TODO: May be used for future fee calculations
        paymentMethod,
        paymentAmount,
      } = orderData;

      const serviceFee = this.commissionRates.platform.service_fee;
      let paymentProcessingFee = 0;

      // Calculate payment processing fees based on method
      switch (paymentMethod) {
      case 'stripe':
      case 'apple_pay':
      case 'google_pay':
        paymentProcessingFee = paymentAmount * this.commissionRates.platform.payment_processing;
        break;
      case 'paypal':
        paymentProcessingFee = paymentAmount * 0.034; // PayPal's higher rate
        break;
      case 'klarna':
        paymentProcessingFee = paymentAmount * 0.025; // Klarna's rate
        break;
      default:
        paymentProcessingFee = 0;
      }

      const totalPlatformFees = serviceFee + paymentProcessingFee;

      return {
        success: true,
        fees: {
          serviceFee,
          paymentProcessingFee,
          totalFees: totalPlatformFees,
          breakdown: {
            service: serviceFee,
            payment_processing: paymentProcessingFee,
          },
        },
      };
    } catch (error) {
      logger.error('Platform fees calculation failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process order commission split
  async processOrderCommissions(orderData) {
    try {
      const establishmentResult = await this.calculateEstablishmentCommission(orderData);
      const driverResult = await this.calculateDriverEarnings(orderData);
      const platformResult = await this.calculatePlatformFees(orderData);

      if (!establishmentResult.success || !driverResult.success || !platformResult.success) {
        throw new Error('Commission calculation failed');
      }

      const commissionSplit = {
        orderId: orderData.orderId,
        establishment: establishmentResult.commission,
        driver: driverResult.earnings,
        platform: platformResult.fees,
        total: {
          orderValue: orderData.subtotal + orderData.deliveryFee,
          establishmentEarnings: establishmentResult.commission.establishmentEarnings,
          driverEarnings: driverResult.earnings.totalEarnings,
          platformEarnings: establishmentResult.commission.amount + 
                           driverResult.earnings.platformCommission + 
                           platformResult.fees.totalFees,
        },
        timestamp: new Date().toISOString(),
      };

      // Store commission data (implement database storage)
      await this.storeCommissionData(commissionSplit);

      logger.info('Order commissions processed', {
        orderId: orderData.orderId,
        commissionSplit,
      });

      return {
        success: true,
        commissionSplit,
      };
    } catch (error) {
      logger.error('Order commission processing failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Store commission data (placeholder - implement with your database)
  async storeCommissionData(commissionData) {
    // TODO: Implement database storage
    // This would typically store in a commissions table
    logger.info('Commission data stored', { orderId: commissionData.orderId });
  }

  // Get establishment earnings summary
  async getEstablishmentEarnings(establishmentId, period = 'week') {
    try {
      // Get merchant-specific commission rate
      const merchant = await prisma.merchants.findUnique({
        where: { Grubsy_Partner_ID: establishmentId },
        select: {
          Grubsy_Partner_ID: true,
          Merchant_Fee_Per_Order: true,
          Merchants_Name: true,
        },
      });

      let commissionRate = this.commissionRates.establishment.base; // Default fallback

      if (merchant && merchant.Merchant_Fee_Per_Order) {
        const feeString = merchant.Merchant_Fee_Per_Order.toString().replace('%', '');
        const parsedRate = parseFloat(feeString) / 100;

        if (!isNaN(parsedRate) && parsedRate >= 0 && parsedRate <= 1) {
          commissionRate = parsedRate;
        }
      }

      // TODO: Implement actual database queries for real earnings data
      // For now, return mock data with the correct commission rate
      const mockData = {
        establishmentId,
        merchantName: merchant?.Merchants_Name,
        period,
        totalOrders: 45,
        totalRevenue: 1250.00,
        totalCommissions: 1250.00 * commissionRate,
        netEarnings: 1250.00 * (1 - commissionRate),
        averageOrderValue: 27.78,
        commissionRate: commissionRate,
        commissionSource: merchant?.Merchant_Fee_Per_Order ? 'database' : 'default',
        breakdown: {
          food_sales: 1100.00,
          delivery_fees: 150.00,
          commissions_paid: 1250.00 * commissionRate,
        },
      };

      logger.info('Establishment earnings retrieved', {
        establishmentId,
        period,
        commissionRate,
        source: mockData.commissionSource,
      });

      return {
        success: true,
        earnings: mockData,
      };
    } catch (error) {
      logger.error('Establishment earnings retrieval failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get driver earnings summary
  async getDriverEarnings(driverId, period = 'week') {
    try {
      // TODO: Implement database query
      // This is a placeholder implementation
      const mockData = {
        driverId,
        period,
        totalDeliveries: 32,
        totalEarnings: 456.80,
        totalTips: 89.50,
        averageEarningsPerDelivery: 14.28,
        breakdown: {
          base_fees: 112.00,
          distance_fees: 89.60,
          time_bonuses: 45.70,
          commission_earnings: 120.00,
          tips: 89.50,
        },
        hoursWorked: 28,
        averageHourlyRate: 16.31,
      };

      return {
        success: true,
        earnings: mockData,
      };
    } catch (error) {
      logger.error('Driver earnings retrieval failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process payout to establishment
  async processEstablishmentPayout(establishmentId, amount, payoutMethod = 'bank_transfer') {
    try {
      // TODO: Integrate with payment provider for payouts
      // This would typically use Stripe Connect or similar
      
      const payout = {
        payoutId: `payout_${Date.now()}_${establishmentId}`,
        establishmentId,
        amount,
        method: payoutMethod,
        status: 'processing',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
        createdAt: new Date().toISOString(),
      };

      // Store payout record
      await this.storePayoutData(payout);

      logger.info('Establishment payout initiated', {
        establishmentId,
        amount,
        payoutId: payout.payoutId,
      });

      return {
        success: true,
        payout,
      };
    } catch (error) {
      logger.error('Establishment payout failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process payout to driver
  async processDriverPayout(driverId, amount, payoutMethod = 'instant') {
    try {
      // TODO: Integrate with payment provider for payouts
      
      const payout = {
        payoutId: `payout_${Date.now()}_${driverId}`,
        driverId,
        amount,
        method: payoutMethod,
        status: payoutMethod === 'instant' ? 'completed' : 'processing',
        scheduledDate: payoutMethod === 'instant' ? new Date() : new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date().toISOString(),
      };

      // Store payout record
      await this.storePayoutData(payout);

      logger.info('Driver payout initiated', {
        driverId,
        amount,
        payoutId: payout.payoutId,
      });

      return {
        success: true,
        payout,
      };
    } catch (error) {
      logger.error('Driver payout failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Store payout data (placeholder)
  async storePayoutData(payoutData) {
    // TODO: Implement database storage
    logger.info('Payout data stored', { payoutId: payoutData.payoutId });
  }

  // Get commission rates (for admin configuration)
  getCommissionRates() {
    return this.commissionRates;
  }

  // Update commission rates (for admin configuration)
  updateCommissionRates(newRates) {
    this.commissionRates = { ...this.commissionRates, ...newRates };
    logger.info('Commission rates updated', { newRates });
    return this.commissionRates;
  }
}

module.exports = new CommissionService();