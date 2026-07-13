// grubsy-backend/src/drivers.js
import pkg from "@prisma/client";
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { badRequest, notFound, ok, unauthorized } from "./utils/validate.js";
const { PrismaClient, OrderStatus } = pkg;

const prisma = new PrismaClient();
const router = express.Router();

// Driver authentication middleware - REQUIRES VALID JWT TOKEN
const authenticateDriver = async (req, res, next) => {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required - please log in'
      });
    }

    // Verify JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'grubsy-jwt-secret-key-for-development-use-only-32chars');

    // Extract driver ID from token
    req.driverId = payload.driverId || payload.sub;

    if (!req.driverId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token - no driver ID found'
      });
    }

    console.log("✅ Authenticated driver ID:", req.driverId);
    next();
  } catch (error) {
    console.error('Driver authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token - please log in again'
    });
  }
};

// Driver login endpoint (no authentication required)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find driver by email - prefer the original driver GD-001 if multiple exist
    let driver = await prisma.drivers.findFirst({
      where: { Driver_ID: 'GD-001', email: email }
    });

    if (!driver) {
      driver = await prisma.drivers.findFirst({
        where: { email: email }
      });
    }

    if (!driver) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password - handle both hashed and plain text for testing
    let isValidPassword = false;
    if (driver.driver_pw.startsWith('$2a$') || driver.driver_pw.startsWith('$2b$') || driver.driver_pw.startsWith('$2y$')) {
      // Password is hashed
      isValidPassword = await bcrypt.compare(password, driver.driver_pw);
    } else {
      // Password is plain text (for testing)
      isValidPassword = password === driver.driver_pw;
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: driver.Driver_ID,
        driverId: driver.Driver_ID,
        email: driver.email,
        role: 'driver'
      },
      process.env.JWT_SECRET || 'grubsy-jwt-secret-key-for-development-use-only-32chars',
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.drivers.update({
      where: { Driver_ID: driver.Driver_ID },
      data: { last_login: new Date() }
    });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        driver: {
          id: driver.Driver_ID,
          email: driver.email,
          firstName: driver.first_name,
          lastName: driver.last_name,
          phone: driver.phone,
          status: driver.status,
          vehicleType: driver.vehicle_type
        }
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// POST /api/driver/register - Register new driver (no authentication required)
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      vehicleType,
      vehicleReg,
      drivingLicence,
      licenceExpiry,
      addressLine1,
      addressLine2,
      city,
      countyRegion,
      postcode,
      country,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceCoverageType,
      insuranceExpiry,
      rightToWork,
      utrNumber,
      niNumber,
      emergencyContactName,
      emergencyContactPhone,
      baseCity,
      workSchedule,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !password || !vehicleType || !addressLine1 || !city || !postcode || !country) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: firstName, lastName, phone, password, vehicleType, addressLine1, city, postcode, country"
      });
    }

    // Check if driver already exists with this phone or email
    const existingDriver = await prisma.drivers.findFirst({
      where: {
        OR: [
          { phone: phone },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });

    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: "A driver with this phone number or email already exists"
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique Driver_ID
    const driverCount = await prisma.drivers.count();
    const driverId = `GD-${String(driverCount + 1).padStart(3, '0')}`;

    // Create new driver record
    const newDriver = await prisma.drivers.create({
      data: {
        Driver_ID: driverId,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone,
        driver_pw: hashedPassword,
        status: 'pending',
        vehicle_type: vehicleType,
        vehicle_reg: vehicleReg || null,
        driving_licence: drivingLicence || null,
        licence_expiry: licenceExpiry ? new Date(licenceExpiry) : null,
        Registered_address: addressLine1,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city: city,
        state_region: countyRegion || null,
        postcode: postcode,
        country: country,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: insurancePolicyNumber || null,
        insurance_coverage_type: insuranceCoverageType || null,
        insurance_expiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        utr_number: utrNumber || null,
        ni_number: niNumber || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        base_city: baseCity || null,
        work_schedule: workSchedule || null,
      },
    });

    return res.json({
      success: true,
      data: {
        message: "Driver registration submitted successfully",
        driverId: newDriver.Driver_ID,
        status: "pending_review",
      }
    });
  } catch (error) {
    console.error("Driver registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to register driver",
    });
  }
});

