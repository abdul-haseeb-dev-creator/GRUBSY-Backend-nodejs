const express = require('express');
const restaurantsController = require('../controllers/restaurants');
const google = require('../integrations/google');
const router = express.Router();

// Get all restaurants
router.get('/', restaurantsController.getAll);
// Create a new restaurant
router.post('/', restaurantsController.create);
// Get a single restaurant
router.get('/:id', restaurantsController.getById);
// Update a restaurant
router.patch('/:id', restaurantsController.update);
// Delete a restaurant
router.delete('/:id', restaurantsController.remove);
// Get menu for a restaurant
router.get('/:id/menu', restaurantsController.getMenu);
// Update menu for a restaurant
router.patch('/:id/menu', restaurantsController.updateMenu);

// Google Places: Get place details for a restaurant
router.get('/:id/google-place', async (req, res) => {
  // You would map your restaurant ID to a Google place_id in your data
  const { placeId } = req.query;
  if (!placeId) return res.status(400).json({ error: 'Missing placeId' });
  try {
    const data = await google.getPlaceDetails(placeId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Google API error', details: err.message });
  }
});

// Google Places: Search for places
router.get('/search/google', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });
  try {
    const data = await google.searchPlaces(query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Google API error', details: err.message });
  }
});

module.exports = router;
