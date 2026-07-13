// Complete test of the user name display flow
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete User Name Display Flow...\n');

    // Step 1: Check if we have orders with user names
    console.log('📦 Step 1: Checking orders in database...');
    const orders = await prisma.orders.findMany({
      where: { partnerId: 'Grb-0001' },
      take: 3
    });

    console.log(`✅ Found ${orders.length} orders for merchant Grb-0001`);

    if (orders.length > 0) {
      console.log('📋 Sample order data:');
      orders.forEach((order, index) => {
        console.log(`   Order ${index + 1}:`);
        console.log(`     - ID: ${order.id}`);
        console.log(`     - userFullName: "${order.userFullName}"`);
        console.log(`     - userEmail: "${order.userEmail}"`);
        console.log(`     - Status: ${order.status}`);
      });
      console.log('');

      // Step 2: Simulate API response transformation
      console.log('🔄 Step 2: Simulating API response transformation...');
      const sampleOrder = orders[0];

      // Parse items
      let items = [];
      if (sampleOrder.orderedItems) {
        try {
          items = JSON.parse(sampleOrder.orderedItems);
        } catch (e) {
          console.error("Failed to parse order items:", e.message);
          items = [];
        }
      }

      // Extract postcode
      const deliveryAddress = sampleOrder.deliveryAddress || '';
      const addressParts = deliveryAddress.split(',');
      const postcode = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : deliveryAddress;

      const apiResponse = {
        id: sampleOrder.id,
        orderId: sampleOrder.id.substring(0, 8).toUpperCase(),
        userName: sampleOrder.userFullName || "Unknown Customer",
        userEmail: sampleOrder.userEmail,
        partnerId: sampleOrder.partnerId,
        items: items,
        basketSubtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryAddress: postcode,
        status: sampleOrder.status || "Placed",
        customer: sampleOrder.userFullName || "Unknown Customer",
        address: postcode,
        createdAt: sampleOrder.createdAt,
      };

      console.log('📤 API Response would be:');
      console.log(`   - userName: "${apiResponse.userName}"`);
      console.log(`   - customer: "${apiResponse.customer}"`);
      console.log(`   - address: "${apiResponse.address}"`);
      console.log('');

      // Step 3: Test the frontend formatting function
      console.log('🎨 Step 3: Testing frontend name formatting...');

      const formatUserNameForDisplay = (userName) => {
        if (!userName) return "Unknown";

        const nameParts = userName.trim().split(" ");
        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastNameInitial = nameParts[nameParts.length - 1]
            .charAt(0)
            .toUpperCase();
          return `${firstName} ${lastNameInitial}.`;
        }

        return userName;
      };

      const formattedName = formatUserNameForDisplay(apiResponse.userName);
      console.log(`✅ Original name: "${apiResponse.userName}"`);
      console.log(`✅ Formatted name: "${formattedName}"`);
      console.log('');

      // Step 4: Verify the complete flow
      console.log('🎯 Step 4: Complete Flow Verification');
      console.log('Database → API → Frontend formatting:');
      console.log(`   "${sampleOrder.userFullName}" → "${apiResponse.userName}" → "${formattedName}"`);

      if (formattedName !== "Unknown" && formattedName.includes(' ')) {
        console.log('✅ SUCCESS: User name is properly formatted and displayed!');
        console.log('📱 Dashboard should show:', formattedName);
        console.log('📮 Address should show:', apiResponse.address);
      } else {
        console.log('❌ ISSUE: Name formatting failed');
      }
    } else {
      console.log('⚠️ No orders found in database');
    }

  } catch (error) {
    console.error('❌ Error testing complete flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();