/**
 * Domain Enums - Canonical Source
 * 
 * All enums are frozen to prevent runtime modification.
 * Import from this file across the application for consistency.
 */

// Order Status Enum - matches OpenAPI and database values
const OrderStatus = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
});

// Menu Category Enum - for merchants menu organization
const MenuCategory = Object.freeze({
  APPETIZERS: 'appetizers',
  MAINS: 'mains', 
  DESSERTS: 'desserts',
  BEVERAGES: 'beverages',
  SPECIALS: 'specials'
});

// Payment Status Enum - for payment processing states
const PaymentStatus = Object.freeze({
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  FAILED: 'failed'
});

// Socket Event Names - for real-time communication
const SocketEvents = Object.freeze({
  // Authentication
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  
  // Establishment Events
  ESTABLISHMENT_JOIN_ROOM: 'establishment:join-room',
  ESTABLISHMENT_LEAVE_ROOM: 'establishment:leave-room',
  
  // Order Events
  ORDER_NEW: 'order:new',
  ORDER_STATUS_CHANGED: 'order:status-changed',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_PAYMENT_CONFIRMED: 'order:payment-confirmed',
  
  // Driver Events
  DRIVER_LOCATION_UPDATED: 'driver:location-updated',
  DRIVER_ASSIGNED: 'driver:assigned',
  
  // System Events
  SYSTEM_MAINTENANCE: 'system:maintenance',
  CONNECTION_ERROR: 'connection:error'
});

// User Order Status Mapping - for user-facing display
const UserOrderStatusMapping = Object.freeze({
  [OrderStatus.PENDING]: 'Placed',
  [OrderStatus.CONFIRMED]: 'Processing', 
  [OrderStatus.PREPARING]: 'Processing',
  [OrderStatus.READY]: 'On Route',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Picked up',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled'
});

// Driver Order Status Enum - for driver app workflow
const DriverOrderStatus = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED', 
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
});

module.exports = {
  OrderStatus,
  MenuCategory,
  PaymentStatus,
  SocketEvents,
  UserOrderStatusMapping,
  DriverOrderStatus
};