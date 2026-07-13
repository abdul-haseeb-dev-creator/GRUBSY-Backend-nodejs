import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restoreMerchantsData() {
  try {
    console.log('🚀 Starting merchants data restoration...');

    // Read the establishments CSV file
    const csvPath = path.join(process.cwd(), 'exports/establishments-data.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');

    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    console.log(`📊 Found ${lines.length - 1} establishments in CSV`);
    console.log('Headers:', headers);

    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      // Map old establishments fields to new merchants fields
      const merchantData = {
        id: values[0] || `merchant_${Date.now()}_${i}`,
        Grubsy_Partner_ID: values[1] || `PARTNER_${i}`,
        merchants_name: values[2] || 'Unknown Restaurant',
        Description: values[3] || '',
        Cuisine: values[4] || 'Mixed',
        Address: values[5] || 'Address not provided',
        Area: values[6] || '',
        PostCode: values[7] || '',
        Hygiene_Rating: values[8] || '5',
        Opening_Times: values[9] || 'Mon-Sun: 10:00-22:00',
        Halal_Friendly: values[10] || 'No',
        Photo: values[11] || null,
        Booking_Available: values[12] || 'No',
        Relation: values[13] || '',
        Active: values[14] || 'Yes',
        Owner_Email: values[15] || '',
        Created_at: values[16] || new Date().toISOString(),
        Owners_Name: values[17] || '',
        Owners_number: values[18] || '',
        Establishments_Enrolement_Status: 'Active',
        Establishment_Fee_Per_Order: '0.50'
      };

      try {
        // Use upsert to handle duplicates
        await prisma.merchants.upsert({
          where: { Grubsy_Partner_ID: merchantData.Grubsy_Partner_ID },
          update: merchantData,
          create: merchantData
        });

        console.log(`✅ Imported: ${merchantData.merchants_name}`);
        importedCount++;
      } catch (error) {
        console.log(`⚠️ Skipped: ${merchantData.merchants_name} (${error.message})`);
        skippedCount++;
      }
    }

    console.log(`\n🎯 Restoration complete!`);
    console.log(`✅ Imported: ${importedCount} merchants`);
    console.log(`⚠️ Skipped: ${skippedCount} merchants`);

  } catch (error) {
    console.error('❌ Restoration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreMerchantsData();