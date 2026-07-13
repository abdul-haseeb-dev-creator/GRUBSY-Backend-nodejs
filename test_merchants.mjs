import { PrismaClient } from '@prisma/client';

async function testMerchants() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking merchants in database...');
    
    const merchants = await prisma.merchants.findMany({
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Active: true
      }
    });
    
    console.log(`✅ Found ${merchants.length} merchants:`);
    merchants.forEach(m => {
      console.log(`  - ID: ${m.id}, Partner: ${m.Grubsy_Partner_ID}, Name: ${m.Merchants_Name}, Active: ${m.Active}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking merchants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMerchants();
