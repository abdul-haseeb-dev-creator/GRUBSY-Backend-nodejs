// Script to update database with your own restaurant photos
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateWithYourPhotos() {
  try {
    console.log('📷 Updating restaurants with your photos...');

    // Update La Damas - Mediterranean (G-0001)
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0001' },
      data: {
        Photo: 'http://192.168.1.29:3002/uploads/restaurants/la-damas.jpg'
      }
    });
    console.log('✅ La Damas photo updated');

    // Update Big Boys Kitchen - British (G-0002)  
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0002' },
      data: {
        Photo: 'http://192.168.1.29:3002/uploads/restaurants/big-boys-kitchen.jpg'
      }
    });
    console.log('✅ Big Boys Kitchen photo updated');

    // Update Dodgers Dubai Droids - American Diner (G-0003)
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0003' },
      data: {
        Photo: 'http://192.168.1.29:3002/uploads/restaurants/dodgers-dubai-droids.jpg'
      }
    });
    console.log('✅ Dodgers Dubai Droids photo updated');

    // Update Edens Eggs - Breakfast (G-0004)
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0004' },
      data: {
        Photo: 'http://192.168.1.29:3002/uploads/restaurants/edens-eggs.jpg'
      }
    });
    console.log('✅ Edens Eggs photo updated');

    console.log('🎉 All restaurant photos updated with your images!');

  } catch (error) {
    console.error('❌ Error updating photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWithYourPhotos();