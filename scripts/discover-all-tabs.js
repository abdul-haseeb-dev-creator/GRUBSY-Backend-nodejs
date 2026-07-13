// Discover ALL accessible tabs with exact names
import 'dotenv/config';
import fetch from 'node-fetch';

const SHEETBEST_URL = process.env.SHEETBEST_URL;
const SHEETBEST_API_KEY = process.env.SHEETBEST_API_KEY;

function getSheetbestHeaders() {
  return { 
    'Content-Type': 'application/json', 
    'X-Api-Key': SHEETBEST_API_KEY,
  };
}

async function testTabAccess(tabName) {
  try {
    const response = await fetch(`${SHEETBEST_URL}/tabs/${encodeURIComponent(tabName)}`, {
      method: 'GET',
      headers: getSheetbestHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      return { accessible: true, rows: data.length, sampleData: data[0] };
    } else {
      return { accessible: false, status: response.status, error: response.statusText };
    }
  } catch (error) {
    return { accessible: false, error: error.message };
  }
}

async function discoverAllTabs() {
  console.log('🔍 Testing access to ALL possible tab names...\n');

  // Your mentioned tabs
  const yourTabs = [
    'Items', 'Food', 'Products', 'Dishes', 'Meals', 'Combos', 'Categories', 'Food Items',
    'Menu', 'MenuItems', 'Menu Items', 'Menus', 'MenuItem', 'Menu Item'
  ];

  // Additional possible variations
  const variations = [
    'menu items', 'MENU ITEMS', 'Menu_Items', 'menu_items',
    'items', 'ITEMS', 'food', 'FOOD', 'products', 'PRODUCTS',
    'dishes', 'DISHES', 'meals', 'MEALS', 'combos', 'COMBOS',
    'categories', 'CATEGORIES', 'food items', 'FOOD ITEMS',
    'Food_Items', 'food_items', 'FoodItems', 'fooditems'
  ];

  // Known working tabs
  const knownTabs = [
    'Users', 'Orders', 'Driver', 'Driver: FAQ\'s', 'Establishments'
  ];

  const allTabsToTest = [...new Set([...yourTabs, ...variations, ...knownTabs])];

  const accessibleTabs = [];
  const inaccessibleTabs = [];

  for (const tabName of allTabsToTest) {
    console.log(`Testing: "${tabName}"`);
    const result = await testTabAccess(tabName);
    
    if (result.accessible) {
      accessibleTabs.push({ name: tabName, rows: result.rows, sample: result.sampleData });
      console.log(`✅ ACCESSIBLE: "${tabName}" (${result.rows} rows)`);
    } else {
      inaccessibleTabs.push({ name: tabName, status: result.status, error: result.error });
      console.log(`❌ NOT ACCESSIBLE: "${tabName}" (${result.status || 'Error'})`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 SUMMARY:');
  console.log(`✅ Accessible tabs: ${accessibleTabs.length}`);
  console.log(`❌ Inaccessible tabs: ${inaccessibleTabs.length}`);

  console.log('\n🎯 ACCESSIBLE TABS WITH DATA:');
  accessibleTabs.forEach(tab => {
    console.log(`\n📋 "${tab.name}" (${tab.rows} rows)`);
    if (tab.sample) {
      console.log('   Sample columns:', Object.keys(tab.sample).join(', '));
    }
  });

  console.log('\n❌ INACCESSIBLE TABS:');
  inaccessibleTabs.forEach(tab => {
    console.log(`   "${tab.name}" - Status: ${tab.status || 'Error'}`);
  });

  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check your SheetBest dashboard to ensure all tabs are enabled');
  console.log('2. Verify the exact tab names in your Google Sheet');
  console.log('3. Make sure SheetBest has permission to access all tabs');
}

discoverAllTabs();