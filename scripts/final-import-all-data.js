import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SHEETBEST_URL = process.env.SHEETBEST_URL;
const SHEETBEST_API_KEY = process.env.SHEETBEST_API_KEY;

async function fetchSheetData(tabName) {
  try {
    console.log(`📥 Fetching data from "${tabName}" tab...`);
    const response = await axios.get(`${SHEETBEST_URL}/tabs/${encodeURIComponent(tabName)}`, {
      headers: {
        'X-Api-Key': SHEETBEST_API_KEY
      }
    });
    console.log(`✅ Found ${response.data.length} rows in "${tabName}"`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${tabName}:`, error.response?.status, error.response?.statusText);
    return [];
  }
}

async function importUsers() {
  console.log('\n👥 IMPORTING USERS...');
  const users = await fetchSheetData('Users');
  
  for (const userData of users) {
    if (!userData['Grubsy User ID']) continue;
    
    try {
      const user = await prisma.users.upsert({
        where: { 
          Grubsy_User_ID: userData['Grubsy User ID'] 
        },
        update: {
          Users_Full_Name: userData['Users Full Name'] || null,
          Users_Email: userData['Users Email'],
          Users_Password: userData['Users Password'] || null,
          Is_New_User: userData['Is New User?'] || null,
          Users_Registered_Address: userData['Users Registered Address'] || null,
          Users_Registered_PostCode: userData['Users Registered PostCode'] || null,
          Users_Phone_Number: userData['Users Phone Number'] || null,
          Date_Of_Birth: userData['Date Of Birth'] || null,
          Status: userData['Status'] || null,
          Created_At: userData['Created At'] || null,
          Last_Login: userData['Last Login'] || null
        },
        create: {
          Users_Full_Name: userData['Users Full Name'] || null,
          Users_Email: userData['Users Email'],
          Users_Password: userData['Users Password'] || null,
          Grubsy_User_ID: userData['Grubsy User ID'],
          Is_New_User: userData['Is New User?'] || null,
          Users_Registered_Address: userData['Users Registered Address'] || null,
          Users_Registered_PostCode: userData['Users Registered PostCode'] || null,
          Users_Phone_Number: userData['Users Phone Number'] || null,
          Date_Of_Birth: userData['Date Of Birth'] || null,
          Status: userData['Status'] || null,
          Created_At: userData['Created At'] || null,
          Last_Login: userData['Last Login'] || null
        }
      });
      console.log(`✅ Imported user: ${user.Users_Full_Name} (${user.Grubsy_User_ID})`);
    } catch (error) {
      console.error(`❌ Error importing user ${userData['Grubsy User ID']}:`, error.message);
    }
  }
}

async function importMerchants() {
  console.log('\n🏪 IMPORTING MERCHANTS...');
  const merchants = await fetchSheetData('Establishments');
  
  for (const est of merchants) {
    if (!est['Grubsy Partner ID']) continue;
    
    try {
      const establishment = await prisma.merchants.upsert({
        where: { 
          Grubsy_Partner_ID: est['Grubsy Partner ID'] 
        },
        update: {
          Merchant: est['Establishment Name'] || 'Unknown Restaurant',
          Description: est['Description'] || null,
          Cuisine: est['Cuisine'] || null,
          Address: est['Address'] || null,
          Area: est['Area'] || null,
          PostCode: est['PostCode'] || null,
          Hygiene_Rating: est['Hygiene Rating'] || null,
          Opening_Times: est['Opening Times'] || null,
          Halal_Friendly: est['حلال Halal Friendly?'] || null,
          Photo: est['Photo'] || null,
          Booking_Available: est['Booking Available'] || null,
          Relation: est['Relation'] || null,
          Active: est['Active'] || null,
          Owner_Email: est['Owner Email'] || null,
          Created_at: est['Created at'] || null,
          Owners_Name: est['Owners Name'] || null,
          Owners_number: est['Owners number'] || null,
          Establishments_Enrolement_Status: est['Establishments Enrolement Status'] || null,
          Establishment_Fee_Per_Order: est['Establishment Fee Per Order'] || null
        },
        create: {
          Grubsy_Partner_ID: est['Grubsy Partner ID'],
          Merchant: est['Establishment Name'] || 'Unknown Restaurant',
          Description: est['Description'] || null,
          Cuisine: est['Cuisine'] || null,
          Address: est['Address'] || null,
          Area: est['Area'] || null,
          PostCode: est['PostCode'] || null,
          Hygiene_Rating: est['Hygiene Rating'] || null,
          Opening_Times: est['Opening Times'] || null,
          Halal_Friendly: est['حلال Halal Friendly?'] || null,
          Photo: est['Photo'] || null,
          Booking_Available: est['Booking Available'] || null,
          Relation: est['Relation'] || null,
          Active: est['Active'] || null,
          Owner_Email: est['Owner Email'] || null,
          Created_at: est['Created at'] || null,
          Owners_Name: est['Owners Name'] || null,
          Owners_number: est['Owners number'] || null,
          Establishments_Enrolement_Status: est['Establishments Enrolement Status'] || null,
          Establishment_Fee_Per_Order: est['Establishment Fee Per Order'] || null
        }
      });
      console.log(`✅ Imported merchant: ${establishment.Merchant} (${establishment.Grubsy_Partner_ID})`);
    } catch (error) {
      console.error(`❌ Error importing establishment ${est['Grubsy Partner ID']}:`, error.message);
    }
  }
}

async function importMenuItems() {
  console.log('\n🍽️ IMPORTING MENU ITEMS...');
  const menuItems = await fetchSheetData('Menu Items');
  
  for (const item of menuItems) {
    if (!item['Menu Item ID'] || !item['Grubsy Partner ID']) continue;
    
    try {
      const menuItem = await prisma.menu_Items.upsert({
        where: { 
          Menu_Item_ID: item['Menu Item ID'] 
        },
        update: {
          Establishment: item['Establishment '] || null,
          Food_Category: item['Food Category '] || null,
          Item: item['Item'] || 'Unknown Item',
          Regular: item['Regular'] || null,
          Medium: item['Medium'] || null,
          Large: item['Large'] || null,
          Platter: item['Platter'] || null,
          Image: item['Image'] || null,
          Description: item['Description'] || null,
          Notes: item['Notes'] || null,
          SKU: item['SKU'] || null,
          Created_At: item['Created At'] || null,
          Updated_At: item['Updated At'] || null,
          Available: item['Available'] || null,
          LastToggledAt: item['LastToggledAt'] || null
        },
        create: {
          Menu_Item_ID: item['Menu Item ID'],
          Establishment: item['Establishment '] || null,
          Grubsy_Partner_ID: item['Grubsy Partner ID'],
          Food_Category: item['Food Category '] || null,
          Item: item['Item'] || 'Unknown Item',
          Regular: item['Regular'] || null,
          Medium: item['Medium'] || null,
          Large: item['Large'] || null,
          Platter: item['Platter'] || null,
          Image: item['Image'] || null,
          Description: item['Description'] || null,
          Notes: item['Notes'] || null,
          SKU: item['SKU'] || null,
          Created_At: item['Created At'] || null,
          Updated_At: item['Updated At'] || null,
          Available: item['Available'] || null,
          LastToggledAt: item['LastToggledAt'] || null
        }
      });
      console.log(`✅ Imported menu item: ${menuItem.Item} (${menuItem.Menu_Item_ID})`);
    } catch (error) {
      console.error(`❌ Error importing menu item ${item['Menu Item ID']}:`, error.message);
    }
  }
}

async function importDrivers() {
  console.log('\n🚗 IMPORTING DRIVERS...');
  const drivers = await fetchSheetData('Drivers');
  
  for (const driverData of drivers) {
    if (!driverData['Driver ID']) continue;
    
    try {
      const driver = await prisma.drivers.upsert({
        where: { 
          Driver_ID: driverData['Driver ID'] 
        },
        update: {
          Name: driverData['Name'] || 'Unknown Driver',
          Email: driverData['Email'] || null,
          Phone: driverData['Phone'] || null,
          Vehicle: driverData['Vehicle'] || null,
          Driving_Licence: driverData['Driving Licence'] || null,
          Date_Joined: driverData['Date Joined'] || null,
          Status: driverData['Status'] || null,
          Assigned_Orders: driverData['Assigned Orders (Comma Separated)'] || null,
          Created_At: driverData['Created At'] || null,
          Last_Login: driverData['Last Login'] || null,
          Profile_Photo: driverData['Profile Photo'] || null,
          Availability: driverData['Availability'] || null,
          Current_location: driverData['Current location '] || null
        },
        create: {
          Driver_ID: driverData['Driver ID'],
          Name: driverData['Name'] || 'Unknown Driver',
          Email: driverData['Email'] || null,
          Phone: driverData['Phone'] || null,
          Vehicle: driverData['Vehicle'] || null,
          Driving_Licence: driverData['Driving Licence'] || null,
          Date_Joined: driverData['Date Joined'] || null,
          Status: driverData['Status'] || null,
          Assigned_Orders: driverData['Assigned Orders (Comma Separated)'] || null,
          Created_At: driverData['Created At'] || null,
          Last_Login: driverData['Last Login'] || null,
          Profile_Photo: driverData['Profile Photo'] || null,
          Availability: driverData['Availability'] || null,
          Current_location: driverData['Current location '] || null
        }
      });
      console.log(`✅ Imported driver: ${driver.Name} (${driver.Driver_ID})`);
    } catch (error) {
      console.error(`❌ Error importing driver ${driverData['Driver ID']}:`, error.message);
    }
  }
}

async function importOrders() {
  console.log('\n📦 IMPORTING ORDERS...');
  const orders = await fetchSheetData('Orders');
  
  for (const orderData of orders) {
    if (!orderData['Order ID        '] || !orderData['Grubsy User ID']) continue;
    
    try {
      const order = await prisma.orders.upsert({
        where: { 
          Order_ID: orderData['Order ID        '].trim() 
        },
        update: {
          Ordered_Items: orderData['Ordered Items'] || null,
          Order_Date: orderData['Order Date'] || null,
          Status: orderData['Status'] || null,
          Basket_SubTotal: orderData['Basket SubTotal '] || null,
          Service_Fee: orderData['Service Fee'] || null,
          Delivery_Fee: orderData['Delivery Fee'] || null,
          Order_Grand_total: orderData['Order Grand total'] || null,
          Tips: orderData['Tips'] || null,
          Delivery_Address: orderData['Delivery Address'] || null,
          Users_Email: orderData['Users Email'],
          Driver_ID: orderData['Driver ID '] || null,
          SKU: orderData['SKU'] || null,
          Created_At: orderData['Created At'] || null,
          Updated_At: orderData['Updated At'] || null,
          Payment_Link: orderData['Payment Link'] || null,
          Payment_Status: orderData['Payment Status'] || null,
          Stripe_Session_ID: orderData['Stripe Session ID'] || null,
          Users_Phone_number: orderData['Users Phone number'] || null,
          Cordinates: orderData['Cordinates'] || null,
          Restaurant_Accepted_At: orderData['Restaurant Accepted At:'] || null
        },
        create: {
          Order_ID: orderData['Order ID        '].trim(),
          Ordered_Items: orderData['Ordered Items'] || null,
          Grubsy_User_ID: orderData['Grubsy User ID'],
          Grubsy_Partner_ID: orderData['Grubsy Partner ID'],
          Order_Date: orderData['Order Date'] || null,
          Status: orderData['Status'] || null,
          Basket_SubTotal: orderData['Basket SubTotal '] || null,
          Service_Fee: orderData['Service Fee'] || null,
          Delivery_Fee: orderData['Delivery Fee'] || null,
          Order_Grand_total: orderData['Order Grand total'] || null,
          Tips: orderData['Tips'] || null,
          Delivery_Address: orderData['Delivery Address'] || null,
          Users_Email: orderData['Users Email'],
          Driver_ID: orderData['Driver ID '] || null,
          SKU: orderData['SKU'] || null,
          Created_At: orderData['Created At'] || null,
          Updated_At: orderData['Updated At'] || null,
          Payment_Link: orderData['Payment Link'] || null,
          Payment_Status: orderData['Payment Status'] || null,
          Stripe_Session_ID: orderData['Stripe Session ID'] || null,
          Users_Phone_number: orderData['Users Phone number'] || null,
          Cordinates: orderData['Cordinates'] || null,
          Restaurant_Accepted_At: orderData['Restaurant Accepted At:'] || null
        }
      });
      console.log(`✅ Imported order: ${order.Order_ID} for user ${order.Grubsy_User_ID}`);
    } catch (error) {
      console.error(`❌ Error importing order ${orderData['Order ID        ']}:`, error.message);
    }
  }
}

async function main() {
  try {
    console.log('🚀 STARTING FINAL COMPLETE DATA IMPORT');
    console.log('=====================================');
    
    // Import in correct order (dependencies first)
    await importUsers();
    await importMerchants();
    await importMenuItems();
    await importDrivers();
    await importOrders();
    
    console.log('\n✅ FINAL COMPLETE DATA IMPORT FINISHED!');
    console.log('=======================================');
    
    // Show summary
    const counts = await Promise.all([
      prisma.users.count(),
      prisma.merchants.count(),
      prisma.menu_Items.count(),
      prisma.drivers.count(),
      prisma.orders.count()
    ]);
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`👥 Users: ${counts[0]}`);
    console.log(`🏪 Merchants: ${counts[1]}`);
    console.log(`🍽️ Menu Items: ${counts[2]}`);
    console.log(`🚗 Drivers: ${counts[3]}`);
    console.log(`📦 Orders: ${counts[4]}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();