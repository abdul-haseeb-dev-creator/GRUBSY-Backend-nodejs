// routes/admin/settings.js
// Admin Settings API - Platform settings management
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

// In-memory settings store (in production, use database)
const settingsStore = {
  platform: {
    name: 'Grubsy',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  },
  commission: {
    driver: 15, // percentage
    merchant: 20 // percentage
  },
  orders: {
    defaultStatus: 'PENDING',
    otpRequired: true,
    autoAssignDriver: false
  },
  notifications: {
    emailEnabled: false,
    pushEnabled: true,
    smsEnabled: false
  },
  delivery: {
    defaultRadius: 5, // km
    maxRadius: 15,
    freeDeliveryThreshold: 50
  },
  payments: {
    paymentGateway: 'stripe',
    currency: 'GBP',
    minimumOrder: 10
  },
  features: {
    driverApp: true,
    merchantApp: true,
    loyaltyPoints: false,
    coupons: true
  }
};

/**
 * GET /api/admin/settings
 * Get all platform settings
 */
router.get('/', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    // Try to get from database first
    try {
      const dbSettings = await prisma.app_Settings.findMany();
      if (dbSettings.length > 0) {
        const settings = {};
        dbSettings.forEach(s => {
          settings[s.key] = s.value;
        });
        return res.json({
          success: true,
          data: settings
        });
      }
    } catch (e) {
      // Table might not exist
    }

    // Return default settings
    res.json({
      success: true,
      data: settingsStore
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

/**
 * GET /api/admin/settings/:category
 * Get settings by category
 */
router.get('/:category', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { category } = req.params;

    if (settingsStore[category]) {
      return res.json({
        success: true,
        data: settingsStore[category]
      });
    }

    // Try database
    try {
      const dbSettings = await prisma.app_Settings.findMany({
        where: { category }
      });
      
      if (dbSettings.length > 0) {
        const settings = {};
        dbSettings.forEach(s => {
          settings[s.key] = s.value;
        });
        return res.json({
          success: true,
          data: settings
        });
      }
    } catch (e) {}

    res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  } catch (error) {
    console.error('Get category settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category settings'
    });
  }
});

/**
 * PUT /api/admin/settings
 * Update all settings
 */
router.put('/', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const updates = req.body;

    // Merge updates
    Object.keys(updates).forEach(key => {
      if (settingsStore[key]) {
        settingsStore[key] = { ...settingsStore[key], ...updates[key] };
      } else {
        settingsStore[key] = updates[key];
      }
    });

    // Try to save to database
    try {
      for (const [category, values] of Object.entries(updates)) {
        for (const [key, value] of Object.entries(values)) {
          await prisma.app_Settings.upsert({
            where: { key },
            update: { value, category },
            create: { key, value, category }
          });
        }
      }
    } catch (e) {
      // Table might not exist
    }

    res.json({
      success: true,
      data: settingsStore,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * PUT /api/admin/settings/:category
 * Update settings for a specific category
 */
router.put('/:category', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { category } = req.params;
    const updates = req.body;

    if (!settingsStore[category]) {
      settingsStore[category] = {};
    }

    // Merge updates
    settingsStore[category] = { ...settingsStore[category], ...updates };

    // Try to save to database
    try {
      for (const [key, value] of Object.entries(updates)) {
        await prisma.app_Settings.upsert({
          where: { key },
          update: { value, category },
          create: { key, value, category }
        });
      }
    } catch (e) {
      // Table might not exist
    }

    res.json({
      success: true,
      data: settingsStore[category],
      message: `${category} settings updated successfully`
    });
  } catch (error) {
    console.error('Update category settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category settings'
    });
  }
});

/**
 * GET /api/admin/settings/config/:key
 * Get a specific config value
 */
router.get('/config/:key', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { key } = req.params;

    // Search in all categories
    for (const [category, values] of Object.entries(settingsStore)) {
      if (values[key] !== undefined) {
        return res.json({
          success: true,
          data: {
            key,
            value: values[key],
            category
          }
        });
      }
    }

    // Try database
    try {
      const dbSetting = await prisma.app_Settings.findUnique({ where: { key } });
      if (dbSetting) {
        return res.json({
          success: true,
          data: {
            key: dbSetting.key,
            value: dbSetting.value,
            category: dbSetting.category
          }
        });
      }
    } catch (e) {}

    res.status(404).json({
      success: false,
      error: 'Config key not found'
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch config'
    });
  }
});

/**
 * POST /api/admin/settings/config
 * Set a specific config value
 */
router.post('/config', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { key, value, category = 'general' } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'key is required'
      });
    }

    // Find which category this key belongs to
    let foundCategory = category;
    for (const [cat, values] of Object.entries(settingsStore)) {
      if (values[key] !== undefined) {
        foundCategory = cat;
        settingsStore[cat][key] = value;
        break;
      }
    }

    // If not found in any category, add to general or specified category
    if (!settingsStore[foundCategory]) {
      settingsStore[foundCategory] = {};
    }
    settingsStore[foundCategory][key] = value;

    // Try to save to database
    try {
      await prisma.app_Settings.upsert({
        where: { key },
        update: { value, category: foundCategory },
        create: { key, value, category: foundCategory }
      });
    } catch (e) {
      // Table might not exist
    }

    res.json({
      success: true,
      data: {
        key,
        value,
        category: foundCategory
      },
      message: 'Config updated successfully'
    });
  } catch (error) {
    console.error('Set config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set config'
    });
  }
});

/**
 * DELETE /api/admin/settings/config/:key
 * Delete a config value
 */
router.delete('/config/:key', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { key } = req.params;

    // Try to find and delete from all categories
    let deleted = false;
    for (const [category, values] of Object.entries(settingsStore)) {
      if (values[key] !== undefined) {
        delete settingsStore[category][key];
        deleted = true;
        break;
      }
    }

    // Try database
    try {
      await prisma.app_Settings.delete({ where: { key } });
      deleted = true;
    } catch (e) {}

    if (deleted) {
      res.json({
        success: true,
        message: 'Config deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Config key not found'
      });
    }
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete config'
    });
  }
});

/**
 * GET /api/admin/settings/export
 * Export all settings
 */
router.get('/export', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: settingsStore,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export settings'
    });
  }
});

/**
 * POST /api/admin/settings/import
 * Import settings
 */
router.post('/import', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings object is required'
      });
    }

    // Merge with existing
    settingsStore = { ...settingsStore, ...settings };

    res.json({
      success: true,
      data: settingsStore,
      message: 'Settings imported successfully'
    });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import settings'
    });
  }
});

/**
 * POST /api/admin/settings/reset
 * Reset settings to default
 */
router.post('/reset', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const defaultSettings = {
      platform: {
        name: 'Grubsy',
        version: '1.0.0',
        environment: 'production'
      },
      commission: {
        driver: 15,
        merchant: 20
      },
      orders: {
        defaultStatus: 'PENDING',
        otpRequired: true,
        autoAssignDriver: false
      },
      notifications: {
        emailEnabled: false,
        pushEnabled: true,
        smsEnabled: false
      },
      delivery: {
        defaultRadius: 5,
        maxRadius: 15,
        freeDeliveryThreshold: 50
      },
      payments: {
        paymentGateway: 'stripe',
        currency: 'GBP',
        minimumOrder: 10
      },
      features: {
        driverApp: true,
        merchantApp: true,
        loyaltyPoints: false,
        coupons: true
      }
    };

    // Clear database settings
    try {
      await prisma.app_Settings.deleteMany({});
    } catch (e) {}

    res.json({
      success: true,
      data: defaultSettings,
      message: 'Settings reset to default'
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  }
});

export default router;
