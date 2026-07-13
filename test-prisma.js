import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testPrismaConnection() {
  try {
    console.log('🔍 Testing Prisma connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // Test merchant query
    console.log('🏪 Testing merchants query...');
    const merchants = await prisma.merchants.findMany({
      where: {
        OR: [
          { Active: 'Yes' },
          { Active: 'Active' },
          { Active: 'active' }
        ]
      },
      select: {
        id: true,
        Merchants_Name: true,
        Cuisine: true,
        Active: true,
      },
      take: 5
    });
    
    console.log(`✅ Found ${merchants.length} merchants:`);
    merchants.forEach(m => {
      console.log(`  - ${m.Merchants_Name} (${m.Cuisine}) - Active: ${m.Active}`);
    });
    
  } catch (error) {
    console.error('❌ Prisma connection error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma disconnected');
  }
}

testPrismaConnection();