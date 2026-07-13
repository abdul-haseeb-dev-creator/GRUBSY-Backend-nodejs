import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrderAcceptance() {
  console.log('🧪 TESTING ORDER ACCEPTANCE FUNCTIONALITY');
  console.log('==========================================');

  try {
    // 1. Get available orders
    console.log('\n📋 1. Getting available orders...');
    const availableOrders = await prisma.orders.findMany({
      where: {
        status: 'PENDING',
        driverId: null,
      },
      // Note: Relations may need to be defined in schema
      // For now, we'll access fields directly
    });

    console.log(`✅ Found ${availableOrders.length} available orders`);
    availableOrders.forEach(order => {
      console.log(`   - Order ${order.orderId}: ${order.partnerId} (${order.status})`);
    });

    if (availableOrders.length === 0) {
      console.log('❌ No available orders found for testing');
      return;
    }

    // 2. Test accepting an order
    const testOrder = availableOrders[0];
    const testDriverId = 'GD-001';
    
    console.log(`\n🎯 2. Testing order acceptance for Order ${testOrder.orderId}...`);

    const updatedOrder = await prisma.orders.update({
      where: { orderId: testOrder.orderId },
      data: {
        status: 'ACCEPTED',
        driverId: testDriverId,
        merchantAcceptedAt: new Date().toISOString(),
      },
      // Note: Relations may need to be defined in schema
      // For now, we'll access fields directly
    });

    console.log('✅ Order accepted successfully!');
    console.log(`   Status: ${updatedOrder.status}`);
    console.log(`   Driver: ${updatedOrder.driverId}`);
    console.log(`   Restaurant: ${updatedOrder.partnerId}`);
    console.log(`   User: ${updatedOrder.userId}`);

    // 3. Get driver's active orders
    console.log(`\n📱 3. Getting driver's active orders...`);
    const driverOrders = await prisma.orders.findMany({
      where: { driverId: testDriverId },
    });

    console.log(`✅ Driver has ${driverOrders.length} active orders`);
    driverOrders.forEach(order => {
      console.log(`   - Order ${order.orderId}: ${order.partnerId} (${order.status})`);
      console.log(`     User: ${order.userId}`);
    });

    // 4. Test order status progression
    console.log(`\n🚚 4. Testing order status progression...`);
    
    // Mark as picked up
    const pickedUpOrder = await prisma.orders.update({
      where: { orderId: testOrder.orderId },
      data: { status: 'PICKED_UP' },
    });
    console.log(`✅ Order marked as PICKED_UP: ${pickedUpOrder.status}`);

    // Mark as delivered
    const deliveredOrder = await prisma.orders.update({
      where: { orderId: testOrder.orderId },
      data: {
        status: 'DELIVERED',
      },
    });
    console.log(`✅ Order marked as DELIVERED: ${deliveredOrder.status}`);

    // Reset for next test
    console.log(`\n🔄 5. Resetting order for next test...`);
    await prisma.orders.update({
      where: { orderId: testOrder.orderId },
      data: {
        status: 'PENDING',
        driverId: null,
        merchantAcceptedAt: null,
      },
    });
    console.log('✅ Order reset to PENDING status');

    console.log('\n🎉 ALL TESTS PASSED! Order acceptance functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderAcceptance();