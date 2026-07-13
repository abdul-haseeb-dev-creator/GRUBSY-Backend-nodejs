// Test script to verify orders API works without authentication
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API functionality...');

    // Simulate what the API does - get orders for a specific merchant
    const merchantId = 'Grb-0001'; // La Damas partner ID

    console.log(`📦 Fetching orders for merchant: ${merchantId}`);

    const orders = await prisma.orders.findMany({
      where: {
        partnerId: merchantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get merchant info separately
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: merchantId },
      select: {
        Merchants_Name: true,
        Active: true
      }
    });

    console.log(`✅ Found ${orders.length} orders for merchant ${merchantId}`);

    if (orders.length > 0) {
      console.log('📋 Sample order data:');
      const sampleOrder = orders[0];

      // Parse items from JSON string
      let items = [];
      if (sampleOrder.orderedItems) {
        try {
          items = JSON.parse(sampleOrder.orderedItems);
        } catch (e) {
          console.error("Failed to parse order items:", e.message);
          items = [];
        }
      }

      // Simulate the API response transformation
      const transformedOrder = {
        id: sampleOrder.id,
        orderId: sampleOrder.id.substring(0, 8).toUpperCase(),
        userName: sampleOrder.userFullName || "Unknown Customer",
        userEmail: sampleOrder.userEmail,
        partnerId: sampleOrder.partnerId,
        grubsyPartnerId: sampleOrder.partnerId,
        items: items,
        basketSubtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryFee: 0,
        serviceFee: 0,
        grandTotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: sampleOrder.status || "Placed",
        orderStatus: sampleOrder.status || "Placed",
        deliveryAddress: sampleOrder.deliveryPostcode || 'No address',
        deliveryPostcode: sampleOrder.deliveryPostcode,
        restaurantName: merchant?.Merchants_Name || "Restaurant",
        createdAt: sampleOrder.createdAt,
        updatedAt: sampleOrder.updatedAt,
        customer: sampleOrder.userFullName || "Unknown Customer",
        address: sampleOrder.deliveryPostcode || 'No address',
        customerPhone: sampleOrder.userPhoneNumber || "No phone",
        orderSpecialRequests: sampleOrder.orderSpecialRequests || "",
      };

      console.log('🔍 Transformed order data:');
      console.log(`   Order ID: ${transformedOrder.orderId}`);
      console.log(`   Customer: ${transformedOrder.customer}`);
      console.log(`   Status: ${transformedOrder.status}`);
      console.log(`   Address: ${transformedOrder.address}`);
      console.log(`   Items: ${transformedOrder.items.length} items`);
      console.log(`   Total: £${transformedOrder.grandTotal.toFixed(2)}`);

      // Test the name formatting function
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

      const formattedName = formatUserNameForDisplay(transformedOrder.customer);
      console.log(`🎯 Formatted name: "${formattedName}"`);
    }

  } catch (error) {
    console.error('❌ Error testing orders API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrdersAPI();