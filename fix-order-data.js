import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixOrderData() {
  console.log('🔧 Fixing order data issues...');
  
  try {
    // Reset all orders to PENDING with no driver
    await prisma.order.updateMany({
      data: {
        status: 'PENDING',
        driverId: null,
        driverAssignedAt: null,
      },
    });
    console.log('✅ Reset all orders to PENDING');
    
    // Get proper merchants with real addresses
    const merchants = await prisma.merchant.findMany({
      where: { 
        address: { not: 'Address not provided' },
        name: { not: { startsWith: 'Restaurant LD-' } },
      },
    });
    
    console.log('🏪 Available merchants with proper data:');
    merchants.forEach(m => console.log(`- ${m.name}: ${m.address}`));
    
    if (merchants.length === 0) {
      console.log('❌ No proper merchants found, creating test merchants...');
      
      const testMerchants = [
        { name: 'La Damas', address: '277a High Street, Slough, Berkshire, SL1 1BN' },
        { name: 'Dodgers Dubai Droids', address: 'Windsor, SL4' },
        { name: 'Edens Eggs', address: '54 elm road, Windsor, SL4 3ND' }
      ];
      
      for (const merchant of testMerchants) {
        await prisma.merchant.create({ data: merchant });
        console.log(`✅ Created merchant: ${merchant.name}`);
      }
      
      // Refresh merchants list
      const newMerchants = await prisma.merchant.findMany({
        where: { 
          address: { not: 'Address not provided' },
          name: { not: { startsWith: 'Restaurant LD-' } }
        }
      });
      merchants.push(...newMerchants);
    }
    
    // Fix each order
    const orders = await prisma.order.findMany();
    console.log(`\n🔄 Fixing ${orders.length} orders...`);
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const merchant = merchants[i % merchants.length];
      
      let deliveryAddress = order.deliveryAddress;
      if (deliveryAddress === 'GRB-2024-001    ') {
        deliveryAddress = '123 Main Street, Windsor, SL4 1AB';
      }
      
      await prisma.order.update({
        where: { id: order.id },
        data: {
          merchantId: merchant.id,
          deliveryAddress: deliveryAddress,
        }
      });
      
      console.log(`✅ Fixed ${order.id}: ${merchant.name} → ${deliveryAddress}`);
    }
    
    // Verify the fixes
    console.log('\n📊 Final verification:');
    const finalOrders = await prisma.order.findMany({
      include: { 
        merchant: { select: { name: true, address: true } },
        user: { select: { name: true } },
      }
    });
    
    finalOrders.forEach(order => {
      console.log(`- ${order.id}: ${order.status} | ${order.user?.name} | ${order.merchant?.name} | ${order.deliveryAddress}`);
    });
    
    const pendingCount = finalOrders.filter(o => o.status === 'PENDING' && !o.driverId).length;
    const activeCount = finalOrders.filter(o => o.driverId).length;
    
    console.log(`\n🎯 Summary: ${activeCount} active orders, ${pendingCount} available orders`);
    console.log('✅ All data fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderData();