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
    const response = await axios.get(`${SHEETBEST_URL}/tabs/${tabName}`, {
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

async function importEstablishments() {
  console.log('\n🏪 IMPORTING ESTABLISHMENTS...');
  const establishments = await fetchSheetData('Establishments');
  
  for (const est of establishments) {
    if (!est['Grubsy Partner ID']) continue;
    
    try {
      const merchant = await prisma.merchant.upsert({
        where: { 
          grubsyPartnerId: est['Grubsy Partner ID'] 
        },
        update: {
          name: est['Establishment Name'] || 'Unknown Restaurant',
          address: est['Address'] || 'Address not provided',
          cuisine: est['Cuisine'] || 'Various',
          area: est['Area'] || '',
          postcode: est['PostCode'] || '',
          hygieneRating: est['Hygiene Rating'] ? parseInt(est['Hygiene Rating']) : null,
          openingTimes: est['Opening Times'] || '',
          isHalal: est['حلال Halal Friendly?'] === 'Yes',
          photo: est['Photo'] || '',
          bookingAvailable: est['Booking Available'] === 'Yes',
          isActive: est['Active'] === 'Yes',
          ownerEmail: est['Owner Email'] || '',
          ownerName: est['Owners Name'] || '',
          ownerPhone: est['Owners number'] || '',
          feePerOrder: est['Establishment Fee Per Order'] ? parseFloat(est['Establishment Fee Per Order']) : 0
        },
        create: {
          id: `merchant_${est['Grubsy Partner ID']}_${Date.now()}`,
          grubsyPartnerId: est['Grubsy Partner ID'],
          name: est['Establishment Name'] || 'Unknown Restaurant',
          address: est['Address'] || 'Address not provided',
          cuisine: est['Cuisine'] || 'Various',
          area: est['Area'] || '',
          postcode: est['PostCode'] || '',
          hygieneRating: est['Hygiene Rating'] ? parseInt(est['Hygiene Rating']) : null,
          openingTimes: est['Opening Times'] || '',
          isHalal: est['حلال Halal Friendly?'] === 'Yes',
          photo: est['Photo'] || '',
          bookingAvailable: est['Booking Available'] === 'Yes',
          isActive: est['Active'] === 'Yes',
          ownerEmail: est['Owner Email'] || '',
          ownerName: est['Owners Name'] || '',
          ownerPhone: est['Owners number'] || '',
          feePerOrder: est['Establishment Fee Per Order'] ? parseFloat(est['Establishment Fee Per Order']) : 0
        }
      });
      console.log(`✅ Imported establishment: ${merchant.name} (${merchant.grubsyPartnerId})`);
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
      // Find the merchant
      const merchant = await prisma.merchant.findFirst({
        where: { grubsyPartnerId: item['Grubsy Partner ID'] }
      });
      
      if (!merchant) {
        console.log(`⚠️ Merchant not found for ${item['Grubsy Partner ID']}, skipping menu item`);
        continue;
      }
      
      const menuItem = await prisma.menuItem.upsert({
        where: { 
          menuItemId: item['Menu Item ID'] 
        },
        update: {
          name: item['Item'] || 'Unknown Item',
          category: item['Food Category'] || 'Other',
          description: item['Description'] || '',
          image: item['Image'] || '',
          regularPrice: item['Regular'] ? parseFloat(item['Regular']) : null,
          mediumPrice: item['Medium'] ? parseFloat(item['Medium']) : null,
          largePrice: item['Large'] ? parseFloat(item['Large']) : null,
          platterPrice: item['Platter'] ? parseFloat(item['Platter']) : null,
          sku: item['SKU'] || '',
          isAvailable: item['Available'] !== 'No',
          notes: item['Notes'] || ''
        },
        create: {
          id: `menuitem_${item['Menu Item ID']}_${Date.now()}`,
          menuItemId: item['Menu Item ID'],
          merchantId: merchant.id,
          name: item['Item'] || 'Unknown Item',
          category: item['Food Category'] || 'Other',
          description: item['Description'] || '',
          image: item['Image'] || '',
          regularPrice: item['Regular'] ? parseFloat(item['Regular']) : null,
          mediumPrice: item['Medium'] ? parseFloat(item['Medium']) : null,
          largePrice: item['Large'] ? parseFloat(item['Large']) : null,
          platterPrice: item['Platter'] ? parseFloat(item['Platter']) : null,
          sku: item['SKU'] || '',
          isAvailable: item['Available'] !== 'No',
          notes: item['Notes'] || ''
        }
      });
      console.log(`✅ Imported menu item: ${menuItem.name} for ${merchant.name}`);
    } catch (error) {
      console.error(`❌ Error importing menu item ${item['Menu Item ID']}:`, error.message);
    }
  }
}

async function importDrivers() {
  console.log('\n🚗 IMPORTING DRIVERS...');
  const drivers = await fetchSheetData('Driver');
  
  for (const driverData of drivers) {
    if (!driverData['Driver ID']) continue;
    
    try {
      const driver = await prisma.driver.upsert({
        where: { 
          driverId: driverData['Driver ID'] 
        },
        update: {
          name: driverData['Name'] || 'Unknown Driver',
          email: driverData['Email'] || '',
          phone: driverData['Phone'] || '',
          vehicle: driverData['Vehicle'] || '',
          drivingLicence: driverData['Driving Licence'] || '',
          status: driverData['Status'] || 'INACTIVE',
          profilePhoto: driverData['Profile Photo'] || '',
          availability: driverData['Availability'] === 'Available',
          currentLocation: driverData['Current location'] || ''
        },
        create: {
          id: `driver_${driverData['Driver ID']}_${Date.now()}`,
          driverId: driverData['Driver ID'],
          name: driverData['Name'] || 'Unknown Driver',
          email: driverData['Email'] || '',
          phone: driverData['Phone'] || '',
          vehicle: driverData['Vehicle'] || '',
          drivingLicence: driverData['Driving Licence'] || '',
          status: driverData['Status'] || 'INACTIVE',
          profilePhoto: driverData['Profile Photo'] || '',
          availability: driverData['Availability'] === 'Available',
          currentLocation: driverData['Current location'] || ''
        }
      });
      console.log(`✅ Imported driver: ${driver.name} (${driver.driverId})`);
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
      // Find user
      const user = await prisma.user.findFirst({
        where: { grubsyUserId: orderData['Grubsy User ID'] }
      });
      
      if (!user) {
        console.log(`⚠️ User not found for ${orderData['Grubsy User ID']}, skipping order`);
        continue;
      }
      
      // Find merchant
      const merchant = await prisma.merchant.findFirst({
        where: { grubsyPartnerId: orderData['Grubsy Partner ID'] }
      });
      
      if (!merchant) {
        console.log(`⚠️ Merchant not found for ${orderData['Grubsy Partner ID']}, skipping order`);
        continue;
      }
      
      // Find driver if assigned
      let driver = null;
      if (orderData['Driver ID ']) {
        driver = await prisma.driver.findFirst({
          where: { driverId: orderData['Driver ID '] }
        });
      }
      
      const order = await prisma.order.upsert({
        where: { 
          orderId: orderData['Order ID        '].trim() 
        },
        update: {
          items: orderData['Ordered Items'] || '',
          status: orderData['Status'] || 'PENDING',
          basketSubtotal: orderData['Basket SubTotal '] ? parseFloat(orderData['Basket SubTotal ']) : 0,
          serviceFee: orderData['Service Fee'] ? parseFloat(orderData['Service Fee']) : 0,
          deliveryFee: orderData['Delivery Fee'] ? parseFloat(orderData['Delivery Fee']) : 0,
          grandTotal: orderData['Order Grand total'] ? parseFloat(orderData['Order Grand total']) : 0,
          tips: orderData['Tips'] ? parseFloat(orderData['Tips']) : 0,
          deliveryAddress: orderData['Delivery Address'] || '',
          paymentStatus: orderData['Payment Status'] || 'PENDING',
          coordinates: orderData['Cordinates'] || ''
        },
        create: {
          id: `order_${orderData['Order ID        '].trim()}_${Date.now()}`,
          orderId: orderData['Order ID        '].trim(),
          userId: user.id,
          merchantId: merchant.id,
          driverId: driver?.id || null,
          items: orderData['Ordered Items'] || '',
          status: orderData['Status'] || 'PENDING',
          basketSubtotal: orderData['Basket SubTotal '] ? parseFloat(orderData['Basket SubTotal ']) : 0,
          serviceFee: orderData['Service Fee'] ? parseFloat(orderData['Service Fee']) : 0,
          deliveryFee: orderData['Delivery Fee'] ? parseFloat(orderData['Delivery Fee']) : 0,
          grandTotal: orderData['Order Grand total'] ? parseFloat(orderData['Order Grand total']) : 0,
          tips: orderData['Tips'] ? parseFloat(orderData['Tips']) : 0,
          deliveryAddress: orderData['Delivery Address'] || '',
          paymentStatus: orderData['Payment Status'] || 'PENDING',
          coordinates: orderData['Cordinates'] || ''
        }
      });
      console.log(`✅ Imported order: ${order.orderId} for ${user.name} from ${merchant.name}`);
    } catch (error) {
      console.error(`❌ Error importing order ${orderData['Order ID        ']}:`, error.message);
    }
  }
}

async function main() {
  try {
    console.log('🚀 STARTING COMPLETE DATA IMPORT FROM GOOGLE SHEETS');
    console.log('==================================================');
    
    // Import in correct order (dependencies first)
    await importEstablishments();
    await importMenuItems();
    await importDrivers();
    await importOrders();
    
    console.log('\n✅ COMPLETE DATA IMPORT FINISHED!');
    console.log('==================================');
    
    // Show summary
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.merchant.count(),
      prisma.menuItem.count(),
      prisma.driver.count(),
      prisma.order.count()
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