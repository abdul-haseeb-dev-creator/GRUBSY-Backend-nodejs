// Check what data exists in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');

    // Check Users
    const users = await prisma.Users.findMany({ select: { Grubsy_User_ID: true, Users_Email: true } });
    console.log(`👥 Users (${users.length}):`);
    users.forEach(user => console.log(`   - ${user.Grubsy_User_ID}: ${user.Users_Email}`));

    // Check Merchants
    const merchants = await prisma.merchants.findMany({ select: { Grubsy_Partner_ID: true, Merchants_Name: true } });
    console.log(`\n🏪 Merchants (${merchants.length}):`);
    merchants.forEach(merchant => console.log(`   - ${merchant.Grubsy_Partner_ID}: ${merchant.Merchants_Name}`));

    // Check Drivers
    const drivers = await prisma.Drivers.findMany({ select: { Driver_ID: true, Name: true } });
    console.log(`\n🚗 Drivers (${drivers.length}):`);
    drivers.forEach(driver => console.log(`   - ${driver.Driver_ID}: ${driver.Name}`));

    // Check Combos
    const combos = await prisma.Combos.findMany({ select: { Combo_ID: true, Combo_Name: true } });
    console.log(`\n🍽️  Combos (${combos.length}):`);
    combos.forEach(combo => console.log(`   - ${combo.Combo_ID}: ${combo.Combo_Name}`));

    // Check Orders
    const orders = await prisma.Orders.findMany({ select: { Order_ID: true, Users_Email: true, Status: true } });
    console.log(`\n📦 Orders (${orders.length}):`);
    orders.forEach(order => console.log(`   - ${order.Order_ID}: ${order.Users_Email} (${order.Status})`));

    // Check Combo Options
    const comboOptions = await prisma.Combo_Options.findMany({ select: { Combo_Option_ID: true, Option_Name: true, Combo_Name: true } });
    console.log(`\n🍔 Combo Options (${comboOptions.length}):`);
    comboOptions.forEach(option => console.log(`   - ${option.Combo_Option_ID}: ${option.Option_Name} (${option.Combo_Name})`));

  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();