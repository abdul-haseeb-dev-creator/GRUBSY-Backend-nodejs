r// Delete the sample merchants I added by mistake
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteSampleMerchants() {
  try {
    console.log('🗑️ Deleting sample merchants I added by mistake...');

    // Delete the sample merchants I created
    const deleted = await prisma.merchants.deleteMany({
      where: {
        Grubsy_Partner_ID: {
          in: ['G-0001', 'G-0002', 'G-0003', 'G-0004']
        }
      }
    });

    console.log(`✅ Deleted ${deleted.count} sample merchants`);

    // Also delete any sample menu items I created
    const deletedMenuItems = await prisma.Menu_Items.deleteMany({
      where: {
        Grubsy_Partner_ID: {
          in: ['G-0001', 'G-0002', 'G-0003', 'G-0004']
        }
      }
    });

    console.log(`✅ Deleted ${deletedMenuItems.count} sample menu items`);

    // Check what merchants remain
    const remaining = await prisma.merchants.findMany({
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Cuisine: true,
        Photo: true
      }
    });

    console.log(`📊 Remaining merchants in database: ${remaining.length}`);
    remaining.forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.Merchants_Name} (${merchant.Grubsy_Partner_ID})`);
    });

  } catch (error) {
    console.error('❌ Error deleting sample merchants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteSampleMerchants();