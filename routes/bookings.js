const express = require('express');
const router = express.Router();

// Bookings feature is currently disabled. Implementation will be added when feature is enabled.
// This route file is currently disabled via feature flags in app.js
// Enable bookings feature flag to activate these endpoints

router.get('/', (req, res) => {
  const SERVICE_UNAVAILABLE = 503; // HTTP 503 Service Unavailable
  res.status(SERVICE_UNAVAILABLE).json({
    message: 'Bookings feature is currently disabled',
    status: 'coming_soon',
  });
});

router.post('/', (req, res) => {
  const SERVICE_UNAVAILABLE = 503; // HTTP 503 Service Unavailable
  res.status(SERVICE_UNAVAILABLE).json({
    message: 'Bookings feature is currently disabled',
    status: 'coming_soon',
  });
});

module.exports = router;