// Apply authentication to all other driver routes
router.use(authenticateDriver);

/**
 * @swagger
 * /api/driver/config:
 *   get:
 *     summary: Get driver app configuration
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
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
 *                     googleMapsApiKey:
 *                       type: string
 *                       description: Google Maps API key
 *                     googlePlacesApiKey:
 *                       type: string
 *                       description: Google Places API key
 *                     apiUrl:
 *                       type: string
 *                       description: Backend API URL
 *                       example: 'http://localhost:3002/api'
 *       500:
 *         description: Server error
 */

// GET /api/driver/config - Get driver app configuration
router.get("/config", async (req, res) => {
  try {
    return ok(res, {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
      googlePlacesApiKey:
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        "",
      apiUrl:
        process.env.API_URL ||
        `http://localhost:${process.env.PORT || 3002}/api`,
    });
  } catch (error) {
    console.error("Get driver config error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get config",
    });
  }
});

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get driver profile information
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update driver profile
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'John Smith'
 *               vehicle:
 *                 type: string
 *                 example: 'Blue Ford Transit - AB12 CDE'
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Driver profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       500:
 *         description: Server error
 */

// GET /api/driver/profile - Get driver profile
router.get("/profile", async (req, res) => {
  try {
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: req.driverId },
    });

    if (!driver) {
      return notFound(res, "Driver not found");
    }

    return ok(res, {
      id: driver.Driver_ID,
      firstName: driver.first_name,
      lastName: driver.last_name,
      fullName: `${driver.first_name} ${driver.last_name}`,
      email: driver.email,
      phone: driver.phone,
      profilePhotoUrl: driver.profile_photo_url,
      status: driver.status,
      vehicleType: driver.vehicle_type,
      vehicleReg: driver.vehicle_reg,
      availability: driver.availability,
      currentLocationLat: driver.current_location_lat,
      currentLocationLng: driver.current_location_lng,
      completedOrders: driver.completed_orders,
      ratingAvg: driver.rating,
      ratingCount: driver.rating_count,
      earningsTotal: driver.earnings_total,
      currentBalance: driver.current_balance,
      createdAt: driver.created_at,
      updatedAt: driver.updated_at,
      maxDistance: driver.max_distance,
      workHour: driver.work_schedule,
      pushNotifications: driver.push_notification,
      soundNotifications: driver.sound_notification,
      vibrationNotifications: driver.vibrate_notification 
    });
  } catch (error) {
    console.error("Get driver profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
});

