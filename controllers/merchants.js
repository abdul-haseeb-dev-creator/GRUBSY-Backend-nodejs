// controllers/merchants.js
// Merchant management for restaurant operations
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Get all merchants (admin only)
 */
async function getAll(req, res) {
  try {
    const { cuisine, active } = req.query;

    // Build where clause
    const where = {};
    if (cuisine && cuisine !== "") {
      where.Cuisine = cuisine;
    }
    if (active !== undefined) {
      where.Active = active === "true" ? "Yes" : "No";
    }

    const merchants = await prisma.Merchants.findMany({
      where,
      select: {
        id: true,
        Merchants_Name: true,
        Active: true,
        "Owner Email": true,
        "Owners Name": true,
        Cuisine: true,
        Area: true,
        PostCode: true,
        Address: true,
        "Opening Times": true,
        "حلال Halal Friendly?": true,
        "Booking Available": true,
        Grubsy_Partner_ID: true,
        coordinate_lat: true,
        coordinate_lon: true,
      },
    });

    console.log(`🔍 Found ${merchants.length} merchants in MySQL database`);

    // Transform data for frontend compatibility
    const transformedMerchants = merchants.map((merchant) => ({
      id: merchant.id,
      partnerId: merchant.Grubsy_Partner_ID,
      name: merchant.Merchants_Name,
      description: null, // Merchants table doesn't have description
      photo: null, // Merchants table doesn't have photo
      photoUrl: null,
      address: merchant.Address,
      cuisine: merchant.Cuisine,
      openingTimes: merchant["Opening Times"],
      hygieneRating: null, // Merchants table doesn't have hygiene rating
      halalFriendly: merchant["حلال Halal Friendly?"],
      status: merchant.Active,
      bookingAvailable: merchant["Booking Available"] === "Yes",
      area: merchant.Area,
      postcode: merchant.PostCode,
      relation: null,
      ownerEmail: merchant["Owner Email"],
      createdAt: null,
      ownerName: merchant["Owners Name"],
      ownerNumber: null,
      isOpen: merchant.Active === "Yes", // Simple check - could be enhanced with opening times logic
      // Include coordinates for distance-based sorting
      coordinates:
        merchant.coordinate_lat && merchant.coordinate_lon
          ? {
              latitude: parseFloat(merchant.coordinate_lat),
              longitude: parseFloat(merchant.coordinate_lon),
            }
          : null,
    }));

    console.log(
      `🍽️  Returning formatted restaurant data: ${transformedMerchants.length}`,
    );
    if (transformedMerchants.length > 0) {
      console.log(`📋 Sample restaurant data:`, transformedMerchants[0]);
    }

    res.json({
      success: true,
      data: transformedMerchants,
    });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch merchants",
    });
  }
}

/**
 * Get merchants for current restaurant staff user
 */
async function getMyMerchants(req, res) {
  try {
    const userEmail = req.user.email;

    // Find merchants where user is the owner
    const merchants = await prisma.Merchants.findMany({
      where: {
        "Owner Email": userEmail,
        Active: "Yes", // Only active merchants
      },
      select: {
        id: true,
        Merchants_Name: true,
        Active: true,
        Cuisine: true,
        Area: true,
        PostCode: true,
        "Opening Times": true,
      },
    });

    // If user has no owned merchants, check if they're staff for any merchant
    if (merchants.length === 0) {
      // For now, return empty array - in future could check staff assignments
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: merchants,
    });
  } catch (error) {
    console.error("Error fetching user merchants:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch merchants",
    });
  }
}

/**
 * Get a single merchant by ID
 */
async function getById(req, res) {
  try {
    const { id } = req.params;

    const merchant = await prisma.Merchants.findUnique({
      where: { id },
      select: {
        id: true,
        Merchants_Name: true,
        Active: true,
        "Owner Email": true,
        "Owners Name": true,
        Cuisine: true,
        Area: true,
        PostCode: true,
        Address: true,
        "Opening Times": true,
        "حلال Halal Friendly?": true,
        "Booking Available": true,
        Grubsy_Partner_ID: true,
        coordinate_lat: true,
        coordinate_lon: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({
        error: "Merchant not found",
      });
    }

    // Transform data for frontend compatibility
    const transformedMerchant = {
      id: merchant.id,
      name: merchant.Merchants_Name,
      description: null, // Merchants table doesn't have description
      photo: null, // Merchants table doesn't have photo
      photoUrl: null,
      address: merchant.Address,
      cuisine: merchant.Cuisine,
      openingTimes: merchant["Opening Times"],
      hygieneRating: null, // Merchants table doesn't have hygiene rating
      halalFriendly: merchant["حلال Halal Friendly?"],
      status: merchant.Active,
      bookingAvailable: merchant["Booking Available"] === "Yes",
      area: merchant.Area,
      postcode: merchant.PostCode,
      relation: null,
      ownerEmail: merchant["Owner Email"],
      createdAt: null,
      ownerName: merchant["Owners Name"],
      ownerNumber: null,
      partnerId: merchant.Grubsy_Partner_ID,
      // Include coordinates for distance calculations
      coordinates:
        merchant.coordinate_lat && merchant.coordinate_lon
          ? {
              latitude: parseFloat(merchant.coordinate_lat),
              longitude: parseFloat(merchant.coordinate_lon),
            }
          : null,
    };

    res.json({
      success: true,
      data: transformedMerchant,
    });
  } catch (error) {
    console.error("Error fetching merchant:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch merchant",
    });
  }
}

/**
 * Update merchant (toggle accepting orders, etc.)
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userEmail = req.user.email;

    // Find the merchant first
    const merchant = await prisma.Merchants.findUnique({
      where: { Grubsy_Partner_ID: id },
      select: { "Owner Email": true },
    });

    if (!merchant) {
      return res.status(404).json({
        error: "Merchant not found",
      });
    }

    // Check if user has access to update this merchant
    if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "DEVSTAFF" &&
      merchant["Owner Email"] !== userEmail
    ) {
      return res.status(403).json({
        error: "Access denied. You can only update your own merchants.",
      });
    }

    // Validate Active field if provided
    if (updates.Active && !["Yes", "No"].includes(updates.Active)) {
      return res.status(400).json({
        error: 'Invalid Active value. Must be "Yes" or "No".',
      });
    }

    // Update the merchant
    const updatedMerchant = await prisma.Merchants.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        Merchants_Name: true,
        Active: true,
        Cuisine: true,
        Area: true,
        PostCode: true,
      },
    });

    res.json({
      success: true,
      data: updatedMerchant,
      message: "Merchant updated successfully",
    });
  } catch (error) {
    console.error("Error updating merchant:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update merchant",
    });
  }
}

/**
 * Get menu items for a merchant (public access for customers)
 */
async function getMenu(req, res) {
  try {
    const { id } = req.params;

    console.log("🍽️ Getting menu for merchant ID:", id, "by public user");

    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: id },
      select: {
        Grubsy_Partner_ID: true,
        Merchants_Name: true,
      },
    });

    if (!merchant) {
      console.log("❌ Merchant not found with Partner ID:", id);
      return res.status(404).json({
        success: false,
        error: "Merchant not found",
      });
    }

    console.log(
      "✅ Found merchant with Partner ID:",
      merchant.Grubsy_Partner_ID,
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
      },
    });

    console.log(
      `🔍 Found ${menuItems.length} menu items for Partner ID: ${merchant.Grubsy_Partner_ID}`,
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
        `📊 Total items for Partner ID ${merchant.Grubsy_Partner_ID}: ${allItems.length}`,
      );
      if (allItems.length > 0) {
        console.log(
          "📋 Availability status:",
          allItems.map((item) => item.Available),
        );
      }
    }

    const menu = menuItems.map((item) => ({
      id: item.id,
      menuItemId: item.Menu_Item_ID,
      // Frontend compatibility - provide both formats
      Item: item.Item, // Original database field name for item availability screen
      name: item.Item, // CamelCase version for other screens
      type: "item", // Default to 'item' type for regular menu items
      foodCategory: item.Food_Category, // Match frontend MenuItem type
      // Price fields - keep original strings and provide parsed versions
      Regular: item.Regular, // Original string for item availability screen
      Medium: item.Medium,
      Large: item.Large,
      Platter: item.Platter,
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
      Image: item.Image, // Original field name for compatibility
      Description: item.Description, // Original field name for item availability screen
      description: item.Description, // CamelCase version
      notes: item.Notes,
      Notes: item.Notes, // Original field name
      Available: item.Available, // Original string "Yes"/"No" for item availability screen
      isAvailable: item.Available === "Yes",
      available: item.Available === "Yes", // Boolean version for backwards compatibility
      soldOut: item.Available !== "Yes", // Add for menu screen availability checks
      options: [], // Add empty options array for compatibility
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
        menu.filter((i) => i.regularPrice).length,
      );
      console.log(
        "   - Items with Medium price:",
        menu.filter((i) => i.mediumPrice).length,
      );
      console.log(
        "   - Items with Large price:",
        menu.filter((i) => i.largePrice).length,
      );
      console.log(
        "   - Items with Platter price:",
        menu.filter((i) => i.platterPrice).length,
      );
      console.log(
        "   - Items with images:",
        menu.filter((i) => i.imageURL).length,
      );
      console.log(
        "   - Items with descriptions:",
        menu.filter((i) => i.description).length,
      );
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get menu",
    });
  }
}

export { getAll, getById, getMyMerchants, update, getMenu };
