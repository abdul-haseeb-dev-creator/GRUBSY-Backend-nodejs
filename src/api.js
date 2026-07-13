// grubsy-backend/src/api.js
import { PrismaClient } from "@prisma/client";
import express from "express";
import jwt from "jsonwebtoken";
import couriersRouter from "../routes/couriers.js";
import devicesRouter from "../routes/devices.js";
import merchantsRouter from "../routes/merchants.js";
import pricingRouter from "../routes/pricing.js";
import authRouter from "./auth.js";
import driverAuthRouter from "./driverAuth.js";
import driversRouter from "./drivers.js";
import paymentsRouter from "./payments.js";
import chatService from "./services/chatService.js";
import realtimeService from "./realtime.js";
import { authenticateDriver } from "./middleware/driverAuth.js";
import { badRequest, notFound, ok } from "./utils/validate.js";
import { formatDateTimeToISO } from "./utils/dateFormatter.js";
import adminRouter from "../routes/admin/index.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /api/merchants:
 *   get:
 *     summary: Get list of merchants/restaurants
 *     tags: [Merchants]
 *     parameters:
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter by cuisine type
 *       - in: query
 *         name: bookable
 *         schema:
 *           type: string
 *           enum: [yes]
 *         description: Filter for bookable restaurants only
 *     responses:
 *       200:
 *         description: List of merchants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Merchant'
 *       500:
 *         description: Server error
 */
// Merchant endpoints (querying Merchants table)
router.get("/merchants", async (req, res) => {
  const { cuisine, bookable, dietary } = req.query;

  try {
    const where = {
      OR: [{ Active: "Yes" }, { Active: "Active" }, { Active: "active" }],
    };
    if (cuisine) {
      where.Cuisine = cuisine;
    }
    if (bookable === "yes") {
      where.Booking_Available = "Yes";
    }

    // Apply dietary filtering
    if (dietary) {
      const dietaryFilters = dietary.split(',').map(d => d.trim().toLowerCase());

      // Build dietary where conditions
      const dietaryConditions = [];

      if (dietaryFilters.includes('halal')) {
        dietaryConditions.push({ Halal_Friendly: { not: null } });
        dietaryConditions.push({ Halal_Friendly: { not: "" } });
        dietaryConditions.push({ Halal_Friendly: { not: "No" } });
      }

      // Note: Other dietary preferences (vegetarian, vegan, etc.) would need additional
      // database fields to be properly implemented. For now, we only filter by halal
      // which is available in the Merchants table.

      if (dietaryConditions.length > 0) {
        where.AND = dietaryConditions;
      }
    }

    console.log("🔍 Fetching restaurants from MySQL with Prisma...");
    console.log("📊 Query filters:", { cuisine, bookable, where });

    const merchants = await prisma.merchants.findMany({
      where,
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Description: true,
        Cuisine: true,
        Address: true,
        Area: true,
        PostCode: true,
        Hygiene_Rating: true,
        Opening_Times: true,
        Halal_Friendly: true,
        Photo: true,
        Booking_Available: true,
        Active: true,
        coordinate_lat: true,
        coordinate_lon: true,
      },
    });

    console.log(`✅ Found ${merchants.length} merchants in MySQL database`);

    const restaurants = merchants.map((est) => ({
      id: est.id,
      partnerId: est.Grubsy_Partner_ID,
      name: est.Merchants_Name,
      description: est.Description,
      cuisine: est.Cuisine,
      address: est.Address,
      area: est.Area,
      postcode: est.PostCode,
      hygieneRating: est.Hygiene_Rating ? parseInt(est.Hygiene_Rating) || 0 : 0, // Convert to number
      openingTimes: est.Opening_Times,
      halalFriendly: est.Halal_Friendly,
      photo:
        est.Photo && !est.Photo.startsWith("http")
          ? `${process.env.BASE_URL || 'http://localhost:3002'}/uploads/restaurants/${est.Photo}`
          : est.Photo,
      photoUrl:
        est.Photo && !est.Photo.startsWith("http")
          ? `${process.env.BASE_URL || 'http://localhost:3002'}/uploads/restaurants/${est.Photo}`
          : est.Photo, // Backwards compatibility
      bookingAvailable: est.Booking_Available === "Yes",
      isOpen: est.Active === "Yes",
      status: est.Active, // Add status field for compatibility
      rating: 4.2, // Default rating - TODO: implement proper rating system
      // Coordinates for distance calculations
      coordinates: (est.coordinate_lat && est.coordinate_lon) ? {
        latitude: parseFloat(est.coordinate_lat),
        longitude: parseFloat(est.coordinate_lon),
      } : null,
      // Additional fields for complete frontend compatibility
      relation: est.Relation || null,
      ownerEmail: est.Owner_Email || null,
      createdAt: est.Created_at || null,
      ownerName: est.Owners_Name || null,
      ownerNumber: est.Owners_number || null,
    }));

    console.log("🍽️  Returning formatted restaurant data:", restaurants.length);
    console.log("📋 Sample restaurant data:", restaurants[0]);
    return ok(res, restaurants);
  } catch (error) {
    console.error("❌ Get restaurants error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get restaurants",
    });
  }
});

router.get("/merchants/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return badRequest(res, "merchant id required", "id");

  try {
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: id },
      // select: {
      //   id: true,
      //   Grubsy_Partner_ID: true,
      //   merchants_name: true,
      //   Description: true,
      //   Cuisine: true,
      //   Address: true,
      //   Area: true,
      //   PostCode: true,
      //   Hygiene_Rating: true,
      //   Opening_Times: true,
      //   Halal_Friendly: true,
      //   Photo: true,
      //   Booking_Available: true,
      //   Active: true,
      // },
    });

    if (!merchant) return notFound(res, "merchant not found");

    const restaurant = {
      id: merchant?.id,
      partnerId: merchant?.Grubsy_Partner_ID,
      name: merchant?.Merchants_Name,
      description: merchant?.Description,
      cuisine: merchant?.Cuisine,
      address: merchant?.Address,
      area: merchant?.Area,
      postcode: merchant?.PostCode,
      hygieneRating: merchant?.Hygiene_Rating
        ? parseInt(merchant?.Hygiene_Rating) || 0
        : 0, // Convert to number
      openingTimes: merchant?.Opening_Times,
      halalFriendly: merchant?.Halal_Friendly,
      photo:
        merchant?.Photo && !merchant?.Photo.startsWith("http")
          ? `${process.env.BASE_URL || 'http://localhost:3002'}/uploads/restaurants/${merchant?.Photo}`
          : merchant?.Photo,
      photoUrl:
        merchant?.Photo && !merchant?.Photo.startsWith("http")
          ? `${process.env.BASE_URL || 'http://localhost:3002'}/uploads/restaurants/${merchant?.Photo}`
          : merchant?.Photo, // Backwards compatibility
      bookingAvailable: merchant?.Booking_Available === "Yes",
      isOpen: merchant?.Active === "Yes",
      status: merchant?.Active, // Add status field for compatibility
      // Coordinates for distance calculations
      coordinates: (merchant?.coordinate_lat && merchant?.coordinate_lon) ? {
        latitude: parseFloat(merchant.coordinate_lat),
        longitude: parseFloat(merchant.coordinate_lon),
      } : null,
      // Additional fields for complete frontend compatibility
      relation: merchant?.Relation || null,
      ownerEmail: merchant?.Owner_Email || null,
      createdAt: merchant?.Created_at || null,
      ownerName: merchant?.Owners_Name || null,
      ownerNumber: merchant?.Owners_number || null,
    };

    return ok(res, restaurant);
  } catch (error) {
    console.error("Get restaurant error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get merchant" + error,
    });
  }
});

/**
 * @swagger
 * /api/admin/geocode-merchants:
 *   post:
 *     summary: Geocode all merchants that have postcodes but no coordinates (uses Google Maps API)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Geocoding results
 */
router.post("/admin/geocode-merchants", async (req, res) => {
  try {
    console.log("🌍 Starting merchant geocoding with Google Maps API...");

    // Import Google Maps geocoding
    const { geocodeAddress } = await import("../integrations/google.js");

    // Get all merchants with postcodes but no coordinates
    const merchants = await prisma.merchants.findMany({
      where: {
        PostCode: { not: null },
        OR: [
          { coordinate_lat: null },
          { coordinate_lon: null },
        ],
      },
      select: {
        id: true,
        Merchants_Name: true,
        PostCode: true,
        Address: true,
        coordinate_lat: true,
        coordinate_lon: true,
      },
    });

    console.log(`📍 Found ${merchants.length} merchants needing geocoding`);

    const results = [];

    for (const merchant of merchants) {
      const postcode = merchant.PostCode?.trim();
      if (!postcode) continue;

      try {
        // Use full address if available, otherwise just postcode
        const addressToGeocode = merchant.Address
          ? `${merchant.Address}, ${postcode}, UK`
          : `${postcode}, UK`;

        console.log(`🔍 Geocoding: ${merchant.Merchants_Name} - ${addressToGeocode}`);

        const geoResult = await geocodeAddress(addressToGeocode);

        if (geoResult && geoResult.latitude && geoResult.longitude) {
          // Update the merchant
          await prisma.merchants.update({
            where: { id: merchant.id },
            data: {
              coordinate_lat: geoResult.latitude,
              coordinate_lon: geoResult.longitude,
            },
          });

          results.push({
            id: merchant.id,
            name: merchant.Merchants_Name,
            postcode,
            status: "updated",
            coordinates: {
              latitude: geoResult.latitude,
              longitude: geoResult.longitude,
            },
            formattedAddress: geoResult.formattedAddress,
          });

          console.log(`✅ Updated ${merchant.Merchants_Name}: ${geoResult.formattedAddress} -> ${geoResult.latitude}, ${geoResult.longitude}`);
        } else {
          results.push({
            id: merchant.id,
            name: merchant.Merchants_Name,
            postcode,
            status: "skipped",
            reason: "No geocoding results found",
          });
          console.log(`⚠️ No results for ${merchant.Merchants_Name}: ${postcode}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (geoError) {
        results.push({
          id: merchant.id,
          name: merchant.Merchants_Name,
          postcode,
          status: "error",
          reason: geoError.message,
        });
        console.error(`❌ Error geocoding ${merchant.Merchants_Name}:`, geoError.message);
      }
    }

    const updated = results.filter(r => r.status === "updated").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    console.log(`🎉 Geocoding complete: ${updated} updated, ${skipped} skipped, ${errors} errors`);

    return ok(res, {
      message: `Geocoded ${updated} merchants, skipped ${skipped}, errors ${errors}`,
      results,
    });
  } catch (error) {
    console.error("❌ Geocoding error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to geocode merchants: " + error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/update-merchant-coordinates:
 *   post:
 *     summary: Update coordinates for a specific merchant
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 */
router.post("/admin/update-merchant-coordinates", async (req, res) => {
  try {
    const { partnerId, latitude, longitude } = req.body;

    if (!partnerId || latitude === undefined || longitude === undefined) {
      return badRequest(res, "partnerId, latitude, and longitude are required");
    }

    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: partnerId },
      data: {
        coordinate_lat: latitude,
        coordinate_lon: longitude,
      },
    });

    console.log(`✅ Updated coordinates for ${merchant.Merchants_Name}: ${latitude}, ${longitude}`);

    return ok(res, {
      message: "Coordinates updated successfully",
      merchant: {
        id: merchant.id,
        name: merchant.Merchants_Name,
        coordinates: { latitude, longitude },
      },
    });
  } catch (error) {
    console.error("❌ Update coordinates error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update coordinates: " + error.message,
    });
  }
});

router.get("/merchants/:id/menu", async (req, res) => {
  const { id } = req.params;
  if (!id) return badRequest(res, "merchant id required", "id");

  try {
    console.log("🍽️ Getting menu for merchant ID:", id);

    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: id },
      select: {
        Grubsy_Partner_ID: true,
      },
    });

    if (!merchant) {
      console.log("❌ Merchant not found with ID:", id);
      return notFound(res, "merchant not found");
    }

    console.log(
      "✅ Found merchant with Partner ID:",
      merchant.Grubsy_Partner_ID
    );

    const menuItems = await prisma.Menu_Items.findMany({
      where: {
        Grubsy_Partner_ID: merchant.Grubsy_Partner_ID,
        OR: [{ Available: "Yes" }, { Available: null }],
      },
      select: {
        id: true,
        Menu_Item_ID: true,
        Item: true,
        Food_Category: true,
        Regular: true,
        Medium: true,
        Large: true,
        Platter: true,
        Image: true,
        Description: true,
        Notes: true,
        Available: true,
        Free_Sides: true,
        Free_Sauces: true,
        Special_Instructions_Allowed: true,
      },
    });

    console.log(
      `🔍 Found ${menuItems.length} menu items for Partner ID: ${merchant.Grubsy_Partner_ID}`
    );

    if (menuItems.length === 0) {
      // Check if there are ANY menu items for this partner (regardless of availability)
      const allItems = await prisma.Menu_Items.findMany({
        where: {
          Grubsy_Partner_ID: merchant.Grubsy_Partner_ID,
        },
        select: {
          Available: true,
        },
      });
      console.log(
        `📊 Total items for Partner ID ${merchant.Grubsy_Partner_ID}: ${allItems.length}`
      );
      if (allItems.length > 0) {
        console.log(
          "📋 Availability status:",
          allItems.map((item) => item.Available)
        );
      }
    }

    const menu = menuItems.map((item) => ({
      id: item.id,
      menuItemId: item.Menu_Item_ID,
      name: item.Item,
      type: "item", // Default to 'item' type for regular menu items
      foodCategory: item.Food_Category, // Match frontend MenuItem type
      regularPrice: item.Regular
        ? parseFloat(item.Regular.replace(/[£$,]/g, ""))
        : null,
      mediumPrice: item.Medium
        ? parseFloat(item.Medium.replace(/[£$,]/g, ""))
        : null,
      largePrice: item.Large
        ? parseFloat(item.Large.replace(/[£$,]/g, ""))
        : null,
      platterPrice: item.Platter
        ? parseFloat(item.Platter.replace(/[£$,]/g, ""))
        : null,
      imageURL: item.Image,
      description: item.Description,
      notes: item.Notes,
      isAvailable: item.Available === "Yes",
      available: item.Available === "Yes", // Add for backwards compatibility
      soldOut: item.Available !== "Yes", // Add for menu screen availability checks
      options: [], // Add empty options array for compatibility
      // New fields for menu customization
      freeSides: item.Free_Sides,
      freeSauces: item.Free_Sauces,
      specialInstructionsAllowed: item.Special_Instructions_Allowed,
    }));

    console.log("✅ Returning menu with", menu.length, "items");
    if (menu.length > 0) {
      console.log("📋 Sample menu item data:");
      console.log("   - ID:", menu[0].id);
      console.log("   - Name:", menu[0].name);
      console.log("   - Food Category:", menu[0].foodCategory);
      console.log("   - Regular Price:", menu[0].regularPrice);
      console.log("   - Medium Price:", menu[0].mediumPrice);
      console.log("   - Large Price:", menu[0].largePrice);
      console.log("   - Platter Price:", menu[0].platterPrice);
      console.log("   - Image URL:", menu[0].imageURL);
      console.log("   - Description:", menu[0].description);
      console.log("   - Notes:", menu[0].notes);
      console.log("📊 Categories found:", [
        ...new Set(menu.map((item) => item.foodCategory || "No Category")),
      ]);
      console.log("📊 Price data summary:");
      console.log(
        "   - Items with Regular price:",
        menu.filter((i) => i.regularPrice).length
      );
      console.log(
        "   - Items with Medium price:",
        menu.filter((i) => i.mediumPrice).length
      );
      console.log(
        "   - Items with Large price:",
        menu.filter((i) => i.largePrice).length
      );
      console.log(
        "   - Items with Platter price:",
        menu.filter((i) => i.platterPrice).length
      );
      console.log(
        "   - Items with images:",
        menu.filter((i) => i.imageURL).length
      );
      console.log(
        "   - Items with descriptions:",
        menu.filter((i) => i.description).length
      );
    }
    return ok(res, menu);
  } catch (error) {
    console.error("Get menu error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get menu",
    });
  }
});

// =============================================================================
// MENU ITEM UPDATE ENDPOINT
// =============================================================================

/**
 * @swagger
 * /api/merchants/{merchantId}/menu/{itemId}:
 *   patch:
 *     summary: Update a menu item
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchant Partner ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               available:
 *                 type: boolean
 *               price:
 *                 type: number
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Server error
 */
router.patch("/merchants/:merchantId/menu/:itemId", async (req, res) => {
  const { merchantId, itemId } = req.params;
  const updates = req.body;

  console.log(`📝 Updating menu item ${itemId} for merchant ${merchantId}:`, updates);

  try {
    // Find the menu item
    const menuItem = await prisma.Menu_Items.findFirst({
      where: {
        Grubsy_Partner_ID: merchantId,
        Menu_Item_ID: itemId,
      },
    });

    if (!menuItem) {
      return notFound(res, "Menu item not found");
    }

    // Build update data
    const updateData = {};
    
    if (updates.available !== undefined) {
      updateData.Available = updates.available ? "Yes" : "No";
      updateData.LastToggledAt = new Date().toISOString();
    }
    if (updates.name !== undefined) {
      updateData.Item = updates.name;
    }
    if (updates.description !== undefined) {
      updateData.Description = updates.description;
    }
    if (updates.price !== undefined) {
      updateData.Regular = `£${updates.price.toFixed(2)}`;
    }
    if (updates.regularPrice !== undefined) {
      updateData.Regular = `£${updates.regularPrice.toFixed(2)}`;
    }
    if (updates.mediumPrice !== undefined) {
      updateData.Medium = `£${updates.mediumPrice.toFixed(2)}`;
    }
    if (updates.largePrice !== undefined) {
      updateData.Large = `£${updates.largePrice.toFixed(2)}`;
    }
    if (updates.platterPrice !== undefined) {
      updateData.Platter = `£${updates.platterPrice.toFixed(2)}`;
    }
    if (updates.image !== undefined) {
      updateData.Image = updates.image;
    }
    if (updates.foodCategory !== undefined) {
      updateData.Food_Category = updates.foodCategory;
    }
    
    updateData.Updated_At = new Date().toISOString();

    // Update the menu item
    const updatedItem = await prisma.Menu_Items.update({
      where: { id: menuItem.id },
      data: updateData,
    });

    console.log(`✅ Menu item ${itemId} updated successfully`);

    return ok(res, {
      id: updatedItem.id,
      menuItemId: updatedItem.Menu_Item_ID,
      name: updatedItem.Item,
      description: updatedItem.Description,
      regularPrice: updatedItem.Regular ? parseFloat(updatedItem.Regular.replace(/[£$,]/g, "")) : null,
      mediumPrice: updatedItem.Medium ? parseFloat(updatedItem.Medium.replace(/[£$,]/g, "")) : null,
      largePrice: updatedItem.Large ? parseFloat(updatedItem.Large.replace(/[£$,]/g, "")) : null,
      platterPrice: updatedItem.Platter ? parseFloat(updatedItem.Platter.replace(/[£$,]/g, "")) : null,
      available: updatedItem.Available === "Yes",
      isAvailable: updatedItem.Available === "Yes",
      foodCategory: updatedItem.Food_Category,
      imageURL: updatedItem.Image,
      updatedAt: updatedItem.Updated_At,
    });
  } catch (error) {
    console.error("❌ Update menu item error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update menu item",
    });
  }
});

// =============================================================================
// GET DRIVER BY ID (PUBLIC ENDPOINT FOR STORE APP)
// =============================================================================

/**
 * @swagger
 * /api/drivers/{driverId}:
 *   get:
 *     summary: Get driver info by ID
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver info retrieved successfully
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
router.get("/drivers/:driverId", async (req, res) => {
  const { driverId } = req.params;

  console.log(`🚗 Fetching driver info for: ${driverId}`);

  try {
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: driverId },
      select: {
        Driver_ID: true,
        first_name: true,
        last_name: true,
        profile_photo_url: true,
        phone: true,
        vehicle_type: true,
        rating: true,
        completed_orders: true,
      },
    });

    if (!driver) {
      return notFound(res, "Driver not found");
    }

    return ok(res, {
      id: driver.Driver_ID,
      firstName: driver.first_name,
      lastName: driver.last_name,
      fullName: `${driver.first_name} ${driver.last_name}`,
      photo: driver.profile_photo_url,
      phone: driver.phone,
      vehicleType: driver.vehicle_type,
      rating: parseFloat(driver.rating) || 0,
      completedOrders: driver.completed_orders || 0,
    });
  } catch (error) {
    console.error("❌ Get driver error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get driver info",
    });
  }
});

// =============================================================================
// MERCHANT SETTINGS ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/merchants/settings/business-info:
 *   get:
 *     summary: Get merchant business info
 *     tags: [Merchant Settings]
 */
router.get("/merchants/settings/business-info", async (req, res) => {
  const { partnerId } = req.query;

  if (!partnerId) {
    return badRequest(res, "partnerId query parameter required");
  }

  console.log(`🏪 Fetching business info for partner: ${partnerId}`);

  try {
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: partnerId },
    });

    if (!merchant) {
      return notFound(res, "Merchant not found");
    }

    return ok(res, {
      partnerId: merchant.Grubsy_Partner_ID,
      businessName: merchant.Merchants_Name,
      description: merchant.Description,
      cuisine: merchant.Cuisine,
      address: merchant.Address,
      area: merchant.Area,
      postcode: merchant.PostCode,
      phone: merchant.Owners_Number,
      email: merchant.Merchants_Email,
      hygieneRating: merchant.Hygiene_Rating,
      halalFriendly: merchant.Halal_Friendly,
      photo: merchant.Photo,
      active: merchant.Active === "Yes",
    });
  } catch (error) {
    console.error("❌ Get business info error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get business info",
    });
  }
});

router.put("/merchants/settings/business-info", async (req, res) => {
  const { partnerId, businessName, description, cuisine, address, area, postcode, phone, email, halalFriendly, photo } = req.body;

  if (!partnerId) {
    return badRequest(res, "partnerId required in request body");
  }

  console.log(`🏪 Updating business info for partner: ${partnerId}`);

  try {
    const updateData = {};
    if (businessName !== undefined) updateData.Merchants_Name = businessName;
    if (description !== undefined) updateData.Description = description;
    if (cuisine !== undefined) updateData.Cuisine = cuisine;
    if (address !== undefined) updateData.Address = address;
    if (area !== undefined) updateData.Area = area;
    if (postcode !== undefined) updateData.PostCode = postcode;
    if (phone !== undefined) updateData.Owners_Number = phone;
    if (email !== undefined) updateData.Merchants_Email = email;
    if (halalFriendly !== undefined) updateData.Halal_Friendly = halalFriendly;
    if (photo !== undefined) updateData.Photo = photo;

    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: partnerId },
      data: updateData,
    });

    console.log(`✅ Business info updated for partner: ${partnerId}`);

    return ok(res, {
      partnerId: merchant.Grubsy_Partner_ID,
      businessName: merchant.Merchants_Name,
      description: merchant.Description,
      cuisine: merchant.Cuisine,
      address: merchant.Address,
      area: merchant.Area,
      postcode: merchant.PostCode,
      phone: merchant.Owners_Number,
      email: merchant.Merchants_Email,
      halalFriendly: merchant.Halal_Friendly,
      photo: merchant.Photo,
      message: "Business info updated successfully",
    });
  } catch (error) {
    console.error("❌ Update business info error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update business info",
    });
  }
});

/**
 * @swagger
 * /api/merchants/settings/opening-hours:
 *   get:
 *     summary: Get merchant opening hours
 *     tags: [Merchant Settings]
 */
router.get("/merchants/settings/opening-hours", async (req, res) => {
  const { partnerId } = req.query;

  if (!partnerId) {
    return badRequest(res, "partnerId query parameter required");
  }

  console.log(`⏰ Fetching opening hours for partner: ${partnerId}`);

  try {
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: partnerId },
      select: {
        Grubsy_Partner_ID: true,
        Opening_Times: true,
      },
    });

    if (!merchant) {
      return notFound(res, "Merchant not found");
    }

    // Parse opening times - might be JSON or a simple string
    let openingHours = {};
    try {
      if (merchant.Opening_Times) {
        openingHours = JSON.parse(merchant.Opening_Times);
      }
    } catch {
      // If not JSON, return as raw string
      openingHours = { raw: merchant.Opening_Times };
    }

    return ok(res, {
      partnerId: merchant.Grubsy_Partner_ID,
      openingHours,
    });
  } catch (error) {
    console.error("❌ Get opening hours error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get opening hours",
    });
  }
});

router.put("/merchants/settings/opening-hours", async (req, res) => {
  const { partnerId, openingHours } = req.body;

  if (!partnerId) {
    return badRequest(res, "partnerId required in request body");
  }

  console.log(`⏰ Updating opening hours for partner: ${partnerId}`);

  try {
    // Store as JSON string
    const openingTimesStr = typeof openingHours === "string" 
      ? openingHours 
      : JSON.stringify(openingHours);

    const merchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: partnerId },
      data: { Opening_Times: openingTimesStr },
    });

    console.log(`✅ Opening hours updated for partner: ${partnerId}`);

    return ok(res, {
      partnerId: merchant.Grubsy_Partner_ID,
      openingHours: openingHours,
      message: "Opening hours updated successfully",
    });
  } catch (error) {
    console.error("❌ Update opening hours error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update opening hours",
    });
  }
});

/**
 * @swagger
 * /api/merchants/settings/payment-methods:
 *   get:
 *     summary: Get merchant payment methods
 *     tags: [Merchant Settings]
 */
router.get("/merchants/settings/payment-methods", async (req, res) => {
  const { partnerId } = req.query;

  if (!partnerId) {
    return badRequest(res, "partnerId query parameter required");
  }

  console.log(`💳 Fetching payment methods for partner: ${partnerId}`);

  try {
    // For now, return default payment methods
    // In future, this could be stored in a separate table
    return ok(res, {
      partnerId,
      paymentMethods: {
        card: true,
        cash: true,
        applePay: false,
        googlePay: false,
      },
      bankDetails: {
        accountName: null,
        accountNumber: null,
        sortCode: null,
      },
    });
  } catch (error) {
    console.error("❌ Get payment methods error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get payment methods",
    });
  }
});

router.put("/merchants/settings/payment-methods", async (req, res) => {
  const { partnerId, paymentMethods, bankDetails } = req.body;

  if (!partnerId) {
    return badRequest(res, "partnerId required in request body");
  }

  console.log(`💳 Updating payment methods for partner: ${partnerId}`);

  try {
    // For now, just return success
    // In future, this would update a payment_settings table
    console.log(`✅ Payment methods updated for partner: ${partnerId}`);

    return ok(res, {
      partnerId,
      paymentMethods,
      bankDetails,
      message: "Payment methods updated successfully",
    });
  } catch (error) {
    console.error("❌ Update payment methods error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update payment methods",
    });
  }
});

/**
 * @swagger
 * /api/merchants/settings/push-notifications:
 *   get:
 *     summary: Get merchant push notification settings
 *     tags: [Merchant Settings]
 */
router.get("/merchants/settings/push-notifications", async (req, res) => {
  const { partnerId } = req.query;

  if (!partnerId) {
    return badRequest(res, "partnerId query parameter required");
  }

  console.log(`🔔 Fetching push notification settings for partner: ${partnerId}`);

  try {
    // Default notification settings
    return ok(res, {
      partnerId,
      notifications: {
        newOrders: true,
        orderUpdates: true,
        driverArrival: true,
        customerMessages: true,
        promotions: false,
        weeklyReport: true,
      },
      soundEnabled: true,
      vibrationEnabled: true,
    });
  } catch (error) {
    console.error("❌ Get push notifications error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get push notification settings",
    });
  }
});

router.put("/merchants/settings/push-notifications", async (req, res) => {
  const { partnerId, notifications, soundEnabled, vibrationEnabled } = req.body;

  if (!partnerId) {
    return badRequest(res, "partnerId required in request body");
  }

  console.log(`🔔 Updating push notification settings for partner: ${partnerId}`);

  try {
    // For now, just return success
    // In future, this would update a notification_settings table
    console.log(`✅ Push notification settings updated for partner: ${partnerId}`);

    return ok(res, {
      partnerId,
      notifications,
      soundEnabled,
      vibrationEnabled,
      message: "Push notification settings updated successfully",
    });
  } catch (error) {
    console.error("❌ Update push notifications error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update push notification settings",
    });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders by user email
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: userEmail
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter orders by user email
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userEmail, items, deliveryAddress]
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: 'customer@example.com'
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *               subtotal:
 *                 type: number
 *                 example: 15.50
 *               deliveryFee:
 *                 type: number
 *                 example: 3.50
 *               serviceFee:
 *                 type: number
 *                 example: 1.25
 *               grandTotal:
 *                 type: number
 *                 example: 20.25
 *               deliveryAddress:
 *                 type: string
 *                 example: '123 Main Street, London, SW1A 1AA'
 *               deliveryPostcode:
 *                 type: string
 *                 example: 'SW1A 1AA'
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: 'ORDER-1693123456789-ABC123'
 *                     status:
 *                       type: string
 *                       example: 'Placed'
 *                     message:
 *                       type: string
 *                       example: 'Order placed successfully'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */

router.get("/orders", async (req, res) => {
  const { userEmail, partnerId, grubsyPartnerId, status } = req.query;

  console.log("📦 Fetching orders with filters:", {
    userEmail,
    partnerId,
    grubsyPartnerId,
    status
  });

  try {
    // Build where clause based on available filters
    const where = {};

    if (userEmail) {
      where.userEmail = userEmail;
    }

    if (partnerId) {
      where.partnerId = partnerId;
    }

    if (grubsyPartnerId) {
      where.grubsyPartnerId = grubsyPartnerId;
    }

    if (status) {
      where.Status = status;
    }

    // Require at least one filter for security
    

    const orders = await prisma.orders.findMany({
      where,
    });

    const formattedOrders = orders.map((order) => {
      let items = [];
      if (order.orderedItems) {
        try {
          items = JSON.parse(order.orderedItems);
        } catch (e) {
          console.error("Failed to parse order items for order ID:", order.id, "Error:", e.message);
          items = [];
        }
      }

      const orderData = {
        id: order.id,
        orderId: order.orderId,
        userEmail: order.userEmail,
        partnerId: order.partnerId,
        grubsyPartnerId: order.grubsyPartnerId,
        items: order.orderedItems ?? "",
        basketSubtotal: parseFloat(order.basketSubtotal || "0"),
        deliveryFee: parseFloat(order.Delivery_Fee || "3.15"),
        serviceFee: parseFloat(order.Service_Fee || "0"),
        grandTotal: parseFloat(order.orderGrandTotal || "0"),
        status: order.status || "Placed",
        orderStatus: order.status || "Placed",
        deliveryAddress: order.Delivery_Address,
        deliveryPostcode: order.Delivery_Postcode,
        restaurantName: order.merchants?.Merchants_Name || "Restaurant",
        createdAt: formatDateTimeToISO(order.createdAt),
        updatedAt: formatDateTimeToISO(order.Updated_At),
        deliveredAt: formatDateTimeToISO(order.deliveredAt),
        acceptedAt: formatDateTimeToISO(order.acceptedAt),
        readyAt: formatDateTimeToISO(order.readyAt),
        pickedUpAt: formatDateTimeToISO(order.pickedUpAt),
        cancelledAt: formatDateTimeToISO(order.cancelledAt),
        customer: order.customer || "Customer",
        address: order.deliveryAddress || "No address",
        customerPhone: order.userPhoneNumber || "No phone",
      };

      return orderData;
    });

    console.log(`✅ Found ${orders.length} orders with filters:`, { userEmail, partnerId, grubsyPartnerId, status, formattedOrders });
    return ok(res, formattedOrders);
  } catch (error) {
    console.error("❌ Get orders error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get orders",
    });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const orderData = req.body;

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    // Generate 4-digit pickup and delivery codes for verification
    const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();
    const pickupCode = generateCode();
    const deliveryCode = generateCode();

    // Create order in database using existing Orders table structure
    const order = await prisma.orders.create({
      data: {
        orderId: orderId,
        userEmail: orderData.userEmail,
        orderedItems: JSON.stringify(orderData.items),
        Basket_SubTotal:
          orderData.subtotal?.toString() || orderData.total?.toString() || "0",
        Delivery_Fee: orderData.deliveryFee?.toString() || "0",
        Service_Fee: orderData.serviceFee?.toString() || "0",
        Order_Grand_total: orderData.grandTotal?.toString() || "0",
        Status: "PENDING",
        Delivery_Address: orderData.deliveryAddress || "",
        Delivery_Postcode: orderData.deliveryPostcode || "",
        pickupCode: pickupCode,
        deliveryCode: deliveryCode,
        createdAt: new Date().toISOString(),
        Updated_At: new Date().toISOString(),
      },
    });

    console.log(`✅ Order created successfully: ${orderId}`);
    console.log(`📋 Pickup Code: ${pickupCode}, Delivery Code: ${deliveryCode}`);
    return ok(res, {
      orderId: order.orderId,
      status: order.Status,
      pickupCode: pickupCode,
      deliveryCode: deliveryCode,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (Accept/Reject orders)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['PENDING', 'ACCEPTED', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'ALLOCATED_DRIVER', 'AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
 *                 example: 'ACCEPTED'
 *               reason:
 *                 type: string
 *                 description: Cancellation reason (required for CANCELLED status)
 *               refund:
 *                 type: boolean
 *                 description: Whether to refund the order (for cancellations)
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition or missing required fields
 *       401:
 *         description: Unauthorized (invalid/missing token)
 *       403:
 *         description: Forbidden (merchant doesn't own this order)
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order already in that status
 *       500:
 *         description: Server error
 */
router.patch("/orders/:orderId/status", async (req, res) => {
  console.log('🔄 PATCH /api/orders/:orderId/status - REQUEST RECEIVED');
  console.log('📥 Request details:', {
    method: req.method,
    path: req.path,
    url: req.url,
    orderId: req.params.orderId,
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
      'content-type': req.headers['content-type'],
    },
  });

  const { orderId } = req.params;
  const { status, reason, refund } = req.body;

  console.log('🔍 Request parsed:', {
    orderId,
    status,
    reason,
    refund,
  });

  try {
    // Validate status
    const validStatuses = ['PENDING', 'ACCEPTED', 'READY_FOR_DRIVER', 'ALLOCATING_DRIVER', 'ALLOCATED_DRIVER', 'AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return badRequest(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Authenticate merchant from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Check if token is for merchant
    if (decoded.aud !== 'merchant') {
      return res.status(401).json({
        success: false,
        error: 'Invalid merchant token',
      });
    }

    const merchantPartnerId = decoded.partnerId;
    if (!merchantPartnerId) {
      console.log('❌ Merchant partner ID not found in token');
      return res.status(401).json({
        success: false,
        error: 'Merchant partner ID not found in token',
      });
    }

    console.log('✅ JWT token decoded:', {
      merchantId: decoded.sub,
      partnerId: merchantPartnerId,
      role: decoded.role,
      aud: decoded.aud,
    });

    // Find the order
    // Note: The orderId param might be either the Prisma id or the business orderId
    // Try both: first by Prisma id, then by business orderId
    console.log(`🔍 Finding order in database: ${orderId}`);
    
    let order = await prisma.orders.findUnique({
      where: { id: orderId },
    });
    
    // If not found by id, try by orderId (business order ID like 'GDS-002BC')
    if (!order) {
      console.log(`⚠️ Order not found by id, trying by orderId: ${orderId}`);
      order = await prisma.orders.findUnique({
        where: { orderId: orderId },
      });
    }
    
    console.log('📦 Order lookup result:', {
      found: !!order,
      orderId: order?.orderId,
      orderPartnerId: order?.partnerId,
      orderStatus: order?.status,
      id: order?.id,
    });

    if (!order) {
      return notFound(res, 'Order not found');
    }

    // Verify merchant owns this order (case-insensitive comparison)
    const orderPartnerId = (order.partnerId || '').toUpperCase().trim();
    const merchantId = (merchantPartnerId || '').toUpperCase().trim();
    
    console.log('🔒 Ownership check:', {
      orderPartnerId: order.partnerId,
      merchantPartnerId: merchantPartnerId,
      normalizedOrder: orderPartnerId,
      normalizedMerchant: merchantId,
      match: orderPartnerId === merchantId,
    });
    
    if (orderPartnerId !== merchantId) {
      console.log('❌ Ownership check FAILED - Order does not belong to merchant');
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this order',
      });
    }
    
    console.log('✅ Ownership verified - Merchant owns this order');

    // Validate status transitions
    const currentStatus = order.status;
    console.log(`🔄 Status transition: ${currentStatus} → ${status}`);
    
    // Accept order validation
    if (status === 'ACCEPTED') {
      if (currentStatus !== 'PENDING') {
        return badRequest(res, `Cannot accept order. Order must be in PENDING status, current status: ${currentStatus}`);
      }
    }

    // Ready for driver validation - merchant marks order as ready
    if (status === 'READY_FOR_DRIVER') {
      if (currentStatus !== 'ACCEPTED') {
        return badRequest(res, `Cannot mark order as ready. Order must be in ACCEPTED status, current status: ${currentStatus}`);
      }
    }

    // Cancel order validation
    if (status === 'CANCELLED') {
      if (currentStatus === 'DELIVERED') {
        return badRequest(res, 'Cannot cancel an order that has already been delivered');
      }
      if (currentStatus === 'CANCELLED') {
        return res.status(409).json({
          success: false,
          error: 'Order is already cancelled',
        });
      }
      if (!reason && currentStatus !== 'PENDING') {
        return badRequest(res, 'Cancellation reason is required');
      }
    }

    // Check if already in target status
    if (currentStatus === status) {
      return res.status(409).json({
        success: false,
        error: `Order is already in ${status} status`,
      });
    }

    // Prepare update data
    const updateData = {
      status: status,
    };

    // Set status-specific timestamps
    // Note: merchantAcceptedAt is a String field in the schema (mapped from "Merchant_Accepted_At:")
    if (status === 'ACCEPTED') {
      updateData.merchantAcceptedAt = new Date().toISOString();
      updateData.acceptedAt = new Date(); // acceptedAt is DateTime
    }

    if (status === 'READY_FOR_DRIVER') {
      updateData.readyAt = new Date(); // readyAt is DateTime
      updateData.driverAllocatingAt = new Date().toISOString(); // Start driver allocation process
      // Transition immediately to ALLOCATING_DRIVER - system is actively finding a driver
      updateData.status = 'ALLOCATING_DRIVER';
      console.log(`📋 Order ${orderId} transitioning to ALLOCATING_DRIVER - system finding available drivers`);
      
      // 🚀 Push notification to nearby drivers within 2-mile radius
      try {
        const pushService = (await import('./services/pushService.js')).default;
        await pushService.notifyNearbyDrivers(orderId, { ...order, ...updateData });
      } catch (pushError) {
        console.error('Push notification error (non-blocking):', pushError);
      }
    }

    if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date(); // cancelledAt is DateTime
      if (reason) {
        updateData.cancellationReason = reason;
      }
    }

    console.log('💾 Updating order in database:', {
      orderId,
      updateData,
    });

    // Update order
    // Try to update by id first, then by orderId if needed
    let updatedOrder;
    try {
      updatedOrder = await prisma.orders.update({
        where: { id: order.id }, // Use the id from the found order
        data: updateData,
      });
    } catch (updateError) {
      // If update by id fails, try by orderId (shouldn't happen, but safety check)
      console.warn('⚠️ Update by id failed, trying by orderId:', updateError.message);
      updatedOrder = await prisma.orders.update({
        where: { orderId: order.orderId },
        data: updateData,
      });
    }
    
    console.log('✅ Order updated successfully in database');

    // Fetch merchant name separately if partnerId exists
    let restaurantName = "Restaurant";
    if (updatedOrder.partnerId) {
      try {
        const merchant = await prisma.merchants.findUnique({
          where: { Grubsy_Partner_ID: updatedOrder.partnerId },
          select: { Merchants_Name: true },
        });
        if (merchant) {
          restaurantName = merchant.Merchants_Name;
        }
      } catch (e) {
        console.warn('Could not fetch merchant name:', e);
      }
    }

    // Parse order items if available
    let items = [];
    if (updatedOrder.orderedItems) {
      try {
        items = JSON.parse(updatedOrder.orderedItems);
      } catch (e) {
        items = [];
      }
    }

    // Format response with all order fields (matching GET /orders format)
    const formattedOrder = {
      id: updatedOrder.id,
      orderId: updatedOrder.orderId,
      userEmail: updatedOrder.userEmail,
      partnerId: updatedOrder.partnerId,
      grubsyPartnerId: updatedOrder.grubsyPartnerId,
      items: items,
      basketSubtotal: parseFloat(updatedOrder.basketSubtotal || "0"),
      deliveryFee: parseFloat(updatedOrder.Delivery_Fee || "0"),
      serviceFee: parseFloat(updatedOrder.Service_Fee || "0"),
      grandTotal: parseFloat(updatedOrder.orderGrandTotal || "0"),
      status: updatedOrder.status || "Placed",
      orderStatus: updatedOrder.status || "Placed",
      deliveryAddress: updatedOrder.Delivery_Address,
      deliveryPostcode: updatedOrder.Delivery_Postcode,
      restaurantName: restaurantName,
      createdAt: formatDateTimeToISO(updatedOrder.createdAt),
      updatedAt: formatDateTimeToISO(
        status === 'ACCEPTED' ? updatedOrder.acceptedAt || updatedOrder.merchantAcceptedAt :
        status === 'CANCELLED' ? updatedOrder.cancelledAt :
        updatedOrder.acceptedAt || updatedOrder.merchantAcceptedAt || updatedOrder.cancelledAt || updatedOrder.createdAt
      ),
      deliveredAt: formatDateTimeToISO(updatedOrder.deliveredAt),
      acceptedAt: formatDateTimeToISO(updatedOrder.acceptedAt),
      readyAt: formatDateTimeToISO(updatedOrder.readyAt),
      pickedUpAt: formatDateTimeToISO(updatedOrder.pickedUpAt),
      cancelledAt: formatDateTimeToISO(updatedOrder.cancelledAt),
      merchantAcceptedAt: formatDateTimeToISO(updatedOrder.merchantAcceptedAt),
      driverAllocatingAt: formatDateTimeToISO(updatedOrder.driverAllocatingAt),
      cancellationReason: updatedOrder.cancellationReason || null,
      customer: updatedOrder.customer || "Customer",
      address: updatedOrder.deliveryAddress || updatedOrder.Delivery_Address || "No address",
      customerPhone: updatedOrder.userPhoneNumber || "No phone",
    };

    console.log(`✅ Order ${orderId} status updated successfully from ${currentStatus} to ${status} by merchant ${merchantPartnerId}`);
    console.log('📤 Sending response:', {
      orderId: formattedOrder.orderId,
      status: formattedOrder.status,
      partnerId: formattedOrder.partnerId,
    });

    return ok(res, formattedOrder);

  } catch (error) {
    console.error('❌ Update order status error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to update order status',
      message: error.message,
    });
  }
});

// Merchant auth routes (for establishments app)
router.post("/merchants/auth/login", async (req, res) => {
  try {
    const response = await authRouter.handleLogin(req, res);
    return response;
  } catch (error) {
    console.error("Merchant login error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to login merchant",
    });
  }
});

router.post("/merchants/auth/logout", async (req, res) => {
  try {
    // Simple logout - just return success
    return ok(res, { message: "Logged out successfully" });
  } catch (error) {
    console.error("Merchant logout error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to logout",
    });
  }
});

router.post("/merchants/auth/refresh", async (req, res) => {
  try {
    // Token refresh logic would go here
    return ok(res, { message: "Token refreshed" });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
});

// Merchant profile routes
router.get("/merchants/profile", async (req, res) => {
  try {
    // Get merchant profile based on authenticated user
    // This would need proper auth middleware
    const merchantId = req.query.merchantId || "GRB-0001"; // Default for now
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: merchantId },
      select: {
        id: true,
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
        Description: true,
        Cuisine: true,
        Address: true,
        Area: true,
        PostCode: true,
        Hygiene_Rating: true,
        Opening_Times: true,
        Halal_Friendly: true,
        Photo: true,
        Booking_Available: true,
        Active: true,
        Owner_Email: true,
        Created_at: true,
        Owners_Name: true,
        Owners_number: true,
      },
    });

    if (!merchant) return notFound(res, "Merchant not found");

    return ok(res, {
      id: merchant.id,
      partnerId: merchant.Grubsy_Partner_ID,
      name: merchant.Merchants_Name,
      description: merchant.Description,
      cuisine: merchant.Cuisine,
      address: merchant.Address,
      area: merchant.Area,
      postcode: merchant.PostCode,
      hygieneRating: merchant.Hygiene_Rating
        ? parseInt(merchant.Hygiene_Rating) || 0
        : 0,
      openingTimes: merchant.Opening_Times,
      halalFriendly: merchant.Halal_Friendly,
      photo: merchant.Photo,
      bookingAvailable: merchant.Booking_Available === "Yes",
      isActive: merchant.Active === "Yes",
      ownerEmail: merchant.Owner_Email,
      createdAt: merchant.Created_at,
      ownerName: merchant.Owners_Name,
      ownerNumber: merchant.Owners_number,
    });
  } catch (error) {
    console.error("Get merchant profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get merchant profile",
    });
  }
});

router.put("/merchants/profile", async (req, res) => {
  try {
    const updateData = req.body;
    const merchantId = req.query.merchantId || "GRB-0001"; // Default for now

    // Map frontend fields to database fields
    const dbUpdateData = {};
    if (updateData.name) dbUpdateData.Merchants_Name = updateData.name;
    if (updateData.description)
      dbUpdateData.Description = updateData.description;
    if (updateData.cuisine) dbUpdateData.Cuisine = updateData.cuisine;
    if (updateData.address) dbUpdateData.Address = updateData.address;
    if (updateData.postcode) dbUpdateData.PostCode = updateData.postcode;
    if (updateData.openingTimes)
      dbUpdateData.Opening_Times = updateData.openingTimes;
    if (updateData.bookingAvailable !== undefined)
      dbUpdateData.Booking_Available = updateData.bookingAvailable
        ? "Yes"
        : "No";

    const updatedMerchant = await prisma.merchants.update({
      where: { Grubsy_Partner_ID: merchantId },
      data: dbUpdateData,
    });

    return ok(res, {
      id: updatedMerchant.id,
      name: updatedMerchant.Merchants_Name,
      description: updatedMerchant.Description,
      cuisine: updatedMerchant.Cuisine,
      address: updatedMerchant.Address,
      postcode: updatedMerchant.PostCode,
      openingTimes: updatedMerchant.Opening_Times,
      bookingAvailable: updatedMerchant.Booking_Available === "Yes",
    });
  } catch (error) {
    console.error("Update merchant profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update merchant profile",
    });
  }
});

// User preferences endpoints
router.get("/user/preferences", async (req, res) => {
  try {
    // Get user ID from auth middleware (assuming it's set)
    const userId = req.user?.id || req.query.userId;
    if (!userId) return badRequest(res, "User ID required");

    console.log("⚙️ Fetching user preferences for user:", userId);

    const preferences = await prisma.user_Preferences.findUnique({
      where: { userId: userId },
    });

    if (!preferences) {
      // Return default preferences if none exist
      const defaultPreferences = {
        notifications: {
          orderUpdates: true,
          promotions: false,
          newRestaurants: true,
          deliveryAlerts: true,
        },
        preferences: {
          locationServices: true,
          autoDetectLocation: true,
          savePaymentInfo: false,
          emailReceipts: true,
        },
        dietary: {
          vegetarian: false,
          vegan: false,
          halal: false,
          glutenFree: false,
          dairyFree: false,
        },
      };
      console.log("📋 Returning default preferences for new user");
      return ok(res, defaultPreferences);
    }

    // Format preferences for frontend
    const formattedPreferences = {
      notifications: {
        orderUpdates: preferences.orderUpdates,
        promotions: preferences.promotions,
        newRestaurants: preferences.newRestaurants,
        deliveryAlerts: preferences.deliveryAlerts,
      },
      preferences: {
        locationServices: preferences.locationServices,
        autoDetectLocation: preferences.autoDetectLocation,
        savePaymentInfo: preferences.savePaymentInfo,
        emailReceipts: preferences.emailReceipts,
      },
      dietary: {
        vegetarian: preferences.vegetarian,
        vegan: preferences.vegan,
        halal: preferences.halal,
        glutenFree: preferences.glutenFree,
        dairyFree: preferences.dairyFree,
      },
    };

    console.log("✅ Found user preferences");
    return ok(res, formattedPreferences);
  } catch (error) {
    console.error("❌ Get user preferences error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get user preferences",
    });
  }
});

router.put("/user/preferences", async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return badRequest(res, "User ID required");

    const { notifications, preferences: userPreferences, dietary } = req.body;

    console.log("💾 Updating user preferences for user:", userId);

    const updatedPreferences = await prisma.user_Preferences.upsert({
      where: { userId: userId },
      update: {
        // Notifications
        orderUpdates: notifications?.orderUpdates ?? true,
        promotions: notifications?.promotions ?? false,
        newRestaurants: notifications?.newRestaurants ?? true,
        deliveryAlerts: notifications?.deliveryAlerts ?? true,
        // Preferences
        locationServices: userPreferences?.locationServices ?? true,
        autoDetectLocation: userPreferences?.autoDetectLocation ?? true,
        savePaymentInfo: userPreferences?.savePaymentInfo ?? false,
        emailReceipts: userPreferences?.emailReceipts ?? true,
        // Dietary
        vegetarian: dietary?.vegetarian ?? false,
        vegan: dietary?.vegan ?? false,
        halal: dietary?.halal ?? false,
        glutenFree: dietary?.glutenFree ?? false,
        dairyFree: dietary?.dairyFree ?? false,
      },
      create: {
        userId: userId,
        // Notifications
        orderUpdates: notifications?.orderUpdates ?? true,
        promotions: notifications?.promotions ?? false,
        newRestaurants: notifications?.newRestaurants ?? true,
        deliveryAlerts: notifications?.deliveryAlerts ?? true,
        // Preferences
        locationServices: userPreferences?.locationServices ?? true,
        autoDetectLocation: userPreferences?.autoDetectLocation ?? true,
        savePaymentInfo: userPreferences?.savePaymentInfo ?? false,
        emailReceipts: userPreferences?.emailReceipts ?? true,
        // Dietary
        vegetarian: dietary?.vegetarian ?? false,
        vegan: dietary?.vegan ?? false,
        halal: dietary?.halal ?? false,
        glutenFree: dietary?.glutenFree ?? false,
        dairyFree: dietary?.dairyFree ?? false,
      },
    });

    console.log("✅ User preferences updated successfully");
    return ok(res, { message: "Preferences updated successfully" });
  } catch (error) {
    console.error("❌ Update user preferences error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update user preferences",
    });
  }
});

// Mount remaining routers
router.use("/auth", authRouter);
router.use("/users", authRouter); // Also mount auth routes under /users for compatibility
router.use("/payments", paymentsRouter);

// Device registration routes
router.use("/devices", devicesRouter);

// Restaurant operations routes
router.use("/merchants", merchantsRouter);
router.use("/couriers", couriersRouter);

// Pricing routes
router.use("/pricing", pricingRouter);

// Driver routes
router.use("/driver/auth", driverAuthRouter);
router.use("/driver", driversRouter);

// Admin routes
router.use("/admin", adminRouter);

// Menu options placeholder route
router.get("/menu-options", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// Auth profile route
router.get("/auth/profile", (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      email: "admin@grubsy.com",
      name: "Admin User",
      role: "admin",
      permissions: ["all"]
    }
  });
});

router.put("/auth/profile", (req, res) => {
  const { name, email } = req.body;
  res.json({
    success: true,
    data: {
      id: 1,
      email: email || "admin@grubsy.com",
      name: name || "Admin User",
      role: "admin",
      permissions: ["all"],
      message: "Profile updated successfully"
    }
  });
});

// =============================================================================
// DRIVER MESSAGING ENDPOINTS (Driver App)
// =============================================================================

/**
 * @swagger
 * /api/driver/messages:
 *   get:
 *     summary: Get driver message history
 *     tags: [Driver Messages]
 *     parameters:
 *       - in: query
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID (Driver_ID from Drivers table)
 *       - in: query
 *         name: orderId
 *         required: false
 *         schema:
 *           type: string
 *         description: Business order ID (e.g. GDS-004XV)
 *       - in: query
 *         name: conversationId
 *         required: false
 *         schema:
 *           type: string
 *         description: Conversation ID (e.g. order_<orderId> or support)
 *     responses:
 *       200:
 *         description: List of messages for the driver
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get("/driver/messages", authenticateDriver, async (req, res) => {
  const { orderId, conversationId, limit } = req.query;
  const driverId = req.driverId;

  try {
    const messages = await chatService.getDriverMessages({
      driverId,
      orderId: orderId || undefined,
      conversationId: conversationId || undefined,
      limit: limit ? parseInt(limit) : 100,
    });

    const lastMessage = messages.length ? messages[messages.length - 1] : null;

    return res.json({
      success: true,
      data: messages,
      lastMessage,
    });
  } catch (error) {
    console.error("❌ Get driver messages error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get driver messages",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/driver/messages:
 *   post:
 *     summary: Send a chat message from driver (HTTP fallback to WebSocket)
 *     tags: [Driver Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [driverId, conversationId, to, text]
 *             properties:
 *               driverId:
 *                 type: string
 *               conversationId:
 *                 type: string
 *                 example: order_GDS-004XV
 *               orderId:
 *                 type: string
 *                 example: GDS-004XV
 *               to:
 *                 type: string
 *                 enum: [customer, support]
 *               text:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post("/driver/messages", authenticateDriver, async (req, res) => {
  const { conversationId, orderId, to, text, timestamp, metadata } = req.body || {};
  const driverId = req.driverId;

  try {
    const message = await chatService.createDriverMessage({
      driverId,
      conversationId,
      orderId,
      to,
      text,
      timestamp,
      metadata,
    });

    // Broadcast over WebSocket so connected clients receive the update
    realtimeService.broadcastDriverChatMessage(message);

    return res.json({ success: true, data: message });
  } catch (error) {
    console.error("❌ Send driver message error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send driver message",
      message: error.message,
    });
  }
});

// =============================================================================
// PHOTO ENDPOINTS FOR DRIVER APP
// =============================================================================

/**
 * @swagger
 * /api/photos:
 *   post:
 *     summary: Upload a photo (pickup, dropoff, proof of delivery)
 *     tags: [Photos]
 */
router.post('/photos', async (req, res) => {
  const { orderId, driverId, photoType, photoData, timestamp, restaurantName, customerName } = req.body;

  try {
    if (!orderId || !driverId || !photoType || !photoData) {
      return badRequest(res, 'Missing required fields: orderId, driverId, photoType, photoData');
    }

    console.log('📸 Saving photo to database...');

    const photo = await prisma.order_Photos.create({
      data: {
        order_id: orderId,
        driver_id: driverId,
        photo_type: photoType,
        photo_data: photoData,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        restaurant_name: restaurantName || null,
        customer_name: customerName || null,
        created_at: new Date()
      }
    });

    console.log(`✅ Photo saved with ID: ${photo.id}`);
    return ok(res, { id: photo.id, message: 'Photo saved successfully' });
  } catch (error) {
    console.error('❌ Save photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save photo'
    });
  }
});

/**
 * @swagger
 * /api/photos:
 *   get:
 *     summary: Get photos by orderId or driverId
 *     tags: [Photos]
 */
router.get('/photos', async (req, res) => {
  const { orderId, driverId } = req.query;

  try {
    if (!orderId && !driverId) {
      return badRequest(res, 'Either orderId or driverId is required');
    }

    console.log('📸 Fetching photos from database...');

    const where = {};
    if (orderId) where.order_id = orderId;
    if (driverId) where.driver_id = driverId;

    const photos = await prisma.order_Photos.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_id: true,
        driver_id: true,
        photo_type: true,
        photo_url: true,
        timestamp: true,
        restaurant_name: true,
        customer_name: true,
        created_at: true
      }
    });

    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      orderId: photo.order_id,
      driverId: photo.driver_id,
      photoType: photo.photo_type,
      photoUrl: photo.photo_url,
      timestamp: photo.timestamp.toISOString(),
      restaurantName: photo.restaurant_name,
      customerName: photo.customer_name,
      createdAt: photo.created_at.toISOString()
    }));

    console.log(`✅ Found ${photos.length} photos`);
    return ok(res, formattedPhotos);
  } catch (error) {
    console.error('❌ Get photos error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get photos'
    });
  }
});

// =============================================================================
// PROOF OF DELIVERY ENDPOINT
// =============================================================================

/**
 * @swagger
 * /api/orders/{orderId}/proof-of-delivery:
 *   post:
 *     summary: Upload proof of delivery photo or signature
 *     tags: [Orders]
 */
router.post("/orders/:orderId/proof-of-delivery", async (req, res) => {
  const { orderId } = req.params;
  const { driverId, photoData, signatureData, recipientName, notes } = req.body;

  if (!driverId) {
    return badRequest(res, "driverId is required");
  }

  if (!photoData && !signatureData) {
    return badRequest(res, "Either photoData or signatureData is required");
  }

  console.log(`📸 Uploading proof of delivery for order: ${orderId}`);

  try {
    // Verify order exists and belongs to driver
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== driverId) {
      return res.status(403).json({
        success: false,
        error: "Order not assigned to this driver",
      });
    }

    // Save proof of delivery photo
    const proof = await prisma.order_Photos.create({
      data: {
        order_id: orderId,
        driver_id: driverId,
        photo_type: "proof_of_delivery",
        photo_data: photoData || signatureData,
        timestamp: new Date(),
        customer_name: recipientName || null,
      },
    });

    // Update order with delivery proof reference
    await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        driverOrderImages: proof.id,
      },
    });

    console.log(`✅ Proof of delivery saved: ${proof.id}`);

    return ok(res, {
      proofId: proof.id,
      orderId: orderId,
      message: "Proof of delivery uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Upload proof of delivery error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to upload proof of delivery",
    });
  }
});

// =============================================================================
// DRIVER PAYOUT ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/driver/payout/balance:
 *   get:
 *     summary: Get driver's available balance for payout
 *     tags: [Driver Payouts]
 */
router.get("/driver/payout/balance", async (req, res) => {
  const { driverId } = req.query;

  if (!driverId) {
    return badRequest(res, "driverId query parameter required");
  }

  console.log(`💰 Fetching payout balance for driver: ${driverId}`);

  try {
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: driverId },
      select: {
        current_balance: true,
        earnings_total: true,
        tips_total: true,
        last_payout_at: true,
      },
    });

    if (!driver) {
      return notFound(res, "Driver not found");
    }

    // Get pending payouts
    const pendingPayouts = await prisma.driver_Payouts.aggregate({
      where: {
        driver_id: driverId,
        status: { in: ["pending", "processing"] },
      },
      _sum: { amount: true },
    });

    const pendingAmount = parseFloat(pendingPayouts._sum?.amount || 0);
    const currentBalance = parseFloat(driver.current_balance || 0);
    const availableBalance = Math.max(0, currentBalance - pendingAmount);

    return ok(res, {
      availableBalance: Math.round(availableBalance * 100) / 100,
      currentBalance: Math.round(currentBalance * 100) / 100,
      pendingPayouts: Math.round(pendingAmount * 100) / 100,
      totalEarnings: parseFloat(driver.earnings_total || 0),
      totalTips: parseFloat(driver.tips_total || 0),
      lastPayoutAt: driver.last_payout_at,
    });
  } catch (error) {
    console.error("❌ Get payout balance error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get payout balance",
    });
  }
});

/**
 * @swagger
 * /api/driver/payout:
 *   post:
 *     summary: Process a cash out / payout request
 *     tags: [Driver Payouts]
 */
router.post("/driver/payout", async (req, res) => {
  const { driverId, amount, method, fee } = req.body;

  if (!driverId || !amount || !method) {
    return badRequest(res, "driverId, amount, and method are required");
  }

  console.log(`💸 Processing payout request for driver: ${driverId}, amount: £${amount}, method: ${method}`);

  try {
    // Validate method
    const validMethods = ["instant", "2day", "weekly"];
    if (!validMethods.includes(method)) {
      return badRequest(res, `Invalid method. Must be one of: ${validMethods.join(", ")}`);
    }

    // Get driver's current balance
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: driverId },
      select: { current_balance: true },
    });

    if (!driver) {
      return notFound(res, "Driver not found");
    }

    const currentBalance = parseFloat(driver.current_balance || 0);

    if (amount > currentBalance) {
      return badRequest(res, `Insufficient balance. Available: £${currentBalance.toFixed(2)}`);
    }

    // Calculate fee based on method (if not provided)
    let calculatedFee = fee;
    if (calculatedFee === undefined) {
      if (method === "instant") {
        calculatedFee = Math.min(amount * 0.015, 5); // 1.5% up to £5 max
      } else if (method === "2day") {
        calculatedFee = 0.50; // Flat £0.50 fee
      } else {
        calculatedFee = 0; // weekly = free
      }
    }

    const netAmount = amount - calculatedFee;

    // Create payout record
    const payout = await prisma.driver_Payouts.create({
      data: {
        driver_id: driverId,
        amount: amount,
        fee: calculatedFee,
        net_amount: netAmount,
        method: method,
        status: "pending",
        requested_at: new Date(),
      },
    });

    // Deduct from driver balance
    await prisma.drivers.update({
      where: { Driver_ID: driverId },
      data: {
        current_balance: { decrement: amount },
      },
    });

    console.log(`✅ Payout request created: ${payout.id}, net amount: £${netAmount.toFixed(2)}`);

    return ok(res, {
      payoutId: payout.id,
      amount: amount,
      fee: Math.round(calculatedFee * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      method: method,
      status: "pending",
      message: "Payout request submitted successfully",
      estimatedArrival: method === "instant" ? "Within 30 minutes" : method === "2day" ? "2 business days" : "Next weekly payout",
    });
  } catch (error) {
    console.error("❌ Process payout error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process payout",
    });
  }
});

// =============================================================================
// MERCHANT PAYOUT ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/merchants/payouts/summary:
 *   get:
 *     summary: Get merchant payout summary and available balance
 *     tags: [Merchant Payouts]
 */
router.get("/merchants/payouts/summary", async (req, res) => {
  const { partnerId } = req.query;

  if (!partnerId) {
    return badRequest(res, "partnerId query parameter required");
  }

  console.log(`💰 Fetching payout summary for merchant partner: ${partnerId}`);

  try {
    // Ensure merchant exists
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: partnerId },
      select: { Grubsy_Partner_ID: true },
    });

    if (!merchant) {
      return notFound(res, "Merchant not found");
    }

    // Calculate total earnings from delivered orders for this merchant
    const orders = await prisma.orders.findMany({
      where: {
        partnerId: partnerId,
        status: "DELIVERED",
      },
      select: {
        basketSubtotal: true,
        grubsyProfit: true,
      },
    });

    let totalEarnings = 0;
    for (const order of orders) {
      const basket = parseFloat(order.basketSubtotal || "0");
      const grubsyCut = parseFloat(order.grubsyProfit || "0");
      const merchantEarnings = Math.max(0, basket - grubsyCut);
      totalEarnings += merchantEarnings;
    }

    // Aggregate payouts by status
    const [pendingAgg, processingAgg, paidAgg, failedAgg, totalActiveAgg] = await Promise.all([
      prisma.Merchant_Payouts.aggregate({
        where: { partner_id: partnerId, status: "pending" },
        _sum: { amount: true },
      }),
      prisma.Merchant_Payouts.aggregate({
        where: { partner_id: partnerId, status: "processing" },
        _sum: { amount: true },
      }),
      prisma.Merchant_Payouts.aggregate({
        where: { partner_id: partnerId, status: "paid" },
        _sum: { amount: true },
      }),
      prisma.Merchant_Payouts.aggregate({
        where: { partner_id: partnerId, status: "failed" },
        _sum: { amount: true },
      }),
      prisma.Merchant_Payouts.aggregate({
        where: {
          partner_id: partnerId,
          status: { in: ["pending", "processing", "paid"] },
        },
        _sum: { amount: true },
      }),
    ]);

    const sum = (val) => parseFloat(val?._sum?.amount || 0);

    const pending = sum(pendingAgg);
    const processing = sum(processingAgg);
    const paid = sum(paidAgg);
    const failed = sum(failedAgg);
    const totalPayouts = sum(totalActiveAgg);

    const availableBalance = Math.max(0, totalEarnings - totalPayouts);

    return ok(res, {
      partnerId,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalPayouts: Math.round(totalPayouts * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      processing: Math.round(processing * 100) / 100,
      paid: Math.round(paid * 100) / 100,
      failed: Math.round(failed * 100) / 100,
    });
  } catch (error) {
    console.error("❌ Get merchant payout summary error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get merchant payout summary",
    });
  }
});

/**
 * @swagger
 * /api/merchants/payouts:
 *   get:
 *     summary: Get merchant payout history
 *     tags: [Merchant Payouts]
 */
router.get("/merchants/payouts", async (req, res) => {
  const { partnerId, limit = 20 } = req.query;

  if (!partnerId) {
    return badRequest(res, "partnerId query parameter required");
  }

  console.log(`📜 Fetching payout history for merchant partner: ${partnerId}`);

  try {
    const payouts = await prisma.Merchant_Payouts.findMany({
      where: { partner_id: partnerId },
      orderBy: { requested_at: "desc" },
      take: parseInt(limit),
    });

    const history = payouts.map((p) => ({
      id: p.id,
      partnerId: p.partner_id,
      amount: parseFloat(p.amount),
      status: p.status,
      method: p.method,
      externalReference: p.external_reference,
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
      notes: p.notes,
    }));

    return ok(res, history);
  } catch (error) {
    console.error("❌ Get merchant payout history error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get merchant payout history",
    });
  }
});

/**
 * @swagger
 * /api/merchants/payouts/request:
 *   post:
 *     summary: Request a merchant payout
 *     tags: [Merchant Payouts]
 */
router.post("/merchants/payouts/request", async (req, res) => {
  const { partnerId, amount, method, notes } = req.body;

  if (!partnerId || !amount) {
    return badRequest(res, "partnerId and amount are required");
  }

  const numericAmount = parseFloat(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return badRequest(res, "amount must be a positive number");
  }

  const payoutMethod = method || "bank_transfer";

  console.log(
    `💸 Merchant payout request: partner=${partnerId}, amount=£${numericAmount.toFixed(
      2
    )}, method=${payoutMethod}`
  );

  try {
    // Ensure merchant exists
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: partnerId },
      select: { Grubsy_Partner_ID: true },
    });

    if (!merchant) {
      return notFound(res, "Merchant not found");
    }

    // Recalculate available balance (same logic as summary)
    const orders = await prisma.orders.findMany({
      where: {
        partnerId: partnerId,
        status: "DELIVERED",
      },
      select: {
        basketSubtotal: true,
        grubsyProfit: true,
      },
    });

    let totalEarnings = 0;
    for (const order of orders) {
      const basket = parseFloat(order.basketSubtotal || "0");
      const grubsyCut = parseFloat(order.grubsyProfit || "0");
      const merchantEarnings = Math.max(0, basket - grubsyCut);
      totalEarnings += merchantEarnings;
    }

    const activePayouts = await prisma.Merchant_Payouts.aggregate({
      where: {
        partner_id: partnerId,
        status: { in: ["pending", "processing", "paid"] },
      },
      _sum: { amount: true },
    });

    const totalPayouts = parseFloat(activePayouts?._sum?.amount || 0);
    const availableBalance = Math.max(0, totalEarnings - totalPayouts);

    if (numericAmount > availableBalance) {
      return badRequest(
        res,
        `Insufficient balance. Available: £${availableBalance.toFixed(2)}`
      );
    }

    // Create payout record
    const payout = await prisma.Merchant_Payouts.create({
      data: {
        partner_id: partnerId,
        amount: numericAmount,
        status: "pending",
        method: payoutMethod,
        notes: notes || null,
      },
    });

    const newAvailable = Math.max(0, availableBalance - numericAmount);

    return ok(res, {
      payoutId: payout.id,
      partnerId,
      amount: Math.round(numericAmount * 100) / 100,
      status: payout.status,
      method: payout.method,
      requestedAt: payout.requested_at,
      availableBalance: Math.round(newAvailable * 100) / 100,
      message: "Payout request submitted successfully",
    });
  } catch (error) {
    console.error("❌ Merchant payout request error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to request payout",
    });
  }
});

// FAQ endpoints for driver app
router.get("/faqs", async (req, res) => {
  try {
    console.log("❓ Fetching FAQs from database...");

    const faqs = await prisma.User___FAQ_s.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        Question: true,
        Answer: true,
      },
    });

    // Add emergency policy FAQ
    const emergencyPolicy = {
      id: 999,
      Question:
        "What happens if I have an emergency while delivering an order?",
      Answer: `If you experience an emergency while delivering an order, you can report it through the app. The system will:

• Immediately reallocate your order to another available driver
• Calculate a penalty based on the order total minus your delivery fee
• You will be billed for this penalty amount
• A new driver will be assigned to complete the delivery

Emergency types include:
• Vehicle breakdown or mechanical issues
• Traffic accidents or collisions
• Medical emergencies requiring immediate attention
• Personal or family emergencies
• App or technical issues preventing delivery

Please only use this feature for genuine emergencies. Misuse may result in account suspension.`,
    };

    const allFaqs = [...faqs, emergencyPolicy];

    console.log(`✅ Found ${allFaqs.length} FAQs (including emergency policy)`);
    return ok(res, allFaqs);
  } catch (error) {
    console.error("❌ Get FAQs error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get FAQs",
    });
  }
});

router.get("/faqs/search", async (req, res) => {
  const { q } = req.query;

  try {
    if (!q) return badRequest(res, "Search query is required");

    console.log("🔍 Searching FAQs...");

    const faqs = await prisma.User___FAQ_s.findMany({
      where: {
        OR: [
          { Question: { contains: q, mode: "insensitive" } },
          { Answer: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        Question: true,
        Answer: true,
      },
    });

    // Add emergency policy FAQ if it matches search
    const emergencyPolicy = {
      id: 999,
      Question:
        "What happens if I have an emergency while delivering an order?",
      Answer: `If you experience an emergency while delivering an order, you can report it through the app. The system will:

• Immediately reallocate your order to another available driver
• Calculate a penalty based on the order total minus your delivery fee
• You will be billed for this penalty amount
• A new driver will be assigned to complete the delivery

Emergency types include:
• Vehicle breakdown or mechanical issues
• Traffic accidents or collisions
• Medical emergencies requiring immediate attention
• Personal or family emergencies
• App or technical issues preventing delivery

Please only use this feature for genuine emergencies. Misuse may result in account suspension.`,
    };

    const allFaqs = [...faqs];
    if (
      emergencyPolicy.Question.toLowerCase().includes(q.toLowerCase()) ||
      emergencyPolicy.Answer.toLowerCase().includes(q.toLowerCase())
    ) {
      allFaqs.push(emergencyPolicy);
    }

    console.log(
      `✅ Found ${allFaqs.length} matching FAQs (including emergency policy if matched)`
    );
    return ok(res, allFaqs);
  } catch (error) {
    console.error("❌ Search FAQs error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to search FAQs",
    });
  }
});

router.get("/faqs/categories", async (req, res) => {
  try {
    console.log("📋 Fetching FAQ categories...");

    // For now, return a simple array of categories since the FAQ model doesn't have categories
    const categories = [
      { category: "General" },
      { category: "Orders" },
      { category: "Payments" },
      { category: "Account" },
      { category: "Emergency" },
    ];

    const categoryList = categories.map((c) => c.category).filter(Boolean);

    console.log(`✅ Found ${categoryList.length} categories`);
    return ok(res, categoryList);
  } catch (error) {
    console.error("❌ Get FAQ categories error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get FAQ categories",
    });
  }
});

// =============================================================================
// DRIVER ACTIVITY TRACKING ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/driver-activity:
 *   post:
 *     summary: Log driver activity
 *     tags: [Driver Activity]
 */
router.post('/driver-activity', async (req, res) => {
  const { driverId, action, timestamp, location, orderId, metadata } = req.body;

  try {
    if (!driverId || !action) {
      return badRequest(res, 'Missing required fields: driverId, action');
    }

    console.log('📊 Saving driver activity to database...');

    const activity = await prisma.driver_Activities.create({
      data: {
        driver_id: driverId,
        action: action,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        order_id: orderId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date()
      }
    });

    console.log(`✅ Driver activity saved with ID: ${activity.id}`);
    return ok(res, { id: activity.id, message: 'Activity logged successfully' });
  } catch (error) {
    console.error('❌ Save driver activity error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save driver activity'
    });
  }
});

/**
 * @swagger
 * /api/driver-activity/{driverId}:
 *   get:
 *     summary: Get driver activity history
 *     tags: [Driver Activity]
 */
router.get('/driver-activity/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { limit = 50 } = req.query;

  try {
    if (!driverId) return badRequest(res, 'driverId is required');

    console.log('📊 Fetching driver activity from database...');

    const activities = await prisma.driver_Activities.findMany({
      where: { driver_id: driverId },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        driver_id: true,
        action: true,
        timestamp: true,
        latitude: true,
        longitude: true,
        order_id: true,
        metadata: true,
        created_at: true
      }
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      driverId: activity.driver_id,
      action: activity.action,
      timestamp: activity.timestamp.toISOString(),
      location: activity.latitude && activity.longitude ? {
        latitude: parseFloat(activity.latitude),
        longitude: parseFloat(activity.longitude)
      } : null,
      orderId: activity.order_id,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
      createdAt: activity.created_at.toISOString()
    }));

    console.log(`✅ Found ${activities.length} driver activities`);
    return ok(res, formattedActivities);
  } catch (error) {
    console.error('❌ Get driver activity error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get driver activity'
    });
  }
});

// =============================================================================
// ORDER ACTIVITY TRACKING ENDPOINT
// =============================================================================

/**
 * @swagger
 * /api/order-activity:
 *   post:
 *     summary: Log order activity
 *     tags: [Order Activity]
 */
router.post('/order-activity', async (req, res) => {
  const { orderId, driverId, action, timestamp, status, location, metadata } = req.body;

  try {
    if (!orderId || !action) {
      return badRequest(res, 'Missing required fields: orderId, action');
    }

    console.log('📦 Saving order activity to database...');

    const activity = await prisma.order_Activities.create({
      data: {
        order_id: orderId,
        driver_id: driverId || null,
        action: action,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        status: status || null,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        created_at: new Date()
      }
    });

    console.log(`✅ Order activity saved with ID: ${activity.id}`);
    return ok(res, { id: activity.id, message: 'Order activity logged successfully' });
  } catch (error) {
    console.error('❌ Save order activity error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save order activity'
    });
  }
});

// Driver earnings endpoints
router.get("/driver/earnings", async (req, res) => {
  const { driverId, period } = req.query;

  try {
    console.log("📊 Fetching driver earnings:", { driverId, period });

    // Calculate date ranges based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week": {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
        break;
      }
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const where = {
      status: "DELIVERED",
      ...(driverId && { driverId: driverId }),
      ...(period !== "total" && {
        orderDate: { gte: startDate.toISOString() },
      }),
    };

    const orders = await prisma.orders.findMany({
      where,
    });

    // Calculate earnings from delivery fees
    const earnings = orders.reduce((total, order) => {
      const deliveryFee = parseFloat(order.deliveryFee || "0");
      return total + deliveryFee;
    }, 0);

    const deliveryCount = orders.length;
    const averagePerDelivery = deliveryCount > 0 ? earnings / deliveryCount : 0;

    const earningsData = {
      earnings: earnings,
      deliveries: deliveryCount,
      averagePerDelivery: averagePerDelivery,
      orders: orders.map((order) => ({
        id: order.id,
        restaurantName: order.merchants?.Merchants_Name || "Restaurant",
        deliveryFee: parseFloat(order.deliveryFee || "0"),
        completedAt: order.updatedAt,
        tips: parseFloat(order.tips || "0"),
        bonus: parseFloat(order.bonus || "0"),
      })),
    };
    return ok(res, earningsData);
  } catch (error) {
    console.error("❌ Get driver earnings error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get driver earnings",
    });
  }
});

router.get("/driver/earnings/breakdown", async (req, res) => {
  const { driverId, limit = 10 } = req.query;
  try {
    const where = {
      status: "DELIVERED",
      ...(driverId && { driverId: driverId }),
    };

    // Get recent completed orders
    const orders = await prisma.orders.findMany({
      where,
      orderBy: { orderDate: "desc" },
      take: parseInt(limit),
    });

    const breakdown = orders.map((order) => ({
      date: order.orderDate,
      orderId: order.orderId,
      restaurant: order.merchants?.Merchants_Name || "Restaurant",
      baseAmount: parseFloat(order.deliveryFee || "0"),
      tips: parseFloat(order.tips || "0"),
      bonus: parseFloat(order.bonus || "0"),
      total: parseFloat(order.total || "0"),
      distance: 2.5, // TODO: Calculate actual distance
      customerName: "Customer", // TODO: Add customer name relationship
    }));

    console.log(`✅✅✅✅✅ Found ${breakdown.length} recent earnings`);
    return ok(res, breakdown);
  } catch (error) {
    console.error("❌ Get earnings breakdown error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get earnings breakdown",
    });
  }
});

// Analytics routes
router.get("/analytics/todays-earnings", async (req, res) => {
  try {
    const { partnerId } = req.query;
    if (!partnerId) return badRequest(res, "partnerId required");

    console.log("📊 Fetching today's earnings for partner:", partnerId);

    // Get today's date string for comparison (since createdAt is stored as string)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all orders for this partner
    const allOrders = await prisma.orders.findMany({
      where: {
        partnerId: partnerId,
      }
    });

    // Filter orders by date (since createdAt is string)
    const todaysOrders = allOrders.filter(order => {
      if (!order.createdAt) return false;
      return order.createdAt.startsWith(todayStr);
    });

    const yesterdaysOrders = allOrders.filter(order => {
      if (!order.createdAt) return false;
      return order.createdAt.startsWith(yesterdayStr);
    });

    // Calculate today's metrics
    const todaysTotal = todaysOrders.reduce((sum, order) => sum + parseFloat(order.basketSubtotal || "0"), 0);
    const todaysOrdersCount = todaysOrders.length;
    const todaysAvgOrder = todaysOrdersCount > 0 ? todaysTotal / todaysOrdersCount : 0;

    // Calculate yesterday's metrics
    const yesterdaysTotal = yesterdaysOrders.reduce((sum, order) => sum + parseFloat(order.basketSubtotal || "0"), 0);

    // Calculate percentage change
    let yesterdayChange = 0;
    if (yesterdaysTotal > 0) {
      yesterdayChange = ((todaysTotal - yesterdaysTotal) / yesterdaysTotal) * 100;
    }

    const result = {
      total: Math.round(todaysTotal * 100) / 100,
      orders: todaysOrdersCount,
      avgOrder: Math.round(todaysAvgOrder * 100) / 100,
      yesterdayChange: Math.round(yesterdayChange * 100) / 100
    };

    console.log("✅ Today's earnings calculated:", result);
    return ok(res, result);
  } catch (error) {
    console.error("❌ Get today's earnings error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get today's earnings",
    });
  }
});

router.get("/analytics/category-sales", async (req, res) => {
  try {
    const { partnerId, filter = 'thisMonth' } = req.query;
    if (!partnerId) return badRequest(res, "partnerId required");

    console.log("📊 Fetching category sales for partner:", partnerId, "filter:", filter);

    // Calculate date range based on filter
    const now = new Date();
    let startDateStr;

    switch (filter) {
      case 'today':
        startDateStr = now.toISOString().split('T')[0];
        break;
      case 'thisWeek': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDateStr = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'thisMonth':
        startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case 'thisYear':
        startDateStr = `${now.getFullYear()}-01-01`;
        break;
      default:
        startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Get orders for this partner
    const orders = await prisma.orders.findMany({
      where: {
        partnerId: partnerId,
      }
    });

    // Filter by date and parse items from orderedItems JSON
    const categorySales = {};

    orders.forEach(order => {
      // Check if order is within date range
      if (!order.createdAt || order.createdAt < startDateStr) return;

      // Parse orderedItems JSON
      let items = [];
      if (order.orderedItems) {
        try {
          items = JSON.parse(order.orderedItems);
        } catch {
          items = [];
        }
      }

      items.forEach(item => {
        const category = item.category || item.foodCategory || 'Other';
          const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.price || item.regularPrice || "0");

          if (!categorySales[category]) {
            categorySales[category] = {
              category,
              sales: 0,
              orders: 0
            };
          }

          categorySales[category].sales += price * quantity;
          categorySales[category].orders += 1;
        });
    });

    // Convert to array and sort by sales
    const result = Object.values(categorySales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // If no data, return sample categories
    if (result.length === 0) {
      console.log("📊 No sales data found, returning empty array");
    }

    console.log("✅ Category sales calculated:", result.length, "categories");
    return ok(res, result);
  } catch (error) {
    console.error("❌ Get category sales error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get category sales",
    });
  }
});

router.get("/analytics/item-sales", async (req, res) => {
  try {
    const { partnerId, filter = 'thisMonth' } = req.query;
    if (!partnerId) return badRequest(res, "partnerId required");

    console.log("📊 Fetching item sales for partner:", partnerId, "filter:", filter);

    // Calculate date range based on filter
    const now = new Date();
    let startDateStr;

    switch (filter) {
      case 'today':
        startDateStr = now.toISOString().split('T')[0];
        break;
      case 'thisWeek': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDateStr = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'thisMonth':
        startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case 'thisYear':
        startDateStr = `${now.getFullYear()}-01-01`;
        break;
      default:
        startDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Get orders for this partner
    const orders = await prisma.orders.findMany({
      where: {
        partnerId: partnerId,
      }
    });

    // Aggregate sales by item
    const itemSales = {};

    orders.forEach(order => {
      // Check if order is within date range
      if (!order.createdAt || order.createdAt < startDateStr) return;

      // Parse orderedItems JSON
      let items = [];
      if (order.orderedItems) {
        try {
          items = JSON.parse(order.orderedItems);
        } catch {
          items = [];
        }
      }

      items.forEach(item => {
        const itemName = item.name || item.Item || 'Unknown Item';
          const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.price || item.regularPrice || "0");

          if (!itemSales[itemName]) {
            itemSales[itemName] = {
              item: itemName,
              sales: 0,
              orders: 0
            };
          }

          itemSales[itemName].sales += price * quantity;
          itemSales[itemName].orders += 1;
        });
    });

    // Convert to array and sort by sales
    const result = Object.values(itemSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    console.log("✅ Item sales calculated:", result.length, "items");
    return ok(res, result);
  } catch (error) {
    console.error("❌ Get item sales error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get item sales",
    });
  }
});

router.get("/analytics/recent-activities", async (req, res) => {
  try {
    const { partnerId, limit = 10 } = req.query;
    if (!partnerId) return badRequest(res, "partnerId required");

    console.log("📊 Fetching recent activities for partner:", partnerId, "limit:", limit);

    // Get recent orders - sort by createdAt string (ISO format sorts correctly)
    const orders = await prisma.orders.findMany({
      where: {
        partnerId: partnerId
      },
      take: parseInt(limit) * 2, // Get extra to account for sorting
    });

    // Sort by createdAt descending (string comparison works for ISO dates)
    orders.sort((a, b) => {
      const dateA = a.createdAt || '';
      const dateB = b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    // Take only the requested limit
    const recentOrders = orders.slice(0, parseInt(limit));

    // Format as activities
    const activities = recentOrders.map(order => {
      let message = '';
      let type = 'order';

      switch (order.status) {
        case 'PENDING':
          message = `New order received - ${order.orderId}`;
          break;
        case 'ACCEPTED':
          message = `Order accepted - ${order.orderId}`;
          break;
        case 'READY_FOR_DRIVER':
          message = `Order ready for pickup - ${order.orderId}`;
          break;
        case 'ALLOCATED_DRIVER':
          message = `Driver assigned - ${order.orderId}`;
          break;
        case 'PICKED_UP':
          message = `Order picked up by driver - ${order.orderId}`;
          break;
        case 'OUT_FOR_DELIVERY':
          message = `Order out for delivery - ${order.orderId}`;
          break;
        case 'DELIVERED':
          message = `Order delivered - ${order.orderId}`;
          break;
        case 'CANCELLED':
          message = `Order cancelled - ${order.orderId}`;
          break;
        default:
          message = `Order updated - ${order.orderId}`;
      }

      return {
        id: order.id,
        message,
        type,
        timestamp: order.createdAt,
        orderId: order.orderId,
        status: order.status
      };
    });

    console.log("✅ Recent activities fetched:", activities.length, "activities");
    return ok(res, activities);
  } catch (error) {
    console.error("❌ Get recent activities error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get recent activities",
    });
  }
});

export default router;
