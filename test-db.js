// Quick test to check database connection and merchants
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check merchants table
    console.log('🔍 Checking merchants table...');
    const merchants = await prisma.merchants.findMany({
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Cuisine: true,
        Active: true,
      },
      take: 5
    });

    console.log(`✅ Found ${merchants.length} merchants in database`);
    if (merchants.length > 0) {
      console.log('📋 Sample merchants:');
      merchants.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.Merchants_Name} (${m.Grubsy_Partner_ID}) - ${m.Cuisine} - Active: ${m.Active}`);
      });
    }

    // Check cuisines
    console.log('🔍 Checking available cuisines...');
    const cuisines = await prisma.merchants.findMany({
      where: {
        Cuisine: { not: null },
        Active: { in: ['Yes', 'Active', 'active'] }
      },
      select: {
        Cuisine: true,
      },
      distinct: ['Cuisine']
    });

    console.log(`✅ Found ${cuisines.length} unique cuisines:`);
    cuisines.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.Cuisine}`);
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();