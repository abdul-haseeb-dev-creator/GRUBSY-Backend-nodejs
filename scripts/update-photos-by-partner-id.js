// Script to update photos using Partner ID naming system
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updatePhotosByPartnerId() {
  try {
    console.log('📷 Updating restaurant photos by Partner ID...');

    // Update photos using Partner ID naming convention
    const updates = [
      {
        partnerId: 'G-0001',
        name: 'La Damas',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/G-0001.jpg'
      },
      {
        partnerId: 'G-0002', 
        name: 'Big Boys Kitchen',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/G-0002.jpg'
      },
      {
        partnerId: 'G-0003',
        name: 'Dodgers Dubai Droids',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/G-0003.jpg'
      },
      {
        partnerId: 'G-0004',
        name: 'Edens Eggs',
        photoUrl: 'http://192.168.1.29:3002/uploads/restaurants/G-0004.jpg'
      }
    ];

    for (const update of updates) {
      await prisma.Merchants.update({
        where: { Grubsy_Partner_ID: update.partnerId },
        data: { Photo: update.photoUrl }
      });
      console.log(`✅ ${update.name} (${update.partnerId}) photo updated`);
    }

    console.log('🎉 All restaurant photos updated using Partner ID system!');
    console.log('📋 Your photos should be named:');
    console.log('   G-0001.jpg → La Damas');
    console.log('   G-0002.jpg → Big Boys Kitchen');  
    console.log('   G-0003.jpg → Dodgers Dubai Droids');
    console.log('   G-0004.jpg → Edens Eggs');

  } catch (error) {
    console.error('❌ Error updating photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePhotosByPartnerId();