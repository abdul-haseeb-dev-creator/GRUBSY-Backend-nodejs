import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMenuData() {
  try {
    console.log('🔍 Debugging Menu_Items data for Partner ID: Grb-0001');
    
    // Get a few sample menu items to see the actual data structure
    const sampleItems = await prisma.Menu_Items.findMany({
      where: {
        Grubsy_Partner_ID: 'Grb-0001'
      },
      take: 5, // Just get first 5 items
      select: {
        id: true,
        Menu_Item_ID: true,
        Item: true,
        Food_Category: true,
        Regular: true,
        Medium: true,
        Large: true,
        Platter: true,
        Image: true,
        Description: true,
        Notes: true,
        Available: true,
      }
    });

    console.log('📋 Sample menu items:');
    sampleItems.forEach((item, index) => {
      console.log(`\n--- Item ${index + 1} ---`);
      console.log('ID:', item.id);
      console.log('Menu_Item_ID:', item.Menu_Item_ID);
      console.log('Item:', item.Item);
      console.log('Food_Category:', item.Food_Category);
      console.log('Regular:', item.Regular);
      console.log('Medium:', item.Medium);
      console.log('Large:', item.Large);
      console.log('Platter:', item.Platter);
      console.log('Image:', item.Image);
      console.log('Description:', item.Description);
      console.log('Notes:', item.Notes);
      console.log('Available:', item.Available);
    });

    // Get all unique categories
    const allItems = await prisma.Menu_Items.findMany({
      where: {
        Grubsy_Partner_ID: 'Grb-0001'
      },
      select: {
        Food_Category: true
      }
    });

    const categories = [...new Set(allItems.map(item => item.Food_Category))];
    console.log('\n📊 All Food Categories found:');
    console.log(categories);

    // Count items per category
    console.log('\n📊 Items per category:');
    for (const category of categories) {
      const count = allItems.filter(item => item.Food_Category === category).length;
      console.log(`  ${category}: ${count} items`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

debugMenuData();