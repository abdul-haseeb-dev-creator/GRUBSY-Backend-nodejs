// Import merchants data from CSV file
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function importMerchantsFromCSV() {
  try {
    console.log('📥 Starting merchants import from CSV...');

    // Read CSV file
    const csvPath = path.join(__dirname, '../exports/establishments-data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');

    // Parse CSV (skip header row)
    const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

    console.log(`📊 Found ${lines.length} merchants in CSV`);

    let importedCount = 0;

    for (const line of lines) {
      try {
        // Parse CSV line (simple parsing, assuming no commas in fields)
        const fields = line.split(',');

        if (fields.length < 21) continue; // Skip incomplete lines

        const merchantData = {
          id: fields[0].trim(),
          Grubsy_Partner_ID: fields[1].trim(),
          merchants_name: fields[2].trim(),
          Description: fields[3].trim() || null,
          Cuisine: fields[4].trim() || null,
          Address: fields[5].trim() || null,
          Area: fields[6].trim() || null,
          PostCode: fields[7].trim() || null,
          Hygiene_Rating: fields[8].trim() || null,
          Opening_Times: fields[9].trim() || null,
          Halal_Friendly: fields[10].trim() || null,
          Photo: fields[11].trim() || null,
          Booking_Available: fields[12].trim() || null,
          Relation: fields[13].trim() || null,
          Active: fields[14].trim() || null,
          Owner_Email: fields[15].trim() || null,
          Created_at: fields[16].trim() || null,
          Owners_Name: fields[17].trim() || null,
          Owners_number: fields[18].trim() || null,
          Establishments_Enrolement_Status: fields[19].trim() || null,
          Establishment_Fee_Per_Order: fields[20].trim() || null,
        };

        // Insert or update merchant
        await prisma.merchants.upsert({
          where: { Grubsy_Partner_ID: merchantData.Grubsy_Partner_ID },
          update: merchantData,
          create: merchantData,
        });

        importedCount++;
        console.log(`✅ Imported merchant: ${merchantData.merchants_name} (${merchantData.Grubsy_Partner_ID})`);

      } catch (error) {
        console.error('❌ Error importing merchant:', error.message);
      }
    }

    console.log(`\n🎉 Successfully imported ${importedCount} merchants from CSV`);

    // Verify import
    const totalMerchants = await prisma.merchants.count();
    console.log(`📊 Total merchants in database: ${totalMerchants}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importMerchantsFromCSV();