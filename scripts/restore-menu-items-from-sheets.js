import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restoreMenuItemsFromCSV() {
  try {
    console.log('🔧 Menu Items Data Restoration Script');
    console.log('=====================================');
    
    console.log('📋 Expected CSV Columns (from your Google Sheets):');
    console.log('Menu Item ID, Merchant, Grubsy Partner ID, Food Category, Item,');
    console.log('Regular, Medium, Large, Platter, Image, Description, Notes,');
    console.log('SKU, Created At, Updated At, Available, LastToggledAt');
    console.log('');
    console.log('📁 Instructions:');
    console.log('1. Export your Google Sheets Menu Items data as CSV');
    console.log('2. Save it as "menu-items-restore.csv" in the scripts folder');
    console.log('3. Run this script to restore all missing data');
    console.log('');

    // Check if CSV file exists
    const csvPath = path.join(process.cwd(), 'scripts', 'menu-items-restore.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found!');
      console.log(`📁 Please place your CSV file at: ${csvPath}`);
      console.log('');
      console.log('💡 Alternative: Manual restoration for La Damas data');
      console.log('Would you like me to create sample data restoration for La Damas?');
      return;
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log('📊 Found CSV with columns:', headers);
    console.log('📊 Total rows to process:', lines.length - 1);
    console.log('');

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue; // Skip empty rows

      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const rowData = {};
      
      // Map CSV columns to data object
      headers.forEach((header, index) => {
        rowData[header] = values[index] || null;
      });

      try {
        // Try to match by Menu_Item_ID first, then by Item name
        let existingItem = null;
        
        if (rowData['Menu Item ID']) {
          existingItem = await prisma.Menu_Items.findFirst({
            where: { Menu_Item_ID: rowData['Menu Item ID'] }
          });
        }
        
        // Fallback: match by Item name and Partner ID
        if (!existingItem && rowData.Item && rowData['Grubsy Partner ID']) {
          existingItem = await prisma.Menu_Items.findFirst({
            where: {
              AND: [
                { Item: rowData.Item },
                { Grubsy_Partner_ID: rowData['Grubsy Partner ID'] }
              ]
            }
          });
        }

        if (existingItem) {
          // Complete restoration with all available data
          const updateData = {};
          
          // Map CSV columns to database fields
          if (rowData.Merchant) updateData.Merchant = rowData.Merchant;
          if (rowData['Grubsy Partner ID']) updateData.Grubsy_Partner_ID = rowData['Grubsy Partner ID'];
          if (rowData['Food Category']) updateData.Food_Category = rowData['Food Category'];
          if (rowData.Item) updateData.Item = rowData.Item;
          if (rowData.Regular) updateData.Regular = rowData.Regular;
          if (rowData.Medium) updateData.Medium = rowData.Medium;
          if (rowData.Large) updateData.Large = rowData.Large;
          if (rowData.Platter) updateData.Platter = rowData.Platter;
          if (rowData.Image) updateData.Image = rowData.Image;
          if (rowData.Description) updateData.Description = rowData.Description;
          if (rowData.Notes) updateData.Notes = rowData.Notes;
          if (rowData.SKU) updateData.SKU = rowData.SKU;
          if (rowData.Available) updateData.Available = rowData.Available;
          if (rowData.LastToggledAt) updateData.LastToggledAt = rowData.LastToggledAt;

          await prisma.Menu_Items.update({
            where: { id: existingItem.id },
            data: updateData
          });

          const partnerInfo = rowData['Grubsy Partner ID'] || existingItem.Grubsy_Partner_ID;
          const category = rowData['Food Category'] || 'N/A';
          console.log(`✅ Updated: ${existingItem.Item} (${partnerInfo}) - Category: ${category}`);
          updatedCount++;
        } else {
          console.log(`⚠️  Skipped: ${rowData.Item || rowData['Menu Item ID'] || 'Unknown'} - Not found in database`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${rowData.Item}:`, error.message);
        skippedCount++;
      }
    }

    console.log('');
    console.log('🎉 Restoration Complete!');
    console.log(`✅ Updated: ${updatedCount} menu items`);
    console.log(`⚠️  Skipped: ${skippedCount} items`);
    
    // Verify the restoration across all partners
    console.log('');
    console.log('🔍 Verifying restoration...');
    
    const allRestoredItems = await prisma.Menu_Items.findMany({
      where: { Food_Category: { not: null } },
      select: {
        Item: true,
        Food_Category: true,
        Regular: true,
        Description: true,
        Grubsy_Partner_ID: true
      }
    });

    console.log(`📊 Total items with categories restored: ${allRestoredItems.length}`);
    
    // Group by partner
    const byPartner = {};
    allRestoredItems.forEach(item => {
      const partnerId = item.Grubsy_Partner_ID;
      if (!byPartner[partnerId]) byPartner[partnerId] = [];
      byPartner[partnerId].push(item);
    });

    Object.entries(byPartner).forEach(([partnerId, items]) => {
      console.log(`📊 ${partnerId}: ${items.length} items restored`);
      items.slice(0, 2).forEach(item => {
        console.log(`   - ${item.Item}: ${item.Food_Category} (${item.Regular || 'No price'})`);
      });
    });

  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative: Quick restore with sample data if no CSV
async function quickRestoreLaDamas() {
  console.log('🚀 Quick restoration for La Damas with sample categories...');
  
  // Sample category mapping based on item names
  const categoryMap = {
    'wrap': 'Wraps',
    'doner': 'Wraps', 
    'shawarma': 'Wraps',
    'platter': 'Platters',
    'mixed': 'Mixed Grills',
    'burger': 'Gourmet Burgers',
    'chips': 'Sides',
    'drink': 'Cold Drinks',
    'dessert': 'Desserts'
  };

  try {
    const allItems = await prisma.Menu_Items.findMany({
      where: { Grubsy_Partner_ID: 'Grb-0001' }
    });

    let updated = 0;
    for (const item of allItems) {
      const itemName = item.Item.toLowerCase();
      let category = 'Main Items'; // Default
      
      // Find matching category
      for (const [keyword, cat] of Object.entries(categoryMap)) {
        if (itemName.includes(keyword)) {
          category = cat;
          break;
        }
      }

      await prisma.Menu_Items.update({
        where: { id: item.id },
        data: {
          Food_Category: category,
          Description: `Delicious ${item.Item.toLowerCase()}`,
          Notes: 'Restored from backup'
        }
      });
      
      console.log(`✅ ${item.Item} → ${category}`);
      updated++;
    }

    console.log(`🎉 Quick restore complete: ${updated} items updated`);
  } catch (error) {
    console.error('❌ Quick restore failed:', error);
  }
}

// Run the appropriate restoration method
if (process.argv.includes('--quick')) {
  quickRestoreLaDamas();
} else {
  restoreMenuItemsFromCSV();
}