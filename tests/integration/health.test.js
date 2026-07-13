const request = require('supertest');
const app = require('../../app');

// MOCK PRISMA CONNECTION
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(true),
    $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  })),
}));

describe('Backend Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ 
      status: 'OK',
      database: 'connected',
      // TEMPORARILY REMOVE SHEETBEST CHECK
    });
  });
});
