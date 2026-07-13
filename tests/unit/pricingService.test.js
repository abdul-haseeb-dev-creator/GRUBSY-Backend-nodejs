import pricingService from '../../services/pricingService.mjs';

describe('PricingService', () => {
  describe('calculateDeliveryFee', () => {
    test('should return correct delivery fee for 0-1 miles', () => {
      expect(pricingService.calculateDeliveryFee(0.5)).toBe(3.45);
      expect(pricingService.calculateDeliveryFee(1)).toBe(3.45);
    });

    test('should return correct delivery fee for 1-1.5 miles', () => {
      expect(pricingService.calculateDeliveryFee(1.2)).toBe(3.9225);
      expect(pricingService.calculateDeliveryFee(1.5)).toBe(3.9225);
    });

    test('should return correct delivery fee for 1.5-2 miles', () => {
      expect(pricingService.calculateDeliveryFee(1.8)).toBe(4.40);
      expect(pricingService.calculateDeliveryFee(2)).toBe(4.40);
    });

    test('should return correct delivery fee for 2-2.5 miles', () => {
      expect(pricingService.calculateDeliveryFee(2.2)).toBe(4.8775);
      expect(pricingService.calculateDeliveryFee(2.5)).toBe(4.8775);
    });

    test('should return correct delivery fee for 2.5-3 miles', () => {
      expect(pricingService.calculateDeliveryFee(2.8)).toBe(5.35);
      expect(pricingService.calculateDeliveryFee(3)).toBe(5.35);
    });

    test('should return correct delivery fee for 3-3.5 miles', () => {
      expect(pricingService.calculateDeliveryFee(3.2)).toBe(5.8275);
      expect(pricingService.calculateDeliveryFee(3.5)).toBe(5.8275);
    });

    test('should return correct delivery fee for 3.5-4 miles', () => {
      expect(pricingService.calculateDeliveryFee(3.8)).toBe(6.15);
      expect(pricingService.calculateDeliveryFee(4)).toBe(6.15);
    });

    test('should return correct delivery fee for 4-4.5 miles', () => {
      expect(pricingService.calculateDeliveryFee(4.2)).toBe(6.55);
      expect(pricingService.calculateDeliveryFee(4.5)).toBe(6.55);
    });

    test('should return correct delivery fee for 4.5-5 miles', () => {
      expect(pricingService.calculateDeliveryFee(4.8)).toBe(7.10);
      expect(pricingService.calculateDeliveryFee(5)).toBe(7.10);
    });

    test('should return highest tier for distances over 5 miles', () => {
      expect(pricingService.calculateDeliveryFee(6)).toBe(7.10);
      expect(pricingService.calculateDeliveryFee(10)).toBe(7.10);
    });

    test('should return 0 for invalid distances', () => {
      expect(pricingService.calculateDeliveryFee(0)).toBe(0);
      expect(pricingService.calculateDeliveryFee(-1)).toBe(0);
    });
  });

  describe('calculateServiceCharge', () => {
    test('should calculate service charge for 0-2 miles (6%)', () => {
      expect(pricingService.calculateServiceCharge(1, 20)).toBe(1.50); // 20 * 0.06 = 1.20, capped at minimum 1.50
      expect(pricingService.calculateServiceCharge(2, 50)).toBe(3.00); // 50 * 0.06 = 3.00 (above minimum)
    });

    test('should calculate service charge for 2-3 miles (7%)', () => {
      expect(pricingService.calculateServiceCharge(2.5, 20)).toBe(1.50); // 20 * 0.07 = 1.40, capped at minimum 1.50
      expect(pricingService.calculateServiceCharge(3, 50)).toBeCloseTo(3.50, 2); // 50 * 0.07 = 3.50 (above minimum)
    });

    test('should calculate service charge for 3-4 miles (7%)', () => {
      expect(pricingService.calculateServiceCharge(3.5, 20)).toBe(1.50); // 20 * 0.07 = 1.40, capped at minimum 1.50
      expect(pricingService.calculateServiceCharge(4, 50)).toBeCloseTo(3.50, 2); // 50 * 0.07 = 3.50 (above minimum)
    });

    test('should calculate service charge for 4-5 miles (8%)', () => {
      expect(pricingService.calculateServiceCharge(4.5, 20)).toBe(1.60); // 20 * 0.08
      expect(pricingService.calculateServiceCharge(5, 50)).toBe(4.00); // 50 * 0.08
    });

    test('should apply minimum service charge cap', () => {
      expect(pricingService.calculateServiceCharge(1, 10)).toBe(1.50); // 10 * 0.06 = 0.60, capped at 1.50
      expect(pricingService.calculateServiceCharge(2, 5)).toBe(1.50); // 5 * 0.06 = 0.30, capped at 1.50
    });

    test('should return 0 for invalid inputs', () => {
      expect(pricingService.calculateServiceCharge(0, 20)).toBe(0);
      expect(pricingService.calculateServiceCharge(-1, 20)).toBe(0);
      expect(pricingService.calculateServiceCharge(1, 0)).toBe(0);
      expect(pricingService.calculateServiceCharge(1, -5)).toBe(0);
    });
  });

  describe('calculateSmallOrderFee', () => {
    test('should return correct small order fee for 0-1 miles', () => {
      expect(pricingService.calculateSmallOrderFee(0.5)).toBe(2.77);
      expect(pricingService.calculateSmallOrderFee(1)).toBe(2.77);
    });

    test('should return correct small order fee for 1-2 miles', () => {
      expect(pricingService.calculateSmallOrderFee(1.5)).toBe(3.77);
      expect(pricingService.calculateSmallOrderFee(2)).toBe(3.77);
    });

    test('should return correct small order fee for 2-3 miles', () => {
      expect(pricingService.calculateSmallOrderFee(2.5)).toBe(4.99);
      expect(pricingService.calculateSmallOrderFee(3)).toBe(4.99);
    });

    test('should return correct small order fee for 3-4 miles', () => {
      expect(pricingService.calculateSmallOrderFee(3.5)).toBe(5.50);
      expect(pricingService.calculateSmallOrderFee(4)).toBe(5.50);
    });

    test('should return correct small order fee for 4-5 miles', () => {
      expect(pricingService.calculateSmallOrderFee(4.5)).toBe(5.99);
      expect(pricingService.calculateSmallOrderFee(5)).toBe(5.99);
    });

    test('should return highest tier for distances over 5 miles', () => {
      expect(pricingService.calculateSmallOrderFee(6)).toBe(5.99);
      expect(pricingService.calculateSmallOrderFee(10)).toBe(5.99);
    });

    test('should return 0 for invalid distances', () => {
      expect(pricingService.calculateSmallOrderFee(0)).toBe(0);
      expect(pricingService.calculateSmallOrderFee(-1)).toBe(0);
    });
  });

  describe('calculateOrderPricing', () => {
    test('should calculate complete pricing for regular order', () => {
      const result = pricingService.calculateOrderPricing(2, 25, false);

      expect(result.distance).toBe(2);
      expect(result.subtotal).toBe(25);
      expect(result.isSmallOrder).toBe(false);
      expect(result.fees.delivery).toBe(4.40);
      expect(result.fees.service).toBe(1.50); // 25 * 0.06 = 1.50 (minimum cap)
      expect(result.fees.smallOrder).toBe(0);
      expect(result.totalFees).toBe(5.90);
      expect(result.grandTotal).toBe(30.90);
    });

    test('should calculate complete pricing for small order', () => {
      const result = pricingService.calculateOrderPricing(1, 12, true);

      expect(result.distance).toBe(1);
      expect(result.subtotal).toBe(12);
      expect(result.isSmallOrder).toBe(true);
      expect(result.fees.delivery).toBe(3.45);
      expect(result.fees.service).toBe(1.50); // 12 * 0.06 = 0.72, capped at 1.50
      expect(result.fees.smallOrder).toBe(2.77);
      expect(result.totalFees).toBeCloseTo(7.72, 2);
      expect(result.grandTotal).toBeCloseTo(19.72, 2);
    });

    test('should handle edge cases', () => {
      const result = pricingService.calculateOrderPricing(0.5, 5, true);

      expect(result.distance).toBe(0.5);
      expect(result.subtotal).toBe(5);
      expect(result.isSmallOrder).toBe(true);
      expect(result.fees.delivery).toBe(3.45);
      expect(result.fees.service).toBe(1.50); // 5 * 0.06 = 0.30, capped at 1.50
      expect(result.fees.smallOrder).toBe(2.77);
      expect(result.totalFees).toBeCloseTo(7.72, 2);
      expect(result.grandTotal).toBeCloseTo(12.72, 2);
    });
  });

  describe('getPricingPreview', () => {
    test('should automatically detect small orders under £15', () => {
      const result = pricingService.getPricingPreview(2, 12);
      expect(result.isSmallOrder).toBe(true);
      expect(result.fees.smallOrder).toBe(3.77);
    });

    test('should not apply small order fee for orders £15 and above', () => {
      const result = pricingService.getPricingPreview(2, 15);
      expect(result.isSmallOrder).toBe(false);
      expect(result.fees.smallOrder).toBe(0);
    });

    test('should not apply small order fee for orders over £15', () => {
      const result = pricingService.getPricingPreview(2, 20);
      expect(result.isSmallOrder).toBe(false);
      expect(result.fees.smallOrder).toBe(0);
    });
  });

  describe('validation methods', () => {
    describe('isValidDistance', () => {
      test('should validate distance range', () => {
        expect(pricingService.isValidDistance(0)).toBe(true);
        expect(pricingService.isValidDistance(25)).toBe(true);
        expect(pricingService.isValidDistance(50)).toBe(true);
        expect(pricingService.isValidDistance(-1)).toBe(false);
        expect(pricingService.isValidDistance(50.1)).toBe(false);
      });

      test('should validate distance type', () => {
        expect(pricingService.isValidDistance(5)).toBe(true);
        expect(pricingService.isValidDistance('5')).toBe(false);
        expect(pricingService.isValidDistance(null)).toBe(false);
        expect(pricingService.isValidDistance(undefined)).toBe(false);
      });
    });

    describe('isValidSubtotal', () => {
      test('should validate subtotal range', () => {
        expect(pricingService.isValidSubtotal(0)).toBe(true);
        expect(pricingService.isValidSubtotal(100)).toBe(true);
        expect(pricingService.isValidSubtotal(-1)).toBe(false);
      });

      test('should validate subtotal type', () => {
        expect(pricingService.isValidSubtotal(25)).toBe(true);
        expect(pricingService.isValidSubtotal('25')).toBe(false);
        expect(pricingService.isValidSubtotal(null)).toBe(false);
        expect(pricingService.isValidSubtotal(undefined)).toBe(false);
      });
    });
  });
});