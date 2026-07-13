// Simple script to insert basic merchants data
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function insertBasicMerchants() {
  try {
    console.log('🚀 Inserting basic merchant data...');

    // Insert La Damas
    await prisma.merchants.upsert({
      where: { Grubsy_Partner_ID: 'G-0001' },
      update: {},
      create: {
        id: 'merchant-001',
        Grubsy_Partner_ID: 'G-0001',
        merchants_name: 'La Damas',
        Description: 'Authentic cuisine experience',
        Cuisine: 'Mediterranean',
        Address: 'High Street, Slough',
        Area: 'Slough Central',
        PostCode: 'SL1 1AA',
        Hygiene_Rating: '4',
        Opening_Times: '11:00-23:00',
        Halal_Friendly: 'Yes',
        Photo: '',
        Booking_Available: 'Yes',
        Active: 'Yes',
        Owner_Email: 'ladamas@grubsy.co.uk',
        Created_at: new Date().toISOString(),
        Owners_Name: 'Owner',
        Owners_number: '+44123456789',
        Establishments_Enrolement_Status: 'Active',
        Establishment_Fee_Per_Order: '2.50'
      }
    });

    // Insert Big Boys Kitchen
    await prisma.merchants.upsert({
      where: { Grubsy_Partner_ID: 'G-0002' },
      update: {},
      create: {
        id: 'merchant-002',
        Grubsy_Partner_ID: 'G-0002',
        merchants_name: 'Big Boys Kitchen',
        Description: 'Hearty meals and comfort food',
        Cuisine: 'British',
        Address: '123 Main Street, Slough',
        Area: 'Slough West',
        PostCode: 'SL1 2BB',
        Hygiene_Rating: '5',
        Opening_Times: '10:00-22:00',
        Halal_Friendly: 'No',
        Photo: '',
        Booking_Available: 'No',
        Active: 'Yes',
        Owner_Email: 'bigboys@grubsy.co.uk',
        Created_at: new Date().toISOString(),
        Owners_Name: 'Owner',
        Owners_number: '+44123456790',
        Establishments_Enrolement_Status: 'Active',
        Establishment_Fee_Per_Order: '2.50'
      }
    });

    // Insert Dodgers Dubai Droids
    await prisma.merchants.upsert({
      where: { Grubsy_Partner_ID: 'G-0003' },
      update: {},
      create: {
        id: 'merchant-003',
        Grubsy_Partner_ID: 'G-0003',
        merchants_name: 'Dodgers Dubai Droids',
        Description: 'Classic American diner experience',
        Cuisine: 'American Diner',
        Address: '456 High Street, Slough',
        Area: 'Slough East',
        PostCode: 'SL1 3CC',
        Hygiene_Rating: '5',
        Opening_Times: '10:00-22:00',
        Halal_Friendly: 'No',
        Photo: '',
        Booking_Available: 'No',
        Active: 'Yes',
        Owner_Email: 'dodgers@grubsy.co.uk',
        Created_at: new Date().toISOString(),
        Owners_Name: 'Owner',
        Owners_number: '+44123456791',
        Establishments_Enrolement_Status: 'Active',
        Establishment_Fee_Per_Order: '2.50'
      }
    });

    // Insert Edens Eggs
    await prisma.merchants.upsert({
      where: { Grubsy_Partner_ID: 'G-0004' },
      update: {},
      create: {
        id: 'merchant-004',
        Grubsy_Partner_ID: 'G-0004',
        merchants_name: 'Edens Eggs',
        Description: 'Fresh breakfast and egg dishes',
        Cuisine: 'Breakfast',
        Address: '789 Windsor Road, Slough',
        Area: 'Slough South',
        PostCode: 'SL1 4DD',
        Hygiene_Rating: '4',
        Opening_Times: '07:00-15:00',
        Halal_Friendly: 'Yes',
        Photo: '',
        Booking_Available: 'Yes',
        Active: 'Yes',
        Owner_Email: 'edens@grubsy.co.uk',
        Created_at: new Date().toISOString(),
        Owners_Name: 'Owner',
        Owners_number: '+44123456792',
        Establishments_Enrolement_Status: 'Active',
        Establishment_Fee_Per_Order: '2.50'
      }
    });

    // Update merchants with photo filenames
    console.log('📸 Updating merchants with photo filenames...');

    await prisma.merchants.update({
      where: { Grubsy_Partner_ID: 'G-0001' },
      data: { Photo: 'Grb-0001.jpg' }
    });

    await prisma.merchants.update({
      where: { Grubsy_Partner_ID: 'G-0002' },
      data: { Photo: 'Grb-0002.jpg' }
    });

    console.log('✅ Successfully inserted 4 merchants');
    console.log('✅ La Damas (Mediterranean) - Photo: Grb-0001.jpg');
    console.log('✅ Big Boys Kitchen (British) - Photo: Grb-0002.jpg');
    console.log('✅ Dodgers Dubai Droids (American Diner) - No photo');
    console.log('✅ Edens Eggs (Breakfast) - No photo');

  } catch (error) {
    console.error('❌ Error inserting merchants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertBasicMerchants();