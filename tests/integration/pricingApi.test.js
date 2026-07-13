import request from 'supertest';
import express from 'express';
import pricingRoutes from '../../routes/pricing.js';

const app = express();
app.use(express.json());
app.use('/api/pricing', pricingRoutes);

describe('Pricing API Integration Tests', () => {
  describe('GET /api/pricing/preview', () => {
    test('should return pricing preview for valid inputs', async () => {
      const response = await request(app)
        .get('/api/pricing/preview?distance=2&subtotal=25')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('distance', 2);
      expect(response.body.data).toHaveProperty('subtotal', 25);
      expect(response.body.data).toHaveProperty('fees');
      expect(response.body.data).toHaveProperty('totalFees');
      expect(response.body.data).toHaveProperty('grandTotal');
      expect(response.body.data).toHaveProperty('breakdown');
    });

    test('should automatically detect small orders under £15', async () => {
      const response = await request(app)
        .get('/api/pricing/preview?distance=2&subtotal=12')
        .expect(200);

      expect(response.body.data.isSmallOrder).toBe(true);
      expect(response.body.data.fees.smallOrder).toBeGreaterThan(0);
    });

    test('should not apply small order fee for orders £15 and above', async () => {
      const response = await request(app)
        .get('/api/pricing/preview?distance=2&subtotal=15')
        .expect(200);

      expect(response.body.data.isSmallOrder).toBe(false);
      expect(response.body.data.fees.smallOrder).toBe(0);
    });

    test('should return error for invalid distance', async () => {
      const response = await request(app)
        .get('/api/pricing/preview?distance=-1&subtotal=25')
        .expect(400);

      expect(response.body.error).toContain('Invalid distance');
    });

    test('should return error for invalid subtotal', async () => {
      const response = await request(app)
        .get('/api/pricing/preview?distance=2&subtotal=-5')
        .expect(400);

      expect(response.body.error).toContain('Invalid subtotal');
    });
  });

  describe('POST /api/pricing/calculate', () => {
    test('should calculate pricing for regular order', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({ distance: 2, subtotal: 25, isSmallOrder: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isSmallOrder).toBe(false);
      expect(response.body.data.fees.smallOrder).toBe(0);
      expect(response.body.data.fees.delivery).toBe(4.40);
      expect(response.body.data.fees.service).toBe(1.50);
    });

    test('should calculate pricing for small order', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({ distance: 1, subtotal: 12, isSmallOrder: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isSmallOrder).toBe(true);
      expect(response.body.data.fees.smallOrder).toBe(2.77);
      expect(response.body.data.fees.delivery).toBe(3.45);
      expect(response.body.data.fees.service).toBe(1.50);
    });

    test('should handle string boolean values', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .send({ distance: 2, subtotal: 12, isSmallOrder: 'true' })
        .expect(200);

      expect(response.body.data.isSmallOrder).toBe(true);
      expect(response.body.data.fees.smallOrder).toBe(3.77);
    });
  });

  describe('GET /api/pricing/delivery-fee', () => {
    test('should return delivery fee for valid distance', async () => {
      const response = await request(app)
        .get('/api/pricing/delivery-fee?distance=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.distance).toBe(2);
      expect(response.body.data.deliveryFee).toBe(4.40);
      expect(response.body.data.formattedFee).toBe('£4.40');
    });

    test('should return error for invalid distance', async () => {
      const response = await request(app)
        .get('/api/pricing/delivery-fee?distance=60')
        .expect(400);

      expect(response.body.error).toContain('Invalid distance');
    });
  });

  describe('GET /api/pricing/service-charge', () => {
    test('should return service charge for valid inputs', async () => {
      const response = await request(app)
        .get('/api/pricing/service-charge?distance=2&subtotal=25')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.distance).toBe(2);
      expect(response.body.data.subtotal).toBe(25);
      expect(response.body.data.serviceCharge).toBe(1.50); // 25 * 0.06, capped at minimum
      expect(response.body.data.formattedCharge).toBe('£1.50');
    });

    test('should apply minimum service charge cap', async () => {
      const response = await request(app)
        .get('/api/pricing/service-charge?distance=1&subtotal=10')
        .expect(200);

      expect(response.body.data.serviceCharge).toBe(1.50); // 10 * 0.06 = 0.60, capped at 1.50
    });
  });

  describe('GET /api/pricing/small-order-fee', () => {
    test('should return small order fee for valid distance', async () => {
      const response = await request(app)
        .get('/api/pricing/small-order-fee?distance=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.distance).toBe(1);
      expect(response.body.data.smallOrderFee).toBe(2.77);
      expect(response.body.data.formattedFee).toBe('£2.77');
    });

    test('should return error for invalid distance', async () => {
      const response = await request(app)
        .get('/api/pricing/small-order-fee?distance=-1')
        .expect(400);

      expect(response.body.error).toContain('Invalid distance');
    });
  });

  describe('Error handling', () => {
    test('should handle missing query parameters', async () => {
      const response = await request(app)
        .get('/api/pricing/preview')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    test('should handle malformed JSON in POST', async () => {
      const response = await request(app)
        .post('/api/pricing/calculate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express should handle malformed JSON
    });
  });
});