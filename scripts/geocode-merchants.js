/**
 * Geocode Merchants Script
 *
 * This script geocodes all merchant addresses that don't have coordinates yet.
 * It uses the Google Maps Geocoding API to convert addresses to lat/lng coordinates.
 *
 * Usage: node scripts/geocode-merchants.js
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --force      Re-geocode all merchants, even those with existing coordinates
 */

import { PrismaClient } from "@prisma/client";
import { geocodeAddress } from "../integrations/google.js";

const prisma = new PrismaClient();

const isDryRun = process.argv.includes("--dry-run");
const forceAll = process.argv.includes("--force");

async function geocodeMerchants() {
  console.log("🗺️  Merchant Geocoding Script");
  console.log("================================");

  if (isDryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be made\n");
  }

  if (forceAll) {
    console.log("⚠️  FORCE MODE - Re-geocoding all merchants\n");
  }

  try {
    // Build query to find merchants needing geocoding
    const whereClause = forceAll
      ? {}
      : {
          OR: [{ coordinate_lat: null }, { coordinate_lon: null }],
        };

    const merchants = await prisma.Merchants.findMany({
      where: whereClause,
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Address: true,
        PostCode: true,
        Area: true,
        coordinate_lat: true,
        coordinate_lon: true,
      },
    });

    console.log(`📍 Found ${merchants.length} merchants to geocode\n`);

    if (merchants.length === 0) {
      console.log("✅ All merchants already have coordinates!");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const merchant of merchants) {
      // Build full address from available fields
      const addressParts = [
        merchant.Address,
        merchant.Area,
        merchant.PostCode,
      ].filter(Boolean);

      const fullAddress = addressParts.join(", ");

      if (!fullAddress || fullAddress.trim() === "") {
        console.log(
          `⏭️  Skipping ${merchant.Merchants_Name || merchant.id} - No address available`,
        );
        skippedCount++;
        continue;
      }

      console.log(
        `\n📍 Processing: ${merchant.Merchants_Name || merchant.Grubsy_Partner_ID}`,
      );
      console.log(`   Address: ${fullAddress}`);

      try {
        const result = await geocodeAddress(fullAddress);

        if (result) {
          console.log(
            `   ✅ Coordinates: ${result.latitude}, ${result.longitude}`,
          );

          if (!isDryRun) {
            await prisma.Merchants.update({
              where: { id: merchant.id },
              data: {
                coordinate_lat: result.latitude,
                coordinate_lon: result.longitude,
              },
            });
            console.log(`   💾 Saved to database`);
          } else {
            console.log(
              `   [DRY RUN] Would save: lat=${result.latitude}, lon=${result.longitude}`,
            );
          }

          successCount++;
        } else {
          console.log(`   ⚠️  No results found for address`);
          failCount++;
        }

        // Rate limiting: Google allows 50 requests/second, but let's be conservative
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        failCount++;
      }
    }

    console.log("\n================================");
    console.log("📊 Summary:");
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log("================================");
  } catch (error) {
    console.error("❌ Script error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
geocodeMerchants();
