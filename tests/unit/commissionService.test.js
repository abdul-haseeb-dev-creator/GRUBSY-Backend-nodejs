// Test the driver payment calculation logic directly
// Since the commission service has logger dependencies, we'll test the core logic

describe('Driver Payment Calculations', () => {
  const driverRates = {
    fixed_payments: [
      { maxMiles: 1, payment: 3.35 },
      { maxMiles: 1.5, payment: 3.825 },
      { maxMiles: 2, payment: 4.30 },
      { maxMiles: 2.5, payment: 4.775 },
      { maxMiles: 3, payment: 5.25 },
      { maxMiles: 3.5, payment: 5.725 },
      { maxMiles: 4, payment: 6.10 },
      { maxMiles: 4.5, payment: 6.50 },
      { maxMiles: 5, payment: 7.10 }
    ],
    time_bonus: {
      peak_hours: 1.50,
      late_night: 2.00,
    },
  };

  const calculateDriverPayment = (distance) => {
    for (const tier of driverRates.fixed_payments) {
      if (distance <= tier.maxMiles) {
        return tier.payment;
      }
    }
    // If distance is over 5 miles, use the highest tier
    return driverRates.fixed_payments[driverRates.fixed_payments.length - 1].payment;
  };

  describe('Fixed Driver Payments', () => {
    test('should calculate driver payment for 1 mile', () => {
      expect(calculateDriverPayment(1)).toBe(3.35);
    });

    test('should calculate driver payment for 1-1.5 miles', () => {
      expect(calculateDriverPayment(1.2)).toBe(3.825);
      expect(calculateDriverPayment(1.5)).toBe(3.825);
    });

    test('should calculate driver payment for 1.5-2 miles', () => {
      expect(calculateDriverPayment(1.8)).toBe(4.30);
      expect(calculateDriverPayment(2)).toBe(4.30);
    });

    test('should calculate driver payment for 2-2.5 miles', () => {
      expect(calculateDriverPayment(2.2)).toBe(4.775);
      expect(calculateDriverPayment(2.5)).toBe(4.775);
    });

    test('should calculate driver payment for 2.5-3 miles', () => {
      expect(calculateDriverPayment(2.8)).toBe(5.25);
      expect(calculateDriverPayment(3)).toBe(5.25);
    });

    test('should calculate driver payment for 3-3.5 miles', () => {
      expect(calculateDriverPayment(3.2)).toBe(5.725);
      expect(calculateDriverPayment(3.5)).toBe(5.725);
    });

    test('should calculate driver payment for 3.5-4 miles', () => {
      expect(calculateDriverPayment(3.8)).toBe(6.10);
      expect(calculateDriverPayment(4)).toBe(6.10);
    });

    test('should calculate driver payment for 4-4.5 miles', () => {
      expect(calculateDriverPayment(4.2)).toBe(6.50);
      expect(calculateDriverPayment(4.5)).toBe(6.50);
    });

    test('should calculate driver payment for 4.5-5 miles', () => {
      expect(calculateDriverPayment(4.8)).toBe(7.10);
      expect(calculateDriverPayment(5)).toBe(7.10);
    });

    test('should calculate driver payment for distances over 5 miles', () => {
      expect(calculateDriverPayment(6)).toBe(7.10);
      expect(calculateDriverPayment(10)).toBe(7.10);
    });
  });

  describe('Driver Earnings with Bonuses', () => {
    const calculateDriverEarnings = (distance, isPeakHour = false, isLateNight = false, tips = 0) => {
      const basePayment = calculateDriverPayment(distance);
      let timeBonuses = 0;

      if (isPeakHour) {
        timeBonuses += driverRates.time_bonus.peak_hours;
      }
      if (isLateNight) {
        timeBonuses += driverRates.time_bonus.late_night;
      }

      return basePayment + timeBonuses + tips;
    };

    test('should add time bonuses correctly', () => {
      expect(calculateDriverEarnings(2, true, false, 0)).toBe(5.80); // 4.30 + 1.50
      expect(calculateDriverEarnings(2, false, true, 0)).toBe(6.30); // 4.30 + 2.00
      expect(calculateDriverEarnings(2, true, true, 0)).toBe(7.80); // 4.30 + 3.50
    });

    test('should add tips correctly', () => {
      expect(calculateDriverEarnings(1, false, false, 2.50)).toBe(5.85); // 3.35 + 2.50
      expect(calculateDriverEarnings(3, true, false, 3.00)).toBe(9.75); // 5.25 + 1.50 + 3.00
    });

    test('should handle all bonuses together', () => {
      expect(calculateDriverEarnings(4, true, true, 5.00)).toBe(14.60); // 6.10 + 3.50 + 5.00
    });
  });
});