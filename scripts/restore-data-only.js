import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restoreDataOnly() {
  try {
    console.log('🔧 SIMPLE Menu Items Data Restoration (Data Only)');
    console.log('==================================================');
    
    // Check if CSV file exists
    const csvPath = path.join(process.cwd(), 'scripts', 'menu-items-restore.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found!');
      return;
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log(`📊 Processing ${lines.length - 1} items from CSV`);
    console.log('📋 Strategy: Match by Menu Item ID or Item name, update data fields only (no Partner ID changes)');
    console.log('');

    let updatedCount = 0;
    let skippedCount = 0;
    const successful = [];
    const failed = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue;

      // Better CSV parsing
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < row.length; j++) {
        const char = row[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index] || null;
      });

      try {
        // Find existing item by Menu Item ID first
        let existingItem = null;
        
        if (rowData['Menu Item ID']) {
          existingItem = await prisma.Menu_Items.findFirst({
            where: { Menu_Item_ID: rowData['Menu Item ID'] }
          });
        }
        
        // Fallback: find by item name (for existing Grb-0001 items)
        if (!existingItem && rowData.Item) {
          existingItem = await prisma.Menu_Items.findFirst({
            where: {
              AND: [
                { Item: rowData.Item },
                { Grubsy_Partner_ID: 'Grb-0001' } // Look for existing items with Grb-0001
              ]
            }
          });
        }

        if (existingItem) {
          // Build update data - ONLY update data fields, NOT Partner ID
          const updateData = {};
          
          if (rowData['Food Category'] && rowData['Food Category'] !== '') {
            updateData.Food_Category = rowData['Food Category'];
          }
          if (rowData.Description && rowData.Description !== '') {
            updateData.Description = rowData.Description;
          }
          if (rowData.Notes && rowData.Notes !== '') {
            updateData.Notes = rowData.Notes;
          }
          if (rowData.Regular && rowData.Regular !== '') {
            updateData.Regular = rowData.Regular;
          }
          if (rowData.Medium && rowData.Medium !== '') {
            updateData.Medium = rowData.Medium;
          }
          if (rowData.Large && rowData.Large !== '') {
            updateData.Large = rowData.Large;
          }
          if (rowData.Platter && rowData.Platter !== '') {
            updateData.Platter = rowData.Platter;
          }
          if (rowData.Image && rowData.Image !== '' && rowData.Image !== 'Image') {
            updateData.Image = rowData.Image;
          }
          if (rowData.SKU && rowData.SKU !== '') {
            updateData.SKU = rowData.SKU;
          }
          if (rowData.Available && rowData.Available !== '') {
            updateData.Available = rowData.Available;
          }

          // Only update if we have data to update
          if (Object.keys(updateData).length > 0) {
            await prisma.Menu_Items.update({
              where: { id: existingItem.id },
              data: updateData
            });

            successful.push({
              item: existingItem.Item,
              category: updateData.Food_Category || 'No category',
              price: updateData.Regular || 'No price',
              fieldsUpdated: Object.keys(updateData).length
            });

            console.log(`✅ ${existingItem.Item} → ${updateData.Food_Category || 'No category'} (${Object.keys(updateData).length} fields)`);
            updatedCount++;
          } else {
            console.log(`⚠️  ${existingItem.Item} - No data to update`);
            skippedCount++;
          }
        } else {
          failed.push({
            item: rowData.Item || 'Unknown',
            menuItemId: rowData['Menu Item ID'] || 'No ID',
            reason: 'Not found in database'
          });
          console.log(`❌ ${rowData.Item || 'Unknown'} - Not found`);
          skippedCount++;
        }
      } catch (error) {
        failed.push({
          item: rowData.Item || 'Unknown',
          menuItemId: rowData['Menu Item ID'] || 'No ID',
          reason: error.message
        });
        console.error(`❌ Error processing ${rowData.Item || 'Unknown'}:`, error.message);
        skippedCount++;
      }
    }

    console.log('');
    console.log('🎉 RESTORATION COMPLETE!');
    console.log('========================');
    console.log(`✅ Successfully updated: ${updatedCount} items`);
    console.log(`⚠️  Skipped: ${skippedCount} items`);
    console.log('');

    if (successful.length > 0) {
      console.log('✅ SUCCESSFULLY RESTORED ITEMS:');
      successful.forEach(s => {
        console.log(`   ${s.item} → Category: ${s.category}, Price: ${s.price} (${s.fieldsUpdated} fields updated)`);
      });
      console.log('');
    }

    if (failed.length > 0) {
      console.log('❌ FAILED TO RESTORE:');
      failed.slice(0, 5).forEach(f => {
        console.log(`   ${f.item} (${f.menuItemId}) - ${f.reason}`);
      });
      if (failed.length > 5) {
        console.log(`   ... and ${failed.length - 5} more`);
      }
      console.log('');
    }

    // Final verification
    const finalItems = await prisma.Menu_Items.findMany({
      where: { 
        Grubsy_Partner_ID: 'Grb-0001',
        Food_Category: { not: null }
      },
      select: {
        Item: true,
        Food_Category: true,
        Regular: true
      }
    });

    console.log('🔍 FINAL VERIFICATION:');
    console.log(`📊 Items with categories for Grb-0001: ${finalItems.length}`);
    
    const categories = [...new Set(finalItems.map(item => item.Food_Category))];
    console.log('📊 Categories found:', categories.join(', '));

    if (finalItems.length > 0) {
      console.log('📋 Sample restored items:');
      finalItems.slice(0, 5).forEach(item => {
        console.log(`   - ${item.Item}: ${item.Food_Category} (${item.Regular || 'No price'})`);
      });
    }

  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDataOnly();