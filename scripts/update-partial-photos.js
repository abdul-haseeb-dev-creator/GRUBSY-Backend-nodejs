// Script to update photos for available restaurants (Grb-0001, Grb-0002)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updatePartialPhotos() {
  try {
    console.log('📷 Updating available restaurant photos...');

    // Update only the photos that are available
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
      }
    ];

    for (const update of updates) {
      await prisma.merchants.update({
        where: { Grubsy_Partner_ID: update.partnerId },
        data: { Photo: update.photoUrl }
      });
      console.log(`✅ ${update.name} (${update.partnerId}) - ${update.cuisine} photo updated`);
    }

    console.log('🎉 Available restaurant photos updated!');
    console.log('📋 Photos added:');
    console.log('   Grb-0001.jpg → La Damas (Syrian)');
    console.log('   Grb-0002.jpg → Big Boys Kitchen (Burgers)');
    console.log('📝 Still needed:');
    console.log('   Grb-0003.jpg → Dodgers Dubai Droids (Deserts)');
    console.log('   Grb-0004.jpg → Edens Eggs (Sandwichs)');

  } catch (error) {
    console.error('❌ Error updating photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePartialPhotos();