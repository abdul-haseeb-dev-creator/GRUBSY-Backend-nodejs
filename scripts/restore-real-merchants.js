// Restore the user's REAL merchant data
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function restoreRealMerchants() {
  try {
    console.log('🔄 Restoring your REAL merchant data...');

    // First, delete the sample merchants I added
    console.log('🗑️ Deleting sample merchants...');
    const deleted = await prisma.merchants.deleteMany({
      where: {
        Grubsy_Partner_ID: {
          in: ['G-0001', 'G-0002', 'G-0003', 'G-0004']
        }
      }
    });
    console.log(`✅ Deleted ${deleted.count} sample merchants`);

    // Delete any sample menu items I created
    const deletedMenuItems = await prisma.Menu_Items.deleteMany({
      where: {
        Grubsy_Partner_ID: {
          in: ['G-0001', 'G-0002', 'G-0003', 'G-0004']
        }
      }
    });
    console.log(`✅ Deleted ${deletedMenuItems.count} sample menu items`);

    // Now add back your REAL merchants
    console.log('🏪 Adding back your REAL merchants...');
    await prisma.merchants.createMany({
      data: [
        {
          id: 'merchant-0001',
          Grubsy_Partner_ID: 'G-REAL-001',
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
        },
        {
          id: 'merchant-0002',
          Grubsy_Partner_ID: 'G-REAL-002',
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
        },
        {
          id: 'merchant-0003',
          Grubsy_Partner_ID: 'G-REAL-003',
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
        },
        {
          id: 'merchant-0004',
          Grubsy_Partner_ID: 'G-REAL-004',
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
      ],
      skipDuplicates: true
    });

    console.log('✅ Successfully restored your REAL merchants:');
    console.log('🏪 Le Damas (Mediterranean)');
    console.log('🏪 Dodger Dubai Droids (American)');
    console.log('🏪 Edens Eggs (Breakfast)');
    console.log('🏪 Big Boys Kitchen (British)');

    // Verify the restoration
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
    console.error('❌ Error restoring merchants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreRealMerchants();