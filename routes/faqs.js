const express = require('express');
const router = express.Router();

// FAQ feature is currently disabled. Implementation will be added when feature is enabled.
// This route file is currently disabled via feature flags in app.js
// Enable faq_api feature flag to activate these endpoints

router.get('/', (req, res) => {
  const SERVICE_UNAVAILABLE = 503; // HTTP 503 Service Unavailable
  res.status(SERVICE_UNAVAILABLE).json({
    message: 'FAQ API is currently disabled - use static FAQ page',
    status: 'coming_soon',
  });
});

router.post('/', (req, res) => {
  const SERVICE_UNAVAILABLE = 503; // HTTP 503 Service Unavailable
  res.status(SERVICE_UNAVAILABLE).json({
    message: 'FAQ API is currently disabled - use static FAQ page',
    status: 'coming_soon',
  });
});

module.exports = router;