// PUT /api/driver/profile - Update driver profile
router.put("/profile", async (req, res) => {
  const { firstName, lastName, email, phone, vehicleReg, availability } = req.body || {};

  try {
    const updateData = {};

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (vehicleReg !== undefined) updateData.vehicle_reg = vehicleReg;
    if (availability !== undefined) updateData.availability = availability;

    const driver = await prisma.drivers.update({
      where: { Driver_ID: req.driverId },
      data: updateData,
    });

    return ok(res, {
      id: driver.Driver_ID,
      firstName: driver.first_name,
      lastName: driver.last_name,
      fullName: `${driver.first_name} ${driver.last_name}`,
      email: driver.email,
      phone: driver.phone,
      vehicleReg: driver.vehicle_reg,
      availability: driver.availability,
      updatedAt: driver.updated_at,
    });
  } catch (error) {
    console.error("Update driver profile error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
});

/**
 * @swagger
 * /api/driver/change-password:
 *   put:
 *     summary: Change driver password
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: 'oldpassword123'
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 example: 'newpassword456'
 *                 description: New password (minimum 8 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Password changed successfully'
 *       400:
 *         description: Invalid input or missing fields
 *       401:
 *         description: Invalid current password
 *       500:
 *         description: Server error
 */

// PUT /api/driver/change-password - Change driver password
router.put("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return badRequest(res, 'Current password and new password are required', 'currentPassword,newPassword');
  }

  if (newPassword.length < 8) {
    return badRequest(res, 'Password must be at least 8 characters long');
  }

  try {
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: req.driverId },
    });

    if (!driver) {
      return notFound(res, 'Driver not found');
    }

    // Verify current password
    let isValidCurrentPassword = false;
    if (driver.driver_pw && (driver.driver_pw.startsWith('$2a$') || driver.driver_pw.startsWith('$2b$') || driver.driver_pw.startsWith('$2y$'))) {
      // Password is hashed
      isValidCurrentPassword = await bcrypt.compare(currentPassword, driver.driver_pw);
    } else if (driver.driver_pw) {
      // Password is plain text (for testing)
      isValidCurrentPassword = currentPassword === driver.driver_pw;
    } else {
      return unauthorized(res, 'No password set for this account');
    }

    if (!isValidCurrentPassword) {
      return unauthorized(res, 'Invalid current password');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update driver's password
    await prisma.drivers.update({
      where: { Driver_ID: req.driverId },
      data: { driver_pw: hashedNewPassword },
    });

    return ok(res, {
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
});

/**
 * @swagger
 * /api/driver/location:
 *   put:
 *     summary: Update driver location
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat:
 *                 type: number
 *                 format: float
 *                 example: 51.5074
 *                 description: Latitude coordinate
 *               lng:
 *                 type: number
 *                 format: float
 *                 example: -0.1278
 *                 description: Longitude coordinate
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid coordinates
 *       500:
 *         description: Server error
 */

// PUT /api/driver/location - Update driver location
router.put("/location", async (req, res) => {
  const { lat, lng } = req.body || {};

  if (typeof lat !== "number" || typeof lng !== "number") {
    return badRequest(res, "lat and lng must be numbers", "lat,lng");
  }

  try {
    const driver = await prisma.drivers.update({
      where: { Driver_ID: req.driverId },
      data: {
        current_location_lat: lat,
        current_location_lng: lng,
        location_updated_at: new Date(),
      },
    });

    return ok(res, {
      lat: driver.current_location_lat,
      lng: driver.current_location_lng,
      updatedAt: driver.location_updated_at,
    });
  } catch (error) {
    console.error("Update driver location error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update location",
    });
  }
});

// PUT /api/driver/fcm-token - Register driver's FCM token for push notifications
router.put("/fcm-token", async (req, res) => {
  const { fcmToken, platform } = req.body || {};

  if (!fcmToken) {
    return badRequest(res, "fcmToken is required");
  }

  try {
    const driver = await prisma.drivers.update({
      where: { Driver_ID: req.driverId },
      data: {
        fcmToken: fcmToken,
      },
    });

    console.log(`📱 FCM token registered for driver ${req.driverId}`);
    return ok(res, {
      success: true,
      message: "FCM token registered successfully",
    });
  } catch (error) {
    console.error("Update FCM token error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to register FCM token",
    });
  }
});

/**
 * @swagger
 * /api/driver/orders:
 *   get:
 *     summary: Get driver's assigned/active orders
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     responses:
 *       200:
 *         description: Active orders retrieved successfully
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
 */

