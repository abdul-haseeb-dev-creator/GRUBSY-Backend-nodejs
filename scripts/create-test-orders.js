// Create test orders to test the driver app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOrders() {
  try {
    console.log('🚀 CREATING TEST ORDERS FOR DRIVER APP TESTING');
    console.log('===============================================');

    // Get our imported data
    const users = await prisma.users.findMany();
    const merchants = await prisma.merchants.findMany();
    const drivers = await prisma.drivers.findMany();

    console.log(`📊 Available data:`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`🏪 Merchants: ${merchants.length}`);
    console.log(`🚗 Drivers: ${drivers.length}`);

    if (users.length === 0 || merchants.length === 0) {
      console.log('❌ Need users and merchants to create orders');
      return;
    }

    // Create test orders for Grb-0001 (La Damas)
    const testOrders = [
      {
        Order_ID: 'ORD-001',
        Ordered_Items: 'Lamb Doner, Chips, Can',
        Grubsy_User_ID: users[0].Grubsy_User_ID,
        Grubsy_Partner_ID: 'Grb-0001', // Hardcoded to match logged-in merchant
        Order_Date: '2024-01-15',
        Status: 'PENDING',
        Basket_SubTotal: '15.50',
        Service_Fee: '1.50',
        Delivery_Fee: '3.00',
        Order_Grand_total: '20.00',
        Tips: '2.00',
        Delivery_Address: '123 Test Street, London, SW1A 1AA',
        Users_Email: users[0].Users_Email,
        Driver_ID: null, // Available for pickup
        Created_At: new Date().toISOString(),
        Payment_Status: 'PAID',
        Users_Phone_number: users[0].Users_Phone_Number || '07123456789',
      },
      {
        Order_ID: 'ORD-002',
        Ordered_Items: 'Mixed Grill, Rice, Bread',
        Grubsy_User_ID: users[1]?.Grubsy_User_ID || users[0].Grubsy_User_ID,
        Grubsy_Partner_ID: 'Grb-0001', // All orders for the logged-in merchant
        Order_Date: '2024-01-15',
        Status: 'ACCEPTED', // In Progress section
        Basket_SubTotal: '22.00',
        Service_Fee: '2.00',
        Delivery_Fee: '3.00',
        Order_Grand_total: '27.00',
        Tips: '3.00',
        Delivery_Address: '456 Another Street, London, W1A 0AX',
        Users_Email: users[1]?.Users_Email || users[0].Users_Email,
        Driver_ID: null,
        Created_At: new Date().toISOString(),
        Payment_Status: 'PAID',
        Users_Phone_number: users[1]?.Users_Phone_Number || '07987654321',
        Restaurant_Accepted_At: new Date().toISOString(),
      },
      {
        Order_ID: 'ORD-003',
        Ordered_Items: 'Chicken Shawarma, Salad',
        Grubsy_User_ID: users[2]?.Grubsy_User_ID || users[0].Grubsy_User_ID,
        Grubsy_Partner_ID: 'Grb-0001',
        Order_Date: '2024-01-15',
        Status: 'DELIVERED', // Out for Delivery section
        Basket_SubTotal: '12.00',
        Service_Fee: '1.20',
        Delivery_Fee: '3.00',
        Order_Grand_total: '16.20',
        Tips: '1.80',
        Delivery_Address: '789 Third Avenue, London, EC1A 1BB',
        Users_Email: users[2]?.Users_Email || users[0].Users_Email,
        Driver_ID: 'GD-001',
        Created_At: new Date().toISOString(),
        Payment_Status: 'PAID',
        Users_Phone_number: users[2]?.Users_Phone_Number || '07555123456',
        Restaurant_Accepted_At: new Date().toISOString(),
        Out_For_Delivery_At: new Date().toISOString(),
      },
      {
        Order_ID: 'ORD-004',
        Ordered_Items: 'Falafel Wrap, Houmous, Water',
        Grubsy_User_ID: users[3]?.Grubsy_User_ID || users[0].Grubsy_User_ID,
        Grubsy_Partner_ID: 'Grb-0001',
        Order_Date: '2024-01-15',
        Status: 'PENDING', // Another pending order
        Basket_SubTotal: '9.50',
        Service_Fee: '0.95',
        Delivery_Fee: '3.00',
        Order_Grand_total: '13.45',
        Tips: '1.55',
        Delivery_Address: '321 Fourth Road, London, N1 1AA',
        Users_Email: users[3]?.Users_Email || users[0].Users_Email,
        Driver_ID: null,
        Created_At: new Date().toISOString(),
        Payment_Status: 'PAID',
        Users_Phone_number: users[3]?.Users_Phone_Number || '07444987654',
      }
    ];

    // Create the orders
    for (const orderData of testOrders) {
      try {
        const order = await prisma.orders.create({
          data: orderData,
          include: {
            merchant: {
              select: {
                Merchant: true,
              }
            },
            user: {
              select: {
                Users_Full_Name: true,
              }
            }
          }
        });
        
        console.log(`✅ Created order ${order.Order_ID} - ${order.merchant.Merchant} - Status: ${order.Status}`);
      } catch (error) {
        console.log(`❌ Failed to create order ${orderData.Order_ID}: ${error.message}`);
      }
    }

    // Summary
    const totalOrders = await prisma.orders.count();
    const pendingOrders = await prisma.orders.count({ where: { Status: 'PENDING', Driver_ID: null } });
    const activeOrders = await prisma.orders.count({ where: { Driver_ID: { not: null } } });

    console.log('\n📊 FINAL ORDER SUMMARY:');
    console.log(`📦 Total Orders: ${totalOrders}`);
    console.log(`🟡 Pending Orders (Available): ${pendingOrders}`);
    console.log(`🟢 Active Orders (Assigned): ${activeOrders}`);

    console.log('\n🎉 TEST ORDERS CREATED SUCCESSFULLY!');
    console.log('Now the driver app should show:');
    console.log('- 3 pending orders available for pickup');
    console.log('- 1 active order assigned to driver GD-001');
    console.log('- Proper establishment names instead of "Restaurant Unknown"');

  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrders();