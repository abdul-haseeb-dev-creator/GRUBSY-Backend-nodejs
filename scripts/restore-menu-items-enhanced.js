import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function enhancedMenuItemsRestore() {
  try {
    console.log('🔧 ENHANCED Menu Items Data Restoration Script');
    console.log('==============================================');
    
    // Check if CSV file exists
    const csvPath = path.join(process.cwd(), 'scripts', 'menu-items-restore.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found!');
      console.log(`📁 Please place your CSV file at: ${csvPath}`);
      return;
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim()); // Remove empty lines
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log('📊 CSV Analysis:');
    console.log(`   - Headers: ${headers.join(', ')}`);
    console.log(`   - Total data rows: ${lines.length - 1}`);
    console.log('');

    // Get current database state
    const currentItems = await prisma.Menu_Items.findMany({
      select: {
        id: true,
        Menu_Item_ID: true,
        Item: true,
        Grubsy_Partner_ID: true,
        Food_Category: true,
        Regular: true
      }
    });

    console.log(`📊 Current Database State: ${currentItems.length} total items`);
    const itemsWithCategories = currentItems.filter(item => item.Food_Category);
    console.log(`   - Items with categories: ${itemsWithCategories.length}`);
    console.log(`   - Items missing categories: ${currentItems.length - itemsWithCategories.length}`);
    console.log('');

    let updatedCount = 0;
    let skippedCount = 0;
    let createdCount = 0;
    const unmatched = [];
    const matched = [];

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue;

      // Better CSV parsing - handle commas in quoted fields
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
      values.push(current.trim().replace(/^"|"$/g, '')); // Add last value

      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index] || null;
      });

      try {
        // Multiple matching strategies
        let existingItem = null;
        let matchMethod = '';

        // Strategy 1: Exact Menu_Item_ID match
        if (rowData['Menu Item ID'] && rowData['Menu Item ID'] !== '') {
          existingItem = await prisma.Menu_Items.findFirst({
            where: { Menu_Item_ID: rowData['Menu Item ID'] }
          });
          if (existingItem) matchMethod = 'Menu Item ID';
        }

        // Strategy 2: Item name + Partner ID match
        if (!existingItem && rowData.Item && rowData['Grubsy Partner ID']) {
          existingItem = await prisma.Menu_Items.findFirst({
            where: {
              AND: [
                { Item: rowData.Item },
                { Grubsy_Partner_ID: rowData['Grubsy Partner ID'] }
              ]
            }
          });
          if (existingItem) matchMethod = 'Item + Partner ID';
        }

        // Strategy 3: Fuzzy item name match (similar names)
        if (!existingItem && rowData.Item) {
          const similarItems = currentItems.filter(item => 
            item.Item && item.Item.toLowerCase().includes(rowData.Item.toLowerCase().substring(0, 5))
          );
          if (similarItems.length === 1) {
            existingItem = similarItems[0];
            matchMethod = 'Fuzzy name match';
          }
        }

        if (existingItem) {
          // Build update data - only update fields that have values
          const updateData = {};
          
          if (rowData.Merchant && rowData.Merchant !== '') updateData.Merchant = rowData.Merchant;
          if (rowData['Grubsy Partner ID'] && rowData['Grubsy Partner ID'] !== '') updateData.Grubsy_Partner_ID = rowData['Grubsy Partner ID'];
          if (rowData['Food Category'] && rowData['Food Category'] !== '') updateData.Food_Category = rowData['Food Category'];
          if (rowData.Item && rowData.Item !== '') updateData.Item = rowData.Item;
          if (rowData.Regular && rowData.Regular !== '') updateData.Regular = rowData.Regular;
          if (rowData.Medium && rowData.Medium !== '') updateData.Medium = rowData.Medium;
          if (rowData.Large && rowData.Large !== '') updateData.Large = rowData.Large;
          if (rowData.Platter && rowData.Platter !== '') updateData.Platter = rowData.Platter;
          if (rowData.Image && rowData.Image !== '') updateData.Image = rowData.Image;
          if (rowData.Description && rowData.Description !== '') updateData.Description = rowData.Description;
          if (rowData.Notes && rowData.Notes !== '') updateData.Notes = rowData.Notes;
          if (rowData.SKU && rowData.SKU !== '') updateData.SKU = rowData.SKU;
          if (rowData.Available && rowData.Available !== '') updateData.Available = rowData.Available;
          if (rowData.LastToggledAt && rowData.LastToggledAt !== '') updateData.LastToggledAt = rowData.LastToggledAt;

          // Only update if we have data to update
          if (Object.keys(updateData).length > 0) {
            await prisma.Menu_Items.update({
              where: { id: existingItem.id },
              data: updateData
            });

            matched.push({
              csvItem: rowData.Item,
              dbItem: existingItem.Item,
              method: matchMethod,
              category: updateData.Food_Category || 'No category',
              partner: updateData.Grubsy_Partner_ID || existingItem.Grubsy_Partner_ID
            });

            updatedCount++;
          } else {
            console.log(`⚠️  No data to update for: ${existingItem.Item}`);
            skippedCount++;
          }
        } else {
          // No match found - this might be a new item that needs to be created
          unmatched.push({
            item: rowData.Item || 'No name',
            menuItemId: rowData['Menu Item ID'] || 'No ID',
            partnerId: rowData['Grubsy Partner ID'] || 'No Partner',
            category: rowData['Food Category'] || 'No Category'
          });
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${rowData.Item || 'Unknown'}:`, error.message);
        skippedCount++;
      }
    }

    console.log('');
    console.log('🎉 RESTORATION RESULTS');
    console.log('======================');
    console.log(`✅ Successfully updated: ${updatedCount} items`);
    console.log(`⚠️  Skipped/unmatched: ${skippedCount} items`);
    console.log(`🆕 New items to create: ${createdCount} items`);
    console.log('');

    if (matched.length > 0) {
      console.log('✅ SUCCESSFULLY MATCHED ITEMS:');
      matched.forEach(m => {
        console.log(`   ${m.csvItem} (${m.partner}) → ${m.category} [${m.method}]`);
      });
      console.log('');
    }

    if (unmatched.length > 0) {
      console.log('⚠️  UNMATCHED ITEMS (these may need to be created):');
      unmatched.forEach(u => {
        console.log(`   ${u.item} (ID: ${u.menuItemId}, Partner: ${u.partnerId}, Category: ${u.category})`);
      });
      console.log('');
    }

    // Final verification
    const finalItems = await prisma.Menu_Items.findMany({
      where: { Food_Category: { not: null } },
      select: {
        Item: true,
        Food_Category: true,
        Regular: true,
        Grubsy_Partner_ID: true
      }
    });

    console.log('🔍 FINAL VERIFICATION:');
    console.log(`📊 Items with categories: ${finalItems.length}`);
    
    // Group by partner
    const byPartner = {};
    finalItems.forEach(item => {
      const partnerId = item.Grubsy_Partner_ID;
      if (!byPartner[partnerId]) byPartner[partnerId] = [];
      byPartner[partnerId].push(item);
    });

    Object.entries(byPartner).forEach(([partnerId, items]) => {
      console.log(`📊 ${partnerId}: ${items.length} items with categories`);
    });

    // Show unique categories
    const categories = [...new Set(finalItems.map(item => item.Food_Category))];
    console.log('📊 Categories found:', categories.join(', '));

  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enhancedMenuItemsRestore();