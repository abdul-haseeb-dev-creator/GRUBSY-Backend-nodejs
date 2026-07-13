const request = require('supertest');
const express = require('express');

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    merchants: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn().mockResolvedValue(true),
    $disconnect: jest.fn().mockResolvedValue(true),
  })),
}));

describe('Merchants Controller (Prisma-based)', () => {
  let app;
  let mockPrisma;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Use the new Prisma-based API routes
    app.use('/api/merchants', require('../../../src/api'));
    
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('GET /api/merchants', () => {
    it('should return all active merchants', async () => {
      const mockMerchants = [
        {
          id: '1',
          Merchants_Name: 'Test Restaurant',
          Address: '123 Test St',
          Cuisine: 'Italian',
          Active: 'Yes',
        },
      ];

      mockPrisma.merchants.findMany.mockResolvedValue(mockMerchants);

      const response = await request(app)
        .get('/api/merchants')
        .expect(200);

      expect(mockPrisma.merchants.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { Active: 'Yes' },
            { Active: 'Active' },
            { Active: 'active' }
          ]
        },
        select: expect.any(Object),
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.merchants.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/merchants')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/merchants/:id', () => {
    it('should return a specific merchant', async () => {
      const mockMerchant = {
        id: '1',
        merchants_name: 'Test Restaurant',
        Address: '123 Test St',
        Cuisine: 'Italian',
        Active: 'Yes',
      };

      mockPrisma.merchants.findUnique.mockResolvedValue(mockMerchant);

      const response = await request(app)
        .get('/api/merchants/1')
        .expect(200);

      expect(mockPrisma.merchants.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
    });

    it('should handle non-existent merchant', async () => {
      mockPrisma.merchants.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/merchants/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});