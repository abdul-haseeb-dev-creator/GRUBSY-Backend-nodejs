// Import menu items data from CSV file
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function importMenuItemsFromCSV() {
  try {
    console.log('🍽️ Starting menu items import from CSV...');

    // Read CSV file
    const csvPath = path.join(__dirname, 'menu-items-restore.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');

    // Parse CSV (skip header row)
    const lines = csvContent.split('\n').slice(1).filter(line => line.trim());

    console.log(`📊 Found ${lines.length} menu items in CSV`);

    let importedCount = 0;

    for (const line of lines) {
      try {
        // Parse CSV line (handle commas in quoted fields)
        const fields = parseCSVLine(line);

        if (fields.length < 17) continue; // Skip incomplete lines

        // Find the merchant by Grubsy Partner ID (handle format mismatch)
        let partnerId = fields[2].trim();
        // Convert "Grb-0001" format to "Gbr-0001" format to match merchants
        if (partnerId.startsWith('Grb-')) {
          partnerId = partnerId.replace('Grb-', 'Gbr-');
        }

        const merchant = await prisma.merchants.findUnique({
          where: { Grubsy_Partner_ID: partnerId },
          select: { id: true, Grubsy_Partner_ID: true }
        });

        if (!merchant) {
          console.log(`⚠️ Merchant not found for Partner ID: ${fields[2].trim()}, skipping menu item: ${fields[4].trim()}`);
          continue;
        }

        const menuItemData = {
          Menu_Item_ID: fields[0].trim(),
          Establishments: fields[1].trim(), // Merchant Name
          Grubsy_Partner_ID: partnerId, // Use the corrected Partner ID
          Food_Category: fields[3].trim() || null,
          Item: fields[4].trim(),
          Regular: cleanPrice(fields[5].trim()) || null,
          Medium: cleanPrice(fields[6].trim()) || null,
          Large: cleanPrice(fields[7].trim()) || null,
          Platter: cleanPrice(fields[8].trim()) || null,
          Image: fields[9].trim() || null,
          Description: fields[10].trim() || null,
          Notes: fields[11].trim() || null,
          SKU: fields[12].trim() || null,
          Created_At: fields[13].trim() || null,
          Updated_At: fields[14].trim() || null,
          Available: fields[15].trim() === 'Yes' ? 'Yes' : 'No',
          LastToggledAt: fields[16].trim() || null,
        };

        // Remove any undefined/null values to avoid Prisma issues
        Object.keys(menuItemData).forEach(key => {
          if (menuItemData[key] === null || menuItemData[key] === undefined) {
            delete menuItemData[key];
          }
        });

        // Insert menu item (skip if already exists)
        try {
          await prisma.Menu_Items.create({
            data: menuItemData,
          });
        } catch (error) {
          if (error.code === 'P2002') {
            // Unique constraint violation - item already exists, skip
            console.log(`⚠️ Menu item ${menuItemData.Menu_Item_ID} already exists, skipping`);
          } else {
            throw error;
          }
        }

        importedCount++;
        console.log(`✅ Imported menu item: ${menuItemData.Item} (${menuItemData.Menu_Item_ID})`);

      } catch (error) {
        console.error('❌ Error importing menu item:', error.message);
      }
    }

    console.log(`\n🎉 Successfully imported ${importedCount} menu items from CSV`);

    // Verify import
    const totalMenuItems = await prisma.Menu_Items.count();
    console.log(`📊 Total menu items in database: ${totalMenuItems}`);

  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to parse CSV line with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // Add the last field
  return result;
}

// Helper function to clean price strings
function cleanPrice(price) {
  if (!price || price === '') return null;
  return price.replace(/[£$,]/g, '').trim();
}

importMenuItemsFromCSV();