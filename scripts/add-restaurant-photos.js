// Script to add placeholder photos to restaurants
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addRestaurantPhotos() {
  try {
    console.log('🖼️ Adding restaurant photos...');

    // Update La Damas (Mediterranean) - G-0001
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0001' },
      data: {
        Photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&auto=format'
      }
    });
    console.log('✅ La Damas photo added');

    // Update Big Boys Kitchen (British) - G-0002  
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0002' },
      data: {
        Photo: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&auto=format'
      }
    });
    console.log('✅ Big Boys Kitchen photo added');

    // Update Dodgers Dubai Droids (American Diner) - G-0003
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0003' },
      data: {
        Photo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&auto=format'
      }
    });
    console.log('✅ Dodgers Dubai Droids photo added');

    // Update Edens Eggs (Breakfast) - G-0004
    await prisma.Merchants.update({
      where: { Grubsy_Partner_ID: 'G-0004' },
      data: {
        Photo: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop&auto=format'
      }
    });
    console.log('✅ Edens Eggs photo added');

    console.log('🎉 All restaurant photos added successfully!');

  } catch (error) {
    console.error('❌ Error adding photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRestaurantPhotos();