// controllers/restaurants.js
// Updated controller to use Prisma database instead of SheetBest
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    // Fetch all restaurants from Prisma database using merchants table
    const restaurants = await prisma.Merchants.findMany({
      where: {
        Active: 'Yes'
      },
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
      }
    });

    // Transform to include coordinates object
    const transformedRestaurants = restaurants.map(r => ({
      ...r,
      coordinates: (r.coordinate_lat && r.coordinate_lon) ? {
        latitude: parseFloat(r.coordinate_lat),
        longitude: parseFloat(r.coordinate_lon),
      } : null,
    }));

    res.json({
      success: true,
      data: transformedRestaurants
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurants'
    });
  }
};

exports.create = async (req, res) => {
  try {
    // Create new restaurant in Prisma database using merchants table
    const restaurant = await prisma.Merchants.create({
      data: req.body
    });
    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create restaurant'
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const restaurant = await prisma.Merchants.findUnique({
      where: { id: req.params.id },
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
      }
    });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Transform to include coordinates object
    const transformedRestaurant = {
      ...restaurant,
      coordinates: (restaurant.coordinate_lat && restaurant.coordinate_lon) ? {
        latitude: parseFloat(restaurant.coordinate_lat),
        longitude: parseFloat(restaurant.coordinate_lon),
      } : null,
    };

    res.json({
      success: true,
      data: transformedRestaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const restaurant = await prisma.Merchants.update({
      where: { id: req.params.id },
      data: req.body,
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
      }
    });

    // Transform to include coordinates object
    const transformedRestaurant = {
      ...restaurant,
      coordinates: (restaurant.coordinate_lat && restaurant.coordinate_lon) ? {
        latitude: parseFloat(restaurant.coordinate_lat),
        longitude: parseFloat(restaurant.coordinate_lon),
      } : null,
    };

    res.json({
      success: true,
      data: transformedRestaurant
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant'
    });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.Merchants.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete restaurant'
    });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const menuItems = await prisma.Menu_Items.findMany({
      where: { Grubsy_Partner_ID: req.params.id }
    });
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu'
    });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    // This would need more complex logic depending on requirements
    res.json({
      success: true,
      message: 'Menu update functionality needs to be implemented'
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu'
    });
  }
};
