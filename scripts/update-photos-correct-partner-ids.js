// Script to update photos using CORRECT Partner IDs from API
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updatePhotosCorrectPartnerIds() {
  try {
    console.log('📷 Updating restaurant photos with CORRECT Partner IDs...');

    // Update photos using the actual Partner IDs from the API
    const updates = [
      {
        partnerId: 'Grb-0001',
        name: 'La Damas',
        cuisine: 'Syrian',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/Grb-0001.jpg'
      },
      {
        partnerId: 'Grb-0002', 
        name: 'Big Boys Kitchen',
        cuisine: 'Burgers',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/Grb-0002.jpg'
      },
      {
        partnerId: 'Grb-0003',
        name: 'Dodgers Dubai Droids',
        cuisine: 'Deserts',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/Grb-0003.jpg'
      },
      {
        partnerId: 'Grb-0004',
        name: 'Edens Eggs',
        cuisine: 'Sandwichs',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/Grb-0004.jpg'
      }
    ];

    for (const update of updates) {
      await prisma.merchants.update({
        where: { Grubsy_Partner_ID: update.partnerId },
        data: { Photo: update.photoUrl }
      });
      console.log(`✅ ${update.name} (${update.partnerId}) - ${update.cuisine} photo updated`);
    }

    console.log('🎉 All restaurant photos updated with CORRECT Partner IDs!');
    console.log('📋 Your photos should be named:');
    console.log('   Grb-0001.jpg → La Damas (Syrian)');
    console.log('   Grb-0002.jpg → Big Boys Kitchen (Burgers)');  
    console.log('   Grb-0003.jpg → Dodgers Dubai Droids (Deserts)');
    console.log('   Grb-0004.jpg → Edens Eggs (Sandwichs)');

  } catch (error) {
    console.error('❌ Error updating photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePhotosCorrectPartnerIds();