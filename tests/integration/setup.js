// Integration test setup
// const request = require('supertest'); // Uncomment when needed for integration tests

// Mock external services - Prisma-based
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    merchants: {
      create: jest.fn().mockResolvedValue({ success: true }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    $connect: jest.fn().mockResolvedValue(true),
    $disconnect: jest.fn().mockResolvedValue(true),
  })),
  updateEstablishment: jest.fn().mockResolvedValue({ success: true }),
  getEstablishments: jest.fn().mockResolvedValue([]),
  createEstablishment: jest.fn().mockResolvedValue({
    success: true,
    id: 'test-establishment-id',
  }),
  getEstablishmentById: jest.fn().mockImplementation((id) => {
    if (id === 'test-establishment-id') {
      return Promise.resolve({
        id: 'test-establishment-id',
        name: 'Integration Test Restaurant',
        address: '123 Integration St',
        phone: '555-0123',
        email: 'integration@test.com',
      });
    }
    return Promise.resolve(null);
  }),
  deleteEstablishment: jest.fn().mockResolvedValue({ success: true }),
  getMenu: jest.fn().mockResolvedValue([]),
  updateMenuItemAvailability: jest.fn().mockResolvedValue({ success: true }),
  getOrdersForEstablishment: jest.fn().mockResolvedValue([]),
  updateMenu: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock JWT verification for authentication tests
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com' }),
}));

// Setup test database or mock data
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  // Clean up test database or mock services
  // Example: await db.disconnect();
  // If you start a test server, close it here
  // If you use any global resources, release them here
  console.log('Cleaning up integration test environment...');
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  jest.resetModules();
});

afterEach(() => {
  jest.clearAllMocks();
});