import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: "mysql://grubsy_admin:grubsyUp$94501@grubsy-db.c90wkau0i7vk.eu-west-2.rds.amazonaws.com:3306/grubsy?sslaccept=accept_invalid_certs&authPlugin=mysql_native_password"
});

async function checkMigration() {
  try {
    console.log('🔍 Checking AWS RDS Database Migration...\n');

    const merchants = await prisma.merchants.count();
    const menuItems = await prisma.menu_Items.count();
    const orders = await prisma.orders.count();
    const users = await prisma.users.count();
    const drivers = await prisma.drivers.count();

    console.log('📊 Migration Results:');
    console.log(`🏪 Merchants: ${merchants}`);
    console.log(`🍽️  Menu Items: ${menuItems}`);
    console.log(`📦 Orders: ${orders}`);
    console.log(`👥 Users: ${users}`);
    console.log(`🚗 Drivers: ${drivers}`);

    const totalRecords = merchants + menuItems + orders + users + drivers;
    console.log(`\n✅ Total Records: ${totalRecords}`);

    if (totalRecords > 0) {
      console.log('\n🎉 MIGRATION SUCCESSFUL! Your data is now on AWS! 🎉');
    } else {
      console.log('\n❌ MIGRATION FAILED! No data found.');
    }

  } catch (error) {
    console.error('❌ Error checking migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigration();