// GET /api/driver/orders - Get driver's assigned/active orders
router.get("/orders", async (req, res) => {
  try {
    console.log("🔍 Fetching active orders for driver:", req.driverId);

    const orders = await prisma.orders.findMany({
      where: {
        driverId: req.driverId,
        status: { in: ["ALLOCATED_DRIVER", "AT_RESTAURANT", "PICKED_UP", "OUT_FOR_DELIVERY"] }, // Active order statuses
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get unique partner IDs and user emails for separate lookups
    const partnerIds = [...new Set(orders.map((order) => order.partnerId).filter(Boolean))];
    const userEmails = [...new Set(orders.map((order) => order.userEmail).filter(Boolean))];

    // Fetch merchants data
    const merchants = await prisma.merchants.findMany({
      where: {
        Grubsy_Partner_ID: { in: partnerIds },
      },
    });

    // Fetch users data
    const users = await prisma.users.findMany({
      where: {
        Users_Email: { in: userEmails },
      },
    });

    // Create lookup maps
    const merchantMap = new Map(merchants.map((m) => [m.Grubsy_Partner_ID, m]));
    const userMap = new Map(users.map((u) => [u.Users_Email, u]));

    // Format orders for driver app with privacy controls
    const formattedOrders = orders.map((order) => {
      const merchant = merchantMap.get(order.partnerId);
      const user = userMap.get(order.userEmail);

      // Privacy: First name + first letter of surname (e.g., "John D.")
      const fullName = user?.Users_Full_Name || "Customer";
      const nameParts = fullName.split(' ');
      const customerName = nameParts.length >= 2
        ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
        : nameParts[0] || "Customer";

      return {
        id: order.orderId,
        orderId: order.orderId,
        status: order.status,
        deliveryFee: order.deliveryFee || "3.15",
        deliveryAddress: order.deliveryAddress || "",
        deliveryLat: order.coordinate_lat || null,
        deliveryLng: order.coordinate_lon || null,
        deliveryPostcode: order.deliveryPostcode || "",
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.deliveryInstructions || "",
        // Merchant data: Full address now that order is accepted
        merchantName: merchant?.Merchants_Name || "Restaurant",
        merchantLat: merchant?.coordinate_lat || null,
        merchantLng: merchant?.coordinate_lon || null,
        merchantAddress: merchant?.Address || "Pickup Address",
        merchantPostcode: merchant?.PostCode || "",
        // Customer data: Name format for privacy, NO phone number
        customerName: customerName,
        total: order.deliveryFee || "3.15", // Driver only sees delivery fee
      };
    });

    console.log(`✅ Found ${formattedOrders.length} active orders for driver`);
    console.log(formattedOrders);
    return ok(res, formattedOrders);
  } catch (error) {
    console.error("Get driver orders error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get driver orders",
    });
  }
});

/**
 * @swagger
 * /api/driver/orders/available:
 *   get:
 *     summary: Get available orders for drivers to accept
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     description: Returns orders with status READY_FOR_DRIVER that are available for any driver to accept
 *     responses:
 *       200:
 *         description: Available orders retrieved successfully
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
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// GET /api/driver/orders/available - Get available orders for drivers
router.get("/orders/available", async (req, res) => {
  try {
    console.log("Fetching available orders for drivers");

    // Get driver's current location for distance filtering
    const driver = await prisma.drivers.findUnique({
      where: { Driver_ID: req.driverId },
      select: {
        current_location_lat: true,
        current_location_lng: true,
        max_distance: true,
      },
    });

    const driverLat = driver?.current_location_lat;
    const driverLng = driver?.current_location_lng;
    const maxDistance = driver?.max_distance || 3.2; // Default 2 miles (3.2km) radius

    // Get orders that are READY_FOR_DRIVER or ALLOCATING_DRIVER with no driver assigned (null or empty string)
    // ALLOCATING_DRIVER means the system is actively looking for a driver
    const orders = await prisma.orders.findMany({
      where: {
        status: { in: ["READY_FOR_DRIVER", "ALLOCATING_DRIVER"] },
        OR: [
          { driverId: null },
          { driverId: "" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Get more to allow for distance filtering
    });

    console.log(`Found ${orders.length} available orders before distance filtering`);

    // Get unique partner IDs and user emails for separate lookups
    const partnerIds = [...new Set(orders.map((order) => order.partnerId).filter(Boolean))];
    const userEmails = [...new Set(orders.map((order) => order.userEmail).filter(Boolean))];

    // Fetch merchants data
    const merchants = await prisma.merchants.findMany({
      where: {
        Grubsy_Partner_ID: { in: partnerIds },
      },
    });

    // Fetch users data
    const users = await prisma.users.findMany({
      where: {
        Users_Email: { in: userEmails },
      },
    });

    // Create lookup maps
    const merchantMap = new Map(merchants.map((m) => [m.Grubsy_Partner_ID, m]));
    const userMap = new Map(users.map((u) => [u.Users_Email, u]));

    // Format orders for driver app with privacy controls and distance filtering
    let formattedOrders = orders.map((order) => {
      const merchant = merchantMap.get(order.partnerId);
      const user = userMap.get(order.userEmail);

      // Privacy: First name + first letter of surname (e.g., "John D.")
      const fullName = user?.Users_Full_Name || "Customer";
      const nameParts = fullName.split(' ');
      const customerName = nameParts.length >= 2
        ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
        : nameParts[0] || "Customer";

      // Calculate distance from driver to merchant (pickup location)
      let distanceKm = null;
      if (driverLat && driverLng && merchant?.coordinate_lat && merchant?.coordinate_lon) {
        distanceKm = calculateDistance(
          driverLat,
          driverLng,
          merchant.coordinate_lat,
          merchant.coordinate_lon
        );
      }

      return {
        id: order.orderId,
        orderId: order.orderId,
        status: order.status,
        deliveryFee: order.deliveryFee || "3.15",
        deliveryAddress: order.deliveryAddress || "",
        deliveryPostcode: order.deliveryPostcode || "",
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        notes: order.deliveryInstructions || "",
        // Merchant data: Only postcode until accepted (privacy rule)
        merchantName: merchant?.Merchants_Name || "Restaurant",
        merchantPostcode: merchant?.PostCode || "",
        merchantLat: merchant?.coordinate_lat || null,
        merchantLng: merchant?.coordinate_lon || null,
        // Customer data: Name format for privacy, NO phone number
        customerName: customerName,
        total: order.deliveryFee || "3.15", // Driver only sees delivery fee
        // Distance from driver to pickup location
        distanceKm: distanceKm,
      };
    });

    // Filter by distance if driver has location set
    if (driverLat && driverLng) {
      formattedOrders = formattedOrders.filter(order => {
        // Include orders where distance couldn't be calculated (no merchant coords)
        if (order.distanceKm === null) {
          console.log(`Order ${order.id} has no merchant coordinates, including without distance filter`);
          return true;
        }
        const withinRange = order.distanceKm <= maxDistance;
        if (!withinRange) {
          console.log(`Order ${order.id} is ${order.distanceKm}km away, excluding (max: ${maxDistance}km)`);
        }
        return withinRange;
      });

      // Sort by distance (closest first)
      formattedOrders.sort((a, b) => {
        if (a.distanceKm === null) return 1; // Orders without distance go last
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    // Limit to 20 results after filtering
    formattedOrders = formattedOrders.slice(0, 20);

    console.log(`Available orders after distance filtering: ${formattedOrders.length}`);
    console.log(`Available orders:`, formattedOrders.map(o => ({ id: o.id, merchant: o.merchantName, customer: o.customerName, distance: o.distanceKm ? `${o.distanceKm}km` : 'unknown' })));
    return ok(res, formattedOrders);
  } catch (error) {
    console.error("Get available orders error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get available orders",
    });
  }
});

/**
 * @swagger
 * /api/driver/orders/{orderId}/accept:
 *   put:
 *     summary: Accept an available order
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to accept
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Order not available for acceptance
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

// PUT /api/driver/orders/:orderId/accept - Accept an order
router.put("/orders/:orderId/accept", async (req, res) => {
  const { orderId } = req.params;

  console.log(`🚗 Driver ${req.driverId} attempting to accept order ${orderId}`);

  try {
    // Check if order exists and is pending
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    console.log("🔍 Order details:", order);

    if (!order) {
      console.log(`❌ Order ${orderId} not found`);
      return notFound(res, "Order not found");
    }

    if (!["PENDING", "ACCEPTED", "pending", "accepted", "READY_FOR_DRIVER", "ALLOCATING_DRIVER"].includes(order.status)) {
      console.log(`Order ${orderId} not available for acceptance, status: ${order.status}`);
      return badRequest(res, "Order is not available for acceptance");
    }

    if (order.driverId && order.driverId !== req.driverId) {
      console.log(`❌ Order ${orderId} already assigned to driver ${order.driverId}`);
      return badRequest(res, "Order already assigned to another driver");
    }

    // Update order status and assign driver
    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "ALLOCATED_DRIVER",
        driverId: req.driverId,
        driverAllocatedAt: new Date().toISOString(),
      },
      // Removed include statements due to missing relations in schema
    });
    console.log(`✅ Driver ${req.driverId} accepted order ${orderId}`);

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Accept order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to accept order",
    });
  }
});

/**
 * @swagger
 * /api/driver/orders/{orderId}/reject:
 *   put:
 *     summary: Reject an assigned order
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to reject
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: 'Vehicle breakdown'
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Order rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

// PUT /api/driver/orders/:orderId/reject - Reject an order
router.put("/orders/:orderId/reject", async (req, res) => {
  const { orderId } = req.params;

  try {
    // Check if order exists and is assigned to this driver
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    if (
      !["PENDING", "ACCEPTED", "pending", "accepted", "ALLOCATED_DRIVER", "allocated_driver"].includes(order.status)
    ) {
      return badRequest(res, "Order cannot be rejected at this stage");
    }

    // Update order status - return to ALLOCATING_DRIVER for automatic reassignment
    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "ALLOCATING_DRIVER", // Use ALLOCATING_DRIVER to trigger reassignment flow
        driverId: null,
        driverAllocatedAt: null,
      },
    });

    // Try to automatically reassign to another driver
    try {
      const assignmentService = (await import('./services/assignmentService.js')).default;
      const reassignment = await assignmentService.reassignOrder(orderId, req.driverId);
      
      if (reassignment) {
        console.log(`Order ${orderId} automatically reassigned to driver ${reassignment.driver.id}`);
      } else {
        console.log(`No available driver found for reassignment of order ${orderId}`);
      }
    } catch (reassignError) {
      console.error("Reassignment error (non-blocking):", reassignError);
      // Don't fail the rejection if reassignment fails
    }

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Reject order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reject order",
    });
  }
});

/**
 * @swagger
 * /api/driver/orders/{orderId}/pickup:
 *   put:
 *     summary: Mark order as picked up from restaurant
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to mark as picked up
 *     responses:
 *       200:
 *         description: Order marked as picked up successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

// PUT /api/driver/orders/:orderId/pickup - Mark order as picked up
router.put("/orders/:orderId/pickup", async (req, res) => {
  const { orderId } = req.params;
  const { pickupCode } = req.body || {};

  try {
    // Check if order exists and is assigned to this driver
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    if (order.status !== "AT_RESTAURANT") {
      return badRequest(res, "Driver must be at restaurant before pickup");
    }

    // Validate pickup code if provided and order has a code set
    // BACKWARD COMPATIBLE: If no code provided, allow pickup (for older app versions)
    if (pickupCode && order.pickupCode && order.pickupCode !== pickupCode) {
      console.log(`Invalid pickup code for order ${orderId}: provided=${pickupCode}, expected=${order.pickupCode}`);
      return badRequest(res, "Invalid pickup code. Please get the correct code from the restaurant.");
    }

    // Log if code was verified or skipped
    if (order.pickupCode) {
      if (pickupCode) {
        console.log(`Pickup code verified for order ${orderId}`);
      } else {
        console.log(`Pickup for order ${orderId} - code verification skipped (no code provided)`);
      }
    }

    // Update order status
    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
        outForDeliveryAt: new Date(), // Auto-advance to out for delivery
      },
      // Removed include statements due to missing relations in schema
    });

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Pickup order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark order as picked up",
    });
  }
});

/**
 * @swagger
 * /api/driver/orders/{orderId}/deliver:
 *   put:
 *     summary: Mark order as delivered to customer
 *     tags: [Drivers]
 *     security:
 *       - driverAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to mark as delivered
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proofOfDelivery:
 *                 type: string
 *                 description: Base64 encoded photo or signature
 *               deliveryNotes:
 *                 type: string
 *                 example: 'Delivered to front door'
 *     responses:
 *       200:
 *         description: Order marked as delivered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

// PUT /api/driver/orders/:orderId/deliver - Mark order as delivered
router.put("/orders/:orderId/deliver", async (req, res) => {
  const { orderId } = req.params;
  const { deliveryCode } = req.body || {};

  try {
    // Check if order exists and is assigned to this driver
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    if (order.status !== "OUT_FOR_DELIVERY") {
      return badRequest(res, "Order must be picked up before delivery");
    }

    // Validate delivery code - customer provides this code to driver
    if (!deliveryCode) {
      return badRequest(res, "Delivery code is required. Please get the code from the customer.");
    }

    if (order.deliveryCode && order.deliveryCode !== deliveryCode) {
      console.log(`Invalid delivery code for order ${orderId}: provided=${deliveryCode}, expected=${order.deliveryCode}`);
      return badRequest(res, "Invalid delivery code. Please get the correct code from the customer.");
    }

    console.log(`Delivery code verified for order ${orderId}`);

    // Update order status
    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date().toISOString(),
      },
      // Removed include statements due to missing relations in schema
    });

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Deliver order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark order as delivered",
    });
  }
});

// PUT /api/orders/:orderId/ready - Store marks order as ready for driver
router.put("/orders/:orderId/ready", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.status !== "ACCEPTED") {
      return badRequest(res, "Order must be accepted before marking as ready");
    }

    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "READY_FOR_DRIVER",
        readyAt: new Date(),
        driverAllocatingAt: new Date(), // Start allocating driver
      },
    });

    // 🚀 Push notification to nearby drivers within 2-mile radius
    try {
      const pushService = (await import('./services/pushService.js')).default;
      await pushService.notifyNearbyDrivers(orderId, updatedOrder);
    } catch (pushError) {
      console.error('Push notification error (non-blocking):', pushError);
    }

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Ready order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark order as ready",
    });
  }
});

// PUT /api/driver/orders/:orderId/arrive-restaurant - Driver arrives at restaurant
router.put("/orders/:orderId/arrive-restaurant", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    if (order.status !== "ALLOCATED_DRIVER") {
      return badRequest(
        res,
        "Order must be allocated to driver before arriving at restaurant"
      );
    }

    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "AT_RESTAURANT",
        atRestaurantAt: new Date(),
      },
    });

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Arrive restaurant error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to mark driver as arrived at restaurant",
    });
  }
});

// POST /api/orders/:orderId/confirm-pickup - Confirm pickup with code
router.post("/orders/:orderId/confirm-pickup", async (req, res) => {
  const { orderId } = req.params;
  const { pickupCode } = req.body || {};

  try {
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    if (order.status !== "AT_RESTAURANT") {
      return badRequest(res, "Driver must be at restaurant before pickup");
    }

    // Validate pickup code - merchant provides this code to driver
    if (!pickupCode) {
      return badRequest(res, "Pickup code is required");
    }

    if (order.pickupCode && order.pickupCode !== pickupCode) {
      console.log(`Invalid pickup code for order ${orderId}: provided=${pickupCode}, expected=${order.pickupCode}`);
      return badRequest(res, "Invalid pickup code. Please get the correct code from the restaurant.");
    }

    console.log(`Pickup code verified for order ${orderId}`);

    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "PICKED_UP",
        pickedUpAt: new Date(),
        outForDeliveryAt: new Date(), // Auto-advance to out for delivery
      },
    });

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Confirm pickup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to confirm pickup",
    });
  }
});

// POST /api/orders/:orderId/confirm-pickup - Confirm pickup with code
router.put("/orders/:orderId/out-for-delivery", async (req, res) => {
  const { orderId } = req.params;
  const { pickupCode } = req.body || {};

  try {
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    if (order.status !== "PICKED_UP") {
      return badRequest(res, "Driver must pick up the order before delivery");
    }

    // TODO: Validate pickup code if implemented
    // if (order.pickupCode !== pickupCode) {
    //   return badRequest(res, 'Invalid pickup code');
    // }

    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "OUT_FOR_DELIVERY",
        outForDeliveryAt: new Date(), // Auto-advance to out for delivery
      },
    });

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Confirm pickup error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to confirm pickup",
    });
  }
});

// Duplicate removed - delivery endpoint with code verification is defined above

// POST /api/orders/:orderId/cancel - Cancel order
router.post("/orders/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body || {};

  try {
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    // Allow cancellation from various states
    const cancellableStatuses = [
      "PENDING",
      "ACCEPTED",
      "READY_FOR_DRIVER",
      "ALLOCATING_DRIVER",
      "ALLOCATED_DRIVER",
      "AT_RESTAURANT",
    ];
    if (!cancellableStatuses.includes(order.status)) {
      return badRequest(res, "Order cannot be cancelled at this stage");
    }

    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || "Cancelled by user",
        driverId: null, // Unassign driver
      },
    });

    return ok(res, updatedOrder);
  } catch (error) {
    console.error("Cancel order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to cancel order",
    });
  }
});

// POST /api/driver/orders/:orderId/emergency - Emergency re-allocation
router.post("/orders/:orderId/emergency", async (req, res) => {
  const { orderId } = req.params;
  const { reason, emergencyType } = req.body || {};

  try {
    const order = await prisma.orders.findUnique({
      where: { orderId: orderId },
    });

    if (!order) {
      return notFound(res, "Order not found");
    }

    if (order.driverId !== req.driverId) {
      return unauthorized(res, "Order not assigned to you");
    }

    // Only allow emergency for active orders
    const activeStatuses = [
      "ALLOCATED_DRIVER",
      "AT_RESTAURANT",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
    ];
    if (!activeStatuses.includes(order.status)) {
      return badRequest(
        res,
        "Emergency re-allocation only allowed for active orders"
      );
    }

    // Calculate penalty (full order total minus delivery fee)
    const orderTotal = parseFloat(order.orderGrandTotal || "0");
    const deliveryFee = parseFloat(order.deliveryFee || "3.15");
    const penaltyAmount = Math.max(0, orderTotal - deliveryFee);

    // Update order for re-allocation
    const updatedOrder = await prisma.orders.update({
      where: { orderId: orderId },
      data: {
        status: "PENDING", // Back to pending state for re-allocation
        driverId: null, // Remove current driver
        emergencyReportedAt: new Date(),
        emergencyReason: reason || "Emergency reported",
        emergencyType: emergencyType || "unspecified",
        originalDriverPenalty: penaltyAmount.toString(),
      },
    });

    // TODO: Trigger re-allocation to another driver
    // This would involve finding another available driver and notifying them

    console.log(`🚨 Emergency reported for order ${orderId}:`, {
      reason,
      emergencyType,
      penaltyAmount,
      originalDriver: req.driverId,
    });

    return ok(res, {
      message: "Emergency reported successfully",
      orderId,
      penaltyAmount,
      status: "reallocating",
      reallocationTriggered: true,
    });
  } catch (error) {
    console.error("Emergency report error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to report emergency",
    });
  }
});

// GET /api/driver/emergency-options - Get emergency types for UI
router.get("/emergency-options", async (req, res) => {
  try {
    const options = [
      {
        type: "vehicle_breakdown",
        label: "Vehicle Breakdown",
        description: "Car won't start or mechanical issue",
      },
      {
        type: "accident",
        label: "Accident",
        description: "Traffic accident or collision",
      },
      {
        type: "medical_emergency",
        label: "Medical Emergency",
        description: "Health issue requiring immediate attention",
      },
      {
        type: "personal_emergency",
        label: "Personal Emergency",
        description: "Family or personal emergency",
      },
      {
        type: "app_technical_issue",
        label: "App/Technical Issue",
        description: "App not working or GPS issues",
      },
      {
        type: "other",
        label: "Other",
        description: "Other emergency situation",
      },
    ];

    return ok(res, options);
  } catch (error) {
    console.error("Get emergency options error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get emergency options",
    });
  }
});

export default router;
