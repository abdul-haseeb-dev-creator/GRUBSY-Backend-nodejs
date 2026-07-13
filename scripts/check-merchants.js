// Check what merchants exist in the database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMerchants() {
  try {
    console.log('🔍 Checking merchants in database...');

    const merchants = await prisma.merchants.findMany({
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Cuisine: true,
        Photo: true,
        Active: true
      },
      take: 10
    });

    console.log(`✅ Found ${merchants.length} merchants:`);
    merchants.forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.Merchants_Name} (${merchant.Grubsy_Partner_ID}) - ${merchant.Cuisine} - Photo: ${merchant.Photo || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error checking merchants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMerchants();