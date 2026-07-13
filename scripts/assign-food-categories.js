import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignFoodCategories() {
  try {
    console.log('🔧 Assigning Food Categories to Menu Items...');

    // Define category mapping based on item names
    const categoryMappings = {
      'Grills & Wraps': [
        'doner', 'shawarma', 'shish', 'kebab', 'wrap', 'lamb', 'chicken', 'beef', 'mixed'
      ],
      'Burgers': [
        'burger', 'cheese burger', 'chicken burger', 'beef burger'
      ],
      'Pizza': [
        'pizza', 'margherita', 'pepperoni', 'hawaiian'
      ],
      'Sides': [
        'chips', 'fries', 'salad', 'rice', 'bread', 'hummus', 'side'
      ],
      'Drinks': [
        'drink', 'water', 'coke', 'pepsi', 'juice', 'tea', 'coffee'
      ],
      'Desserts': [
        'dessert', 'ice cream', 'cake', 'sweet', 'baklava'
      ]
    };

    // Get all menu items for Grb-0001
    const allItems = await prisma.Menu_Items.findMany({
      where: {
        Grubsy_Partner_ID: 'Grb-0001'
      },
      select: {
        id: true,
        Item: true,
        Food_Category: true
      }
    });

    console.log(`📋 Found ${allItems.length} items to categorize`);

    let updatedCount = 0;
    
    for (const item of allItems) {
      const itemName = item.Item.toLowerCase();
      let assignedCategory = 'Main Items'; // Default category

      // Find matching category
      for (const [category, keywords] of Object.entries(categoryMappings)) {
        if (keywords.some(keyword => itemName.includes(keyword))) {
          assignedCategory = category;
          break;
        }
      }

      // Update the item with the new category
      await prisma.Menu_Items.update({
        where: { id: item.id },
        data: { Food_Category: assignedCategory }
      });

      console.log(`✅ ${item.Item} → ${assignedCategory}`);
      updatedCount++;
    }

    console.log(`\n🎉 Successfully categorized ${updatedCount} menu items!`);

    // Show the final category distribution
    const categorizedItems = await prisma.Menu_Items.findMany({
      where: {
        Grubsy_Partner_ID: 'Grb-0001'
      },
      select: {
        Food_Category: true
      }
    });

    const categoryStats = {};
    categorizedItems.forEach(item => {
      const category = item.Food_Category || 'Uncategorized';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    console.log('\n📊 Final Category Distribution:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

assignFoodCategories();