import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugWithRawSQL() {
  try {
    console.log('🔍 Testing raw SQL query for Food_Category...');
    
    // Try raw SQL to see what's actually in the database
    const rawResult = await prisma.$queryRaw`
      SELECT 
        \`Menu Item ID\` as Menu_Item_ID,
        Item,
        \`Food Category\` as Food_Category,
        \`Grubsy Partner ID\` as Grubsy_Partner_ID
      FROM \`Menu Items\` 
      WHERE \`Grubsy Partner ID\` = 'Grb-0001'
      LIMIT 5
    `;

    console.log('📋 Raw SQL Results:');
    rawResult.forEach((item, index) => {
      console.log(`--- Item ${index + 1} ---`);
      console.log('Menu_Item_ID:', item.Menu_Item_ID);
      console.log('Item:', item.Item);
      console.log('Food_Category:', item.Food_Category);
      console.log('Raw type:', typeof item.Food_Category);
      console.log('Raw value details:', JSON.stringify(item.Food_Category));
    });

    // Also try to see all column names
    const columnInfo = await prisma.$queryRaw`
      SHOW COLUMNS FROM \`Menu Items\`
    `;
    
    console.log('\n📊 All columns in Menu Items table:');
    columnInfo.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

debugWithRawSQL();