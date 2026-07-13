// utils/statusMapping.js
// Status mapping helper for user-facing order status labels

/**
 * Maps internal order status to user-facing labels
 * Used for order:status-changed events and GET /api/orders/:id responses
 * 
 * @param {string} internalStatus - Internal order status from database
 * @returns {string} User-facing status label
 */
function mapOrderStatusForUser(internalStatus) {
  const statusMap = {
    // Initial states → "Placed"
    'PENDING': 'Placed',
    'CONFIRMED': 'Placed',
    
    // Processing states → "Processing"
    'PROCESSING': 'Processing',
    'PREPARING': 'Processing',
    
    // Driver states → "On Route"
    'ACCEPTED': 'On Route',
    'EN_ROUTE': 'On Route',
    
    // Pickup state → "Picked up"
    'PICKED_UP': 'Picked up',
    
    // Completion state → "Delivered"
    'DELIVERED': 'Delivered',
    
    // Cancellation states → "Cancelled"
    'REJECTED': 'Cancelled',
    'CANCELLED': 'Cancelled',
    'CANCELLATION_REQUESTED': 'Cancelled',
  };

  return statusMap[internalStatus] || internalStatus;
}

/**
 * Gets all possible user-facing status labels
 * @returns {string[]} Array of user-facing status labels
 */
function getUserStatusLabels() {
  return ['Placed', 'Processing', 'On Route', 'Picked up', 'Delivered', 'Cancelled'];
}

/**
 * Maps user-facing status back to internal status (for filtering)
 * @param {string} userStatus - User-facing status label
 * @returns {string[]} Array of internal statuses that map to this label
 */
function mapUserStatusToInternal(userStatus) {
  const reverseMap = {
    'Placed': ['PENDING', 'CONFIRMED'],
    'Processing': ['PROCESSING', 'PREPARING'],
    'On Route': ['ACCEPTED', 'EN_ROUTE'],
    'Picked up': ['PICKED_UP'],
    'Delivered': ['DELIVERED'],
    'Cancelled': ['REJECTED', 'CANCELLED', 'CANCELLATION_REQUESTED'],
  };

  return reverseMap[userStatus] || [userStatus];
}

module.exports = {
  mapOrderStatusForUser,
  getUserStatusLabels,
  mapUserStatusToInternal,
};