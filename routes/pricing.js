import express from "express";
const router = express.Router();
import pricingService from "../services/pricingService.mjs";

/**
 * @route POST /api/pricing/preview
 * @desc Get pricing preview for given distance and subtotal (User App endpoint)
 * @access Public
 * @body { distance: number (in miles), subtotal: number }
 * @returns { subtotal: number, fees: { service: number, delivery: number }, grandTotal: number }
 */
router.post("/preview", async (req, res) => {
  try {
    const { distance, subtotal } = req.body;

    // Validate inputs
    const distanceNum = parseFloat(distance);
    const subtotalNum = parseFloat(subtotal);

    if (!pricingService.isValidDistance(distanceNum)) {
      return res.status(400).json({
        error: "Invalid distance. Must be between 0 and 50 miles.",
      });
    }

    if (!pricingService.isValidSubtotal(subtotalNum)) {
      return res.status(400).json({
        error: "Invalid subtotal. Must be a positive number.",
      });
    }

    const pricing = pricingService.getPricingPreview(distanceNum, subtotalNum);

    // Return in the format expected by the User App frontend
    // Client expects: { subtotal, fees: { service, delivery }, grandTotal }
    // For small orders, delivery fee includes the small order surcharge
    const deliveryFeeTotal = pricing.fees.delivery + pricing.fees.smallOrder;

    res.json({
      subtotal: pricing.subtotal,
      fees: {
        service: pricing.fees.service,
        delivery: deliveryFeeTotal,
      },
      grandTotal: pricing.grandTotal,
    });
  } catch (error) {
    console.error("Error in pricing preview endpoint", {
      error: error.message,
    });
    res.status(500).json({
      error: "Internal server error calculating pricing",
    });
  }
});

/**
 * @route GET /api/pricing/preview
 * @desc Get pricing preview for given distance and subtotal
 * @access Public
 * @query { distance: number (in miles), subtotal: number }
 * @returns { subtotal: number, fees: { service: number, delivery: number }, grandTotal: number }
 */
router.get("/preview", async (req, res) => {
  try {
    const { distance, subtotal } = req.query;

    // Validate inputs
    const distanceNum = parseFloat(distance);
    const subtotalNum = parseFloat(subtotal);

    if (!pricingService.isValidDistance(distanceNum)) {
      return res.status(400).json({
        error: "Invalid distance. Must be between 0 and 50 miles.",
      });
    }

    if (!pricingService.isValidSubtotal(subtotalNum)) {
      return res.status(400).json({
        error: "Invalid subtotal. Must be a positive number.",
      });
    }

    const pricing = pricingService.getPricingPreview(distanceNum, subtotalNum);

    // Return in the same format as POST endpoint for consistency
    // For small orders, delivery fee includes the small order surcharge
    const deliveryFeeTotal = pricing.fees.delivery + pricing.fees.smallOrder;

    res.json({
      subtotal: pricing.subtotal,
      fees: {
        service: pricing.fees.service,
        delivery: deliveryFeeTotal,
      },
      grandTotal: pricing.grandTotal,
    });
  } catch (error) {
    console.error("Error in pricing preview endpoint", {
      error: error.message,
    });
    res.status(500).json({
      error: "Internal server error calculating pricing",
    });
  }
});

/**
 * @route POST /api/pricing/calculate
 * @desc Calculate complete order pricing
 * @access Public
 */
router.post("/calculate", async (req, res) => {
  try {
    const { distance, subtotal, isSmallOrder } = req.body;

    // Validate inputs
    const distanceNum = parseFloat(distance);
    const subtotalNum = parseFloat(subtotal);
    const smallOrderFlag = isSmallOrder === true || isSmallOrder === "true";

    if (!pricingService.isValidDistance(distanceNum)) {
      return res.status(400).json({
        error: "Invalid distance. Must be between 0 and 50 miles.",
      });
    }

    if (!pricingService.isValidSubtotal(subtotalNum)) {
      return res.status(400).json({
        error: "Invalid subtotal. Must be a positive number.",
      });
    }

    const pricing = pricingService.calculateOrderPricing(
      distanceNum,
      subtotalNum,
      smallOrderFlag,
    );

    res.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error in pricing calculate endpoint", {
      error: error.message,
    });
    res.status(500).json({
      error: "Internal server error calculating pricing",
    });
  }
});

/**
 * @route GET /api/pricing/delivery-fee
 * @desc Get delivery fee for a specific distance
 * @access Public
 */
router.get("/delivery-fee", async (req, res) => {
  try {
    const { distance } = req.query;
    const distanceNum = parseFloat(distance);

    if (!pricingService.isValidDistance(distanceNum)) {
      return res.status(400).json({
        error: "Invalid distance. Must be between 0 and 50 miles.",
      });
    }

    const fee = pricingService.calculateDeliveryFee(distanceNum);

    res.json({
      success: true,
      data: {
        distance: distanceNum,
        deliveryFee: fee,
        formattedFee: `£${fee.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Error in delivery fee endpoint", { error: error.message });
    res.status(500).json({
      error: "Internal server error calculating delivery fee",
    });
  }
});

/**
 * @route GET /api/pricing/service-charge
 * @desc Get service charge for a specific distance and subtotal
 * @access Public
 */
router.get("/service-charge", async (req, res) => {
  try {
    const { distance, subtotal } = req.query;
    const distanceNum = parseFloat(distance);
    const subtotalNum = parseFloat(subtotal);

    if (!pricingService.isValidDistance(distanceNum)) {
      return res.status(400).json({
        error: "Invalid distance. Must be between 0 and 50 miles.",
      });
    }

    if (!pricingService.isValidSubtotal(subtotalNum)) {
      return res.status(400).json({
        error: "Invalid subtotal. Must be a positive number.",
      });
    }

    const serviceCharge = pricingService.calculateServiceCharge(
      distanceNum,
      subtotalNum,
    ); // Percentage by distance, min £1.50

    res.json({
      success: true,
      data: {
        distance: distanceNum,
        subtotal: subtotalNum,
        serviceCharge: serviceCharge,
        formattedCharge: `£${serviceCharge.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Error in service charge endpoint", { error: error.message });
    res.status(500).json({
      error: "Internal server error calculating service charge",
    });
  }
});

/**
 * @route GET /api/pricing/small-order-fee
 * @desc Get small order fee for a specific distance
 * @access Public
 */
router.get("/small-order-fee", async (req, res) => {
  try {
    const { distance } = req.query;
    const distanceNum = parseFloat(distance);

    if (!pricingService.isValidDistance(distanceNum)) {
      return res.status(400).json({
        error: "Invalid distance. Must be between 0 and 50 miles.",
      });
    }

    const fee = pricingService.calculateSmallOrderFee(distanceNum);

    res.json({
      success: true,
      data: {
        distance: distanceNum,
        smallOrderFee: fee,
        formattedFee: `£${fee.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Error in small order fee endpoint", {
      error: error.message,
    });
    res.status(500).json({
      error: "Internal server error calculating small order fee",
    });
  }
});

export default router;
