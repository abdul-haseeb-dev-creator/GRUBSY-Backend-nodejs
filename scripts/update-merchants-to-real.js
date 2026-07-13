// Update the sample merchants to your REAL data (instead of delete/create)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateMerchantsToReal() {
  try {
    console.log('🔄 Updating sample merchants to your REAL data...');

    // Update merchant G-0001 to Le Damas
    await prisma.merchants.update({
      where: { Grubsy_Partner_ID: 'G-0001' },
      data: {
        merchants_name: 'Le Damas',
        Description: 'Authentic Mediterranean cuisine',
        Cuisine: 'Mediterranean',
        Address: '123 Main Street, Slough',
        Area: 'Slough Central',
        PostCode: 'SL1 1AA',
        Hygiene_Rating: '4',
        Opening_Times: '11:00-23:00',
        Halal_Friendly: 'Yes',
        Photo: 'le-damas.jpg',
        Booking_Available: 'Yes',
        Active: 'Yes'
      }
    });

    // Update merchant G-0002 to Dodger Dubai Droids
    await prisma.merchants.update({
      where: { Grubsy_Partner_ID: 'G-0002' },
      data: {
        merchants_name: 'Dodger Dubai Droids',
        Description: 'American diner experience',
        Cuisine: 'American',
        Address: '456 High Street, Slough',
        Area: 'Slough Central',
        PostCode: 'SL1 2BB',
        Hygiene_Rating: '5',
        Opening_Times: '10:00-22:00',
        Halal_Friendly: 'No',
        Photo: 'dodger-dubai.jpg',
        Booking_Available: 'Yes',
        Active: 'Yes'
      }
    });

    // Update merchant G-0003 to Edens Eggs
    await prisma.merchants.update({
      where: { Grubsy_Partner_ID: 'G-0003' },
      data: {
        merchants_name: 'Edens Eggs',
        Description: 'Fresh breakfast and brunch',
        Cuisine: 'Breakfast',
        Address: '789 Park Road, Slough',
        Area: 'Slough Central',
        PostCode: 'SL1 3CC',
        Hygiene_Rating: '4',
        Opening_Times: '07:00-15:00',
        Halal_Friendly: 'Yes',
        Photo: 'edens-eggs.jpg',
        Booking_Available: 'No',
        Active: 'Yes'
      }
    });

    // Update merchant G-0004 to Big Boys Kitchen
    await prisma.merchants.update({
      where: { Grubsy_Partner_ID: 'G-0004' },
      data: {
        merchants_name: 'Big Boys Kitchen',
        Description: 'Traditional British cuisine',
        Cuisine: 'British',
        Address: '321 Queen Street, Slough',
        Area: 'Slough Central',
        PostCode: 'SL1 4DD',
        Hygiene_Rating: '4',
        Opening_Times: '12:00-21:00',
        Halal_Friendly: 'No',
        Photo: 'big-boys.jpg',
        Booking_Available: 'Yes',
        Active: 'Yes'
      }
    });

    console.log('✅ Successfully updated merchants to your REAL data:');
    console.log('🏪 Le Damas (Mediterranean) - G-0001');
    console.log('🏪 Dodger Dubai Droids (American) - G-0002');
    console.log('🏪 Edens Eggs (Breakfast) - G-0003');
    console.log('🏪 Big Boys Kitchen (British) - G-0004');

    // Verify the updates
    const merchants = await prisma.merchants.findMany({
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        merchants_name: true,
        Cuisine: true,
        Photo: true,
        Active: true
      }
    });

    console.log(`\n📊 Current merchants in database: ${merchants.length}`);
    merchants.forEach((merchant, index) => {
      console.log(`${index + 1}. ${merchant.merchants_name} (${merchant.Grubsy_Partner_ID}) - ${merchant.Cuisine} - Photo: ${merchant.Photo || 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error updating merchants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMerchantsToReal();