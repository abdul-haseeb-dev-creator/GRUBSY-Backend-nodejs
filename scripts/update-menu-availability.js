// Script to update Menu_Items availability for Grb-0001 to 'Yes'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMenuAvailability() {
  try {
    console.log('🔄 Updating menu item availability for Grb-0001...');
    
    const result = await prisma.Menu_Items.updateMany({
      where: {
        Grubsy_Partner_ID: 'Grb-0001'
      },
      data: {
        Available: 'Yes'
      }
    });
    
    console.log(`✅ Updated ${result.count} menu items for Grb-0001`);
    console.log('🍽️ All menu items for La Damas are now available!');
    
  } catch (error) {
    console.error('❌ Error updating menu availability:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMenuAvailability();