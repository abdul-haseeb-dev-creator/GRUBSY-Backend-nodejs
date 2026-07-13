// routes/admin/menu.js
// Admin Menu Management API - Menu items management for admin panel
// Uses ES modules to align with existing codebase

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole } from '../../middleware/authenticateAdmin.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/menu/items
 * Get all menu items with optional filtering
 */
router.get('/items', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { search, category, partner_id, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { Item: { contains: search } },
        { Description: { contains: search } }
      ];
    }
    if (category) {
      where.Food_Category = category;
    }
    if (partner_id) {
      where.Grubsy_Partner_ID = partner_id;
    }

    const [items, total] = await Promise.all([
      prisma.menu_items.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { Created_At: 'desc' }
      }),
      prisma.menu_items.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items'
    });
  }
});

/**
 * GET /api/admin/menu/items/:id
 * Get single menu item by ID
 */
router.get('/items/:id', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.menu_items.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu item'
    });
  }
});

/**
 * POST /api/admin/menu/items
 * Create new menu item
 */
router.post('/items', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      partner_id,
      item_id,
      item,
      description,
      food_category,
      regular_price,
      medium_price,
      large_price,
      platter_price,
      image_url,
      available,
      notes
    } = req.body;

    // Validate required fields
    if (!partner_id || !item) {
      return res.status(400).json({
        success: false,
        error: 'partner_id and item are required'
      });
    }

    // Check if merchant exists
    const merchant = await prisma.merchants.findUnique({
      where: { Grubsy_Partner_ID: partner_id }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Generate item ID if not provided
    const menuItemId = item_id || `MENU-${Date.now()}`;

    const newItem = await prisma.menu_items.create({
      data: {
        Menu_Item_ID: menuItemId,
        Grubsy_Partner_ID: partner_id,
        Item: item,
        Description: description || '',
        Food_Category: food_category || 'Uncategorized',
        Regular_Price: regular_price || 0,
        Medium_Price: medium_price || 0,
        Large_Price: large_price || 0,
        Platter_Price: platter_price || 0,
        Image_URL: image_url || '',
        Available: available === false ? 'No' : 'Yes',
        Notes: notes || ''
      }
    });

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item'
    });
  }
});

/**
 * PUT /api/admin/menu/items/:id
 * Update menu item
 */
router.put('/items/:id', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if item exists
    const existingItem = await prisma.menu_items.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Build update object
    const updateData = {};
    if (updates.item !== undefined) updateData.Item = updates.item;
    if (updates.description !== undefined) updateData.Description = updates.description;
    if (updates.food_category !== undefined) updateData.Food_Category = updates.food_category;
    if (updates.regular_price !== undefined) updateData.Regular_Price = updates.regular_price;
    if (updates.medium_price !== undefined) updateData.Medium_Price = updates.medium_price;
    if (updates.large_price !== undefined) updateData.Large_Price = updates.large_price;
    if (updates.platter_price !== undefined) updateData.Platter_Price = updates.platter_price;
    if (updates.image_url !== undefined) updateData.Image_URL = updates.image_url;
    if (updates.available !== undefined) updateData.Available = updates.available ? 'Yes' : 'No';
    if (updates.notes !== undefined) updateData.Notes = updates.notes;

    const updatedItem = await prisma.menu_items.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item'
    });
  }
});

/**
 * PATCH /api/admin/menu/items/:id/toggle
 * Toggle menu item availability
 */
router.patch('/items/:id/toggle', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { Available } = req.body;

    const existingItem = await prisma.menu_items.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    const newAvailability = Available !== undefined ? (Available ? 'Yes' : 'No') : 
      (existingItem.Available === 'Yes' ? 'No' : 'Yes');

    const updatedItem = await prisma.menu_items.update({
      where: { id },
      data: { Available: newAvailability }
    });

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Toggle menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle menu item availability'
    });
  }
});

/**
 * DELETE /api/admin/menu/items/:id
 * Delete menu item
 */
router.delete('/items/:id', authenticateAdmin, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const existingItem = await prisma.menu_items.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    await prisma.menu_items.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item'
    });
  }
});

/**
 * GET /api/admin/menu/items/all-columns
 * Get all menu items with all columns (for admin grid)
 */
router.get('/items/all-columns', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const items = await prisma.menu_items.findMany({
      orderBy: { Created_At: 'desc' }
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items'
    });
  }
});

/**
 * GET /api/admin/menu/categories
 * Get all unique food categories
 */
router.get('/categories', authenticateAdmin, requireRole('super_admin', 'admin', 'operations'), async (req, res) => {
  try {
    const { partner_id } = req.query;
    
    const where = partner_id ? { Grubsy_Partner_ID: partner_id } : {};
    
    const categories = await prisma.menu_items.findMany({
      where,
      select: { Food_Category: true },
      distinct: ['Food_Category'],
      orderBy: { Food_Category: 'asc' }
    });

    res.json({
      success: true,
      data: categories.map(c => c.Food_Category).filter(Boolean)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * POST /api/admin/menu/items/bulk-upload
 * Bulk upload menu items
 */
router.post('/items/bulk-upload', authenticateAdmin, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const item of items) {
      try {
        const { partner_id, item_id, item: itemName, ...rest } = item;
        
        if (!partner_id || !itemName) {
          results.failed++;
          results.errors.push({ item: itemName, error: 'Missing required fields' });
          continue;
        }

        const menuItemId = item_id || `MENU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        await prisma.menu_items.upsert({
          where: { Menu_Item_ID: menuItemId },
          update: {
            Item: itemName,
            Description: rest.description || '',
            Food_Category: rest.food_category || 'Uncategorized',
            Regular_Price: rest.regular_price || 0,
            Medium_Price: rest.medium_price || 0,
            Large_Price: rest.large_price || 0,
            Platter_Price: rest.platter_price || 0,
            Image_URL: rest.image_url || '',
            Available: rest.available !== false ? 'Yes' : 'No',
            Notes: rest.notes || ''
          },
          create: {
            Menu_Item_ID: menuItemId,
            Grubsy_Partner_ID: partner_id,
            Item: itemName,
            Description: rest.description || '',
            Food_Category: rest.food_category || 'Uncategorized',
            Regular_Price: rest.regular_price || 0,
            Medium_Price: rest.medium_price || 0,
            Large_Price: rest.large_price || 0,
            Platter_Price: rest.platter_price || 0,
            Image_URL: rest.image_url || '',
            Available: rest.available !== false ? 'Yes' : 'No',
            Notes: rest.notes || ''
          }
        });

        results.updated++;
      } catch (itemError) {
        results.failed++;
        results.errors.push({ item: item.item, error: itemError.message });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk upload menu items'
    });
  }
});

/**
 * GET /api/menu-options
 * Get menu options/modifiers (placeholder - not implemented yet)
 */
router.get('/../../menu-options', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});



export default router;
