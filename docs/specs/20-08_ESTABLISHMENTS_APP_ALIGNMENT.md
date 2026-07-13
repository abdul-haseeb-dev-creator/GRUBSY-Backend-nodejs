# Establishments App Alignment Document - 20/08/2025

**Last verified**: 2025-08-20 | Branch: docs/recover-canonical-sources | Commit: d3bd6e9a

## Overview
This document outlines the alignment between the Grubsy Establishments App and the backend systems, ensuring seamless integration for restaurant management, order processing, menu updates, and real-time operational monitoring.

## Backend Integration Points

### 1. Establishment Authentication ✅
**Backend Endpoints:**
- `POST /api/establishments/register` - Establishment registration
- `POST /api/establishments/login` - Establishment authentication  
- `POST /api/establishments/refresh` - Token refresh
- `GET /api/establishments/profile` - Get establishment profile

**App Integration:**
- JWT token storage in secure storage
- Automatic token refresh handling
- Establishment profile management
- Role-based access control (owner, manager, staff)

**Required Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Idempotency-Key: <uuid> (for state-changing operations)
```

### 2. Menu Management ✅
**Backend Endpoints:**
- `GET /api/establishments/:id/menu` - Get establishment menu
- `POST /api/establishments/:id/menu/items` - Add menu item
- `PUT /api/establishments/:id/menu/items/:itemId` - Update menu item
- `DELETE /api/establishments/:id/menu/items/:itemId` - Remove menu item
- `PUT /api/establishments/:id/menu/items/:itemId/availability` - Toggle item availability

**App Integration:**
- Real-time menu synchronization
- Bulk menu operations
- Image upload for menu items
- Category and pricing management
- Availability toggle controls

**Request/Response Schemas:**
```typescript
// Menu Item Schema
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  availability: boolean;
  imageUrl?: string;
  allergens: string[];
  preparationTime: number; // minutes
}

