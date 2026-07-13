// Quick script to check orders in database
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log("🔍 Checking orders in database...");

    // Count total orders
    const totalOrders = await prisma.orders.count();
    console.log(`📊 Total orders: ${totalOrders}`);

    if (totalOrders > 0) {
      // Get sample orders
      const sampleOrders = await prisma.orders.findMany({
        take: 3,
        select: {
          id: true,
          orderId: true,
          userEmail: true,
          userFullName: true,
          status: true,
          createdAt: true,
        },
      });

      console.log("📋 Sample orders:");
      sampleOrders.forEach((order) => {
        console.log(
          `  - ID: ${order.id}, User: ${order.userFullName || order.userEmail}, Status: ${order.status}`,
        );
      });
    } else {
      console.log("⚠️ No orders found in database");
    }

    // Check merchants
    const merchantCount = await prisma.merchants.count();
    console.log(`🏪 Total merchants: ${merchantCount}`);

    if (merchantCount > 0) {
      const sampleMerchants = await prisma.merchants.findMany({
        take: 2,
        select: {
          Grubsy_Partner_ID: true,
          Merchants_Name: true,
          Merchants_Email: true,
          Merchants_Password: true,
        },
      });

      console.log("🏪 Sample merchants:");
      sampleMerchants.forEach((merchant) => {
        console.log(
          `  - ${merchant.Merchants_Name} (${merchant.Grubsy_Partner_ID})`,
        );
        console.log(`    Email: ${merchant.Merchants_Email || "No email"}`);
        console.log(`    Has Password: ${!!merchant.Merchants_Password}`);
        console.log("---");
      });
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