enum MenuCategory {
  APPETIZERS = 'appetizers',
  MAINS = 'mains',
  DESSERTS = 'desserts',
  BEVERAGES = 'beverages',
  SPECIALS = 'specials'
}
```

### 3. Order Management ✅
**Backend Endpoints:**
- `GET /api/establishments/:id/orders` - Get establishment orders
- `PUT /api/establishments/:id/orders/:orderId/status` - Update order status
- `GET /api/establishments/:id/orders/:orderId` - Get specific order details
- `POST /api/establishments/:id/orders/:orderId/estimated-time` - Update preparation time

**App Integration:**
- Real-time order notifications
- Order status management workflow
- Preparation time estimation
- Order history and analytics
- Print integration for receipts

**Order Status Enum:**
```typescript
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}
```

### 4. Real-time Communication ✅
**Socket.IO Events:**

**Establishment → Server:**
- `establishment:authenticate` - Establishment socket authentication
- `establishment:join-room` - Join establishment-specific room
- `order:status-update` - Update order status
- `menu:item-availability` - Toggle menu item availability

**Server → Establishment:**
- `authenticated` - Authentication confirmation
- `order:new` - New order received
- `order:cancelled` - Order cancellation notification
- `order:payment-confirmed` - Payment confirmation
- `system:maintenance` - System maintenance notifications

**Rate Limiting:**
- Socket connections: 5 per establishment per minute
- Status updates: 100 per establishment per minute
- Menu updates: 50 per establishment per minute

### 5. Analytics and Reporting ✅
**Backend Endpoints:**
- `GET /api/establishments/:id/analytics/sales` - Sales analytics
- `GET /api/establishments/:id/analytics/orders` - Order analytics
- `GET /api/establishments/:id/analytics/popular-items` - Popular menu items
- `GET /api/establishments/:id/reports/daily` - Daily reports
- `GET /api/establishments/:id/reports/weekly` - Weekly reports

**App Integration:**
- Revenue tracking and visualization
- Order volume analytics
- Peak hours identification
- Menu item performance metrics
- Customer satisfaction tracking

## Security Considerations

### 1. Authentication Security ✅
- JWT tokens with establishment-specific audience validation
- Role-based access control (RBAC) for different staff levels
- Secure token storage using platform-specific secure storage
- Automatic token refresh before expiration
- Multi-factor authentication for sensitive operations

### 2. Data Privacy ✅
- Customer data access limited to order-related information only
- PII redaction in logs and analytics
- GDPR compliance for data handling
- Secure transmission of all sensitive data
- Regular security audits and penetration testing

### 3. Rate Limiting ✅
**API Rate Limits:**
- Authentication endpoints: 10 requests per minute per IP
- Menu operations: 100 requests per minute per establishment
- Order operations: 200 requests per minute per establishment
- Analytics endpoints: 50 requests per minute per establishment

**Error Responses:**
```typescript
// 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0,
  "resetTime": "2025-08-20T20:00:00Z"
}
```

## App Architecture Alignment

### 1. State Management
**Redux Store Structure:**
```typescript
interface EstablishmentState {
  auth: {
    establishment: EstablishmentProfile;
    token: string;
    isAuthenticated: boolean;
    permissions: Permission[];
  };
  orders: {
    active: Order[];
    history: Order[];
    filters: OrderFilters;
    realTimeUpdates: boolean;
  };
  menu: {
    items: MenuItem[];
    categories: MenuCategory[];
    lastUpdated: string;
    pendingChanges: MenuChange[];
  };
  analytics: {
    salesData: SalesMetrics;
    orderMetrics: OrderMetrics;
    popularItems: PopularItem[];
    dateRange: DateRange;
  };
  socket: {
    connected: boolean;
    reconnecting: boolean;
    lastHeartbeat: string;
  };
}
```

### 2. Service Layer Architecture
**Service Files:**
- `services/authService.ts` - Authentication and authorization
- `services/orderService.ts` - Order management operations
- `services/menuService.ts` - Menu CRUD operations
- `services/analyticsService.ts` - Analytics and reporting
- `services/socketService.ts` - Real-time communication
- `services/printService.ts` - Receipt and order printing

### 3. Navigation Structure
**React Navigation Hierarchy:**
- **Auth Stack**: Login, Registration, Password Reset
- **Main Stack**: Dashboard, Orders, Menu, Analytics, Settings
- **Order Stack**: Order List, Order Details, Status Update
- **Menu Stack**: Menu Overview, Item Details, Category Management

## User Experience Flow

### 1. Authentication Flow ✅
1. **Login/Registration** → Backend validation with establishment verification
2. **JWT Token Storage** → Secure storage with automatic refresh
3. **Profile Setup** → Establishment details and preferences
4. **Permission Assignment** → Role-based access control setup

### 2. Order Management Flow ✅
1. **Real-time Order Notification** → Socket.IO push notification
2. **Order Review** → Order details with customer information
3. **Status Update** → Workflow-based status progression
4. **Preparation Tracking** → Time estimation and updates
5. **Completion Confirmation** → Final status update and notification

### 3. Menu Management Flow ✅
1. **Menu Overview** → Current menu with availability status
2. **Item Management** → Add, edit, delete menu items
3. **Availability Toggle** → Real-time availability updates
4. **Category Organization** → Menu structure management
5. **Price Updates** → Dynamic pricing with validation

## Performance Optimizations

### 1. App Performance ✅
- Lazy loading of menu images and analytics data
- Efficient list rendering with virtualization
- Background sync for offline capability
- Memory management for large order datasets
- Optimistic UI updates for better responsiveness

### 2. Network Efficiency ✅
- API response caching with TTL
- Delta sync for menu updates
- Request deduplication and batching
- Offline queue for critical operations
- Compression for large payloads

### 3. Real-time Performance ✅
- Socket.IO connection pooling
- Event throttling for high-frequency updates
- Selective room subscriptions
- Heartbeat monitoring and reconnection
- Message queuing for offline periods

## Testing Strategy

### 1. Integration Testing ✅
- API endpoint testing with establishment context
- Socket.IO event handling validation
- Authentication flow testing
- Order workflow end-to-end testing
- Menu synchronization testing

### 2. Performance Testing ✅
- High-volume order processing scenarios
- Concurrent user load testing
- Real-time event handling under load
- Memory usage optimization validation
- Network resilience testing

### 3. Security Testing ✅
- Authentication bypass attempts
- Authorization boundary testing
- Rate limiting validation
- Data injection prevention
- Session management security

## Deployment Alignment

### 1. Environment Configuration ✅
- Development: Local backend with test data
- Staging: Staging backend with production-like data
- Production: Production backend with SSL/TLS

### 2. App Store Deployment ✅
- iOS App Store business app guidelines compliance
- Google Play Store business requirements
- Privacy policy for establishment data handling
- Terms of service for commercial use

### 3. Backend Compatibility ✅
- API versioning support with backward compatibility
- Feature flag integration for gradual rollouts
- Database migration handling
- Service degradation graceful handling

## Monitoring & Analytics

### 1. Performance Monitoring ✅
- Crash reporting with Sentry integration
- Performance metrics tracking
- API response time monitoring
- Real-time connection health monitoring

### 2. Business Analytics ✅
- Order processing efficiency metrics
- Menu item performance tracking
- Revenue analytics and reporting
- Customer satisfaction correlation

### 3. Error Handling ✅
- Comprehensive error logging with context
- User-friendly error messages
- Automatic error reporting
- Graceful degradation strategies

## API Error Handling

### 1. Validation Errors (400)
```typescript
{
  "error": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number",
      "code": "INVALID_PRICE"
    }
  ]
}
```

### 2. Authentication Errors (401)
```typescript
{
  "error": "Authentication required",
  "message": "Invalid or expired token",
  "code": "AUTH_REQUIRED"
}
```

### 3. Authorization Errors (403)
```typescript
{
  "error": "Insufficient permissions",
  "message": "Manager role required for this operation",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### 4. Rate Limiting (429)
```typescript
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0
}
```

## Cross-References

- **User App Alignment**: [`20-08_USER_APP_ALIGNMENT.md`](../../../20-08_USER_APP_ALIGNMENT.md)
- **Driver App Alignment**: [`20-08_DRIVER_APP_ALIGNMENT.md`](../../../20-08_DRIVER_APP_ALIGNMENT.md)
- **API Documentation**: [`openapi.yaml`](../api/openapi.yaml)
- **Security Report**: [`GRUBSY_PLATFORM_STABILIZATION_REPORT.md`](../reports/GRUBSY_PLATFORM_STABILIZATION_REPORT.md)

---

**Document Status**: ✅ **CURRENT**  
**Last Updated**: 2025-08-20  
**Backend Compatibility**: Phase 6 + Security Hardening Phase A Complete  
**App Version Alignment**: v1.0.0+  
**Integration Status**: Fully Aligned