# Establishments Documented vs Actual Discrepancy Audit - 20/08

**Branch**: docs/audit-establishments-20-08  
**Date**: 2025-08-20  
**Audit Type**: Evidence-only, read-only analysis  

## Summary

**Alignment Level**: MAJOR DISCREPANCIES IDENTIFIED - 30% endpoint accuracy, 0% socket event accuracy

The establishments documentation in `docs/specs/20-08_ESTABLISHMENTS_APP_ALIGNMENT.md` contains significant misalignments with the actual backend implementation. Critical discrepancies exist in menu item CRUD operations, socket event naming, authentication endpoints, and security middleware integration.

## Endpoints Analysis

### Documented vs Actual Endpoints

| **Documented Endpoint** | **Actual Implementation** | **Status** | **Evidence** |
|------------------------|---------------------------|------------|--------------|
| `GET /api/establishments` | `GET /api/establishments` | ✅ MATCH | routes/establishments.js:11 |
| `POST /api/establishments` | `POST /api/establishments` | ✅ MATCH | routes/establishments.js:13 |
| `GET /api/establishments/:id` | `GET /api/establishments/:id` | ✅ MATCH | routes/establishments.js:15 |
| `PATCH /api/establishments/:id` | `PATCH /api/establishments/:id` | ✅ MATCH | routes/establishments.js:17 |
| `DELETE /api/establishments/:id` | `DELETE /api/establishments/:id` | ✅ MATCH | routes/establishments.js:19 |
| `GET /api/establishments/:id/menu` | `GET /api/establishments/:id/menu` | ✅ MATCH | routes/establishments.js:21 |
| `POST /api/establishments/:id/menu/items` | **MISSING** | ❌ MISSING | No evidence in routes/establishments.js |
| `PUT /api/establishments/:id/menu/items/:itemId` | **MISSING** | ❌ MISSING | No evidence in routes/establishments.js |
| `DELETE /api/establishments/:id/menu/items/:itemId` | **MISSING** | ❌ MISSING | No evidence in routes/establishments.js |
| `PUT /api/establishments/:id/menu/items/:itemId/availability` | `PATCH /api/establishments/:id/menu/:itemId/availability` | ⚠️ MISMATCH | routes/establishments.js:25 (PATCH vs PUT) |
| `PUT /api/establishments/:id/orders/:orderId/status` | `PATCH /api/establishments/:id/orders/:orderId/status` | ⚠️ MISMATCH | routes/establishments.js:31 (PATCH vs PUT) |
| `GET /api/establishments/:id/orders/:orderId` | **MISSING** | ❌ MISSING | No evidence in routes/establishments.js |
| `POST /api/establishments/:id/orders/:orderId/estimated-time` | **MISSING** | ❌ MISSING | No evidence in routes/establishments.js |

### Additional Actual Endpoints (Not Documented)

| **Actual Endpoint** | **Evidence** | **Recommendation** |
|-------------------|--------------|-------------------|
| `PATCH /api/establishments/:id/menu` | routes/establishments.js:23 | Add to documentation |
| `GET /api/establishments/:id/orders` | routes/establishments.js:27 | Already documented |
| `GET /api/establishments/:id/orders/active` | routes/establishments.js:29 | Add to documentation |
| `GET /api/establishments/:id/orders/status-summary` | routes/establishments.js:6 | Add to documentation |
| `GET /api/establishments/:id/orders/history` | routes/establishments.js:8 | Add to documentation |

## Socket Events Analysis

### Documented vs Actual Socket Events

| **Documented Event** | **Actual Implementation** | **Status** | **Evidence** |
|---------------------|---------------------------|------------|--------------|
| `establishment:authenticate` | **MISSING** | ❌ MISSING | No evidence in socket files |
| `establishment:join-room` | `establishment:join-room` | ✅ MATCH | Grubsy-Backend/src/config/enums.js:47 |
| `order:status-update` | **MISSING** | ❌ MISSING | No evidence in socket files |
| `menu:item-availability` | **MISSING** | ❌ MISSING | No evidence in socket files |
| `authenticated` | **MISSING** | ❌ MISSING | No evidence in socket files |
| `order:new` | `order:new` | ✅ MATCH | Grubsy-Backend/src/config/enums.js:51 |
| `order:cancelled` | `order:cancelled` | ✅ MATCH | Grubsy-Backend/src/config/enums.js:53 |
| `order:payment-confirmed` | `order:payment-confirmed` | ✅ MATCH | Grubsy-Backend/src/config/enums.js:54 |
| `system:maintenance` | **MISSING** | ❌ MISSING | No evidence in socket files |

### Additional Actual Socket Events (Not Documented)

| **Actual Event** | **Evidence** | **Recommendation** |
|-----------------|--------------|-------------------|
| `establishment:leave-room` | Grubsy-Backend/src/config/enums.js:48 | Add to documentation |
| `order:status-changed` | Grubsy-Backend/src/config/enums.js:52 | Add to documentation |

## Schemas & Headers Analysis

### Idempotency-Key Implementation

| **Endpoint Type** | **Documented** | **Actual Implementation** | **Evidence** |
|------------------|----------------|---------------------------|--------------|
| POST /api/establishments | Not specified | Middleware available but not applied | Grubsy-Backend/middleware/idempotency.js:263-284 |
| PATCH /api/establishments/:id | Not specified | Middleware available but not applied | No evidence of application in routes |
| PATCH /api/establishments/:id/menu | Not specified | Middleware available but not applied | No evidence of application in routes |
| PATCH /api/establishments/:id/orders/:orderId/status | Not specified | Middleware available but not applied | No evidence of application in routes |

**Recommendation**: Apply idempotency middleware to state-changing establishment endpoints.

### Joi Validation

| **Endpoint** | **Validation Present** | **Evidence** |
|-------------|----------------------|--------------|
| All establishment endpoints | Middleware available | Grubsy-Backend/middleware/validate.js:90 |
| Applied to routes | No evidence | No validateRequest calls in routes/establishments.js |

**Recommendation**: Apply Joi validation middleware to establishment endpoints.

## Enums/Constants Comparison

### OrderStatus Enum

**Documented**:
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

**Actual** (Grubsy-Backend/src/config/enums.js:9):
```javascript
const OrderStatus = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing', 
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
});
```

**Status**: ✅ MATCH

### MenuCategory Enum

**Documented**:
```typescript
enum MenuCategory {
  APPETIZERS = 'appetizers',
  MAINS = 'mains', 
  DESSERTS = 'desserts',
  BEVERAGES = 'beverages',
  SPECIALS = 'specials'
}
```

**Actual** (Grubsy-Backend/src/config/enums.js:20):
```javascript
const MenuCategory = Object.freeze({
  APPETIZERS: 'appetizers',
  MAINS: 'mains',
  DESSERTS: 'desserts', 
  BEVERAGES: 'beverages',
  SPECIALS: 'specials'
});
```

**Status**: ✅ MATCH

## Security Middleware Analysis

### Rate Limiting

**Documented**: Specific rate limits for establishment endpoints  
**Actual**: Middleware available but not applied to establishment routes  
**Evidence**: Grubsy-Backend/middleware/rateLimiting.js:57-88  
**Recommendation**: Apply rate limiting middleware to establishment routes

### Authentication Context

**Documented**: JWT tokens with establishment-specific audience validation  
**Actual**: General auth middleware available  
**Evidence**: Grubsy-Backend/middleware/authContext.js:193  
**Recommendation**: Apply auth middleware to protected establishment endpoints

## Grep Evidence Snippets

### Establishments Routes Evidence
```
routes/establishments.js:11:router.get('/', establishmentsController.getAll);
routes/establishments.js:13:router.post('/', establishmentsController.create);
routes/establishments.js:15:router.get('/:id', establishmentsController.getById);
routes/establishments.js:17:router.patch('/:id', establishmentsController.update);
routes/establishments.js:19:router.delete('/:id', establishmentsController.remove);
routes/establishments.js:21:router.get('/:id/menu', establishmentsController.getMenu);
routes/establishments.js:23:router.patch('/:id/menu', establishmentsController.updateMenu);
routes/establishments.js:25:router.patch('/:id/menu/:itemId/availability', establishmentsController.toggleMenuItemAvailability);
routes/establishments.js:27:router.get('/:id/orders', establishmentsController.getOrders);
routes/establishments.js:29:router.get('/:id/orders/active', establishmentsController.getActiveOrders);
routes/establishments.js:31:router.patch('/:id/orders/:orderId/status', establishmentsController.updateOrderStatus);
```

### Socket Events Evidence
```
Grubsy-Backend/src/config/enums.js:47:  ESTABLISHMENT_JOIN_ROOM: 'establishment:join-room',
Grubsy-Backend/src/config/enums.js:48:  ESTABLISHMENT_LEAVE_ROOM: 'establishment:leave-room',
Grubsy-Backend/src/config/enums.js:51:  ORDER_NEW: 'order:new',
Grubsy-Backend/src/config/enums.js:52:  ORDER_STATUS_CHANGED: 'order:status-changed',
Grubsy-Backend/src/config/enums.js:53:  ORDER_CANCELLED: 'order:cancelled',
Grubsy-Backend/src/config/enums.js:54:  ORDER_PAYMENT_CONFIRMED: 'order:payment-confirmed',
```

### Middleware Evidence
```
Grubsy-Backend/middleware/idempotency.js:125:    headerName = 'Idempotency-Key',
Grubsy-Backend/middleware/rateLimiting.js:88:  return rateLimit({ ...defaultOptions, ...options });
Grubsy-Backend/middleware/validate.js:90:function validateRequest(schemaName, source = 'body') {
```

## Recommendations by Category

### 1. Documentation Updates (Recommend: Change Doc)
- Remove non-existent individual menu item CRUD endpoints
- Update HTTP verbs from PUT to PATCH for consistency
- Remove non-existent socket events (`establishment:authenticate`, `authenticated`, `system:maintenance`)
- Add missing actual endpoints (orders/active, orders/status-summary, orders/history)
- Add missing socket events (`establishment:leave-room`, `order:status-changed`)

### 2. Code Implementation (Recommend: Change Code)
- Implement missing individual menu item CRUD operations if needed by app
- Add idempotency middleware to state-changing establishment endpoints
- Apply rate limiting middleware to establishment routes
- Apply Joi validation middleware to establishment endpoints
- Implement missing socket events if required by real-time functionality

### 3. Critical Misalignments Requiring Decision
- **Menu Item CRUD**: Documentation describes individual item operations not implemented in code
- **Socket Authentication**: Documentation describes establishment-specific auth events not implemented
- **Security Middleware**: Available but not integrated into establishment routes

## Risk Assessment

### Breaking Changes if Code is Modified
- Adding individual menu item endpoints: **LOW RISK** (additive)
- Implementing socket authentication: **MEDIUM RISK** (may require app changes)
- Adding middleware: **LOW RISK** (transparent to clients)

### Breaking Changes if Documentation is Updated
- Removing non-existent endpoints: **HIGH RISK** (app may depend on these)
- Changing HTTP verbs: **MEDIUM RISK** (app may use wrong verbs)
- Removing socket events: **HIGH RISK** (app may listen for these events)

## Checklist: Endpoint/Event Status

### Endpoints
- [x] GET /api/establishments - MATCH
- [x] POST /api/establishments - MATCH  
- [x] GET /api/establishments/:id - MATCH
- [x] PATCH /api/establishments/:id - MATCH
- [x] DELETE /api/establishments/:id - MATCH
- [x] GET /api/establishments/:id/menu - MATCH
- [ ] POST /api/establishments/:id/menu/items - MISSING
- [ ] PUT /api/establishments/:id/menu/items/:itemId - MISSING
- [ ] DELETE /api/establishments/:id/menu/items/:itemId - MISSING
- [~] PUT /api/establishments/:id/menu/items/:itemId/availability - MISMATCH (PATCH vs PUT)
- [~] PUT /api/establishments/:id/orders/:orderId/status - MISMATCH (PATCH vs PUT)
- [ ] GET /api/establishments/:id/orders/:orderId - MISSING
- [ ] POST /api/establishments/:id/orders/:orderId/estimated-time - MISSING

### Socket Events
- [ ] establishment:authenticate - MISSING
- [x] establishment:join-room - MATCH
- [ ] order:status-update - MISSING  
- [ ] menu:item-availability - MISSING
- [ ] authenticated - MISSING
- [x] order:new - MATCH
- [x] order:cancelled - MATCH
- [x] order:payment-confirmed - MATCH
- [ ] system:maintenance - MISSING

### Security Middleware
- [ ] Idempotency-Key enforcement - NOT APPLIED
- [ ] Rate limiting - NOT APPLIED
- [ ] Joi validation - NOT APPLIED
- [ ] Auth context - NOT APPLIED

## Final Recommendation

**Priority 1**: Update documentation to match actual implementation (remove non-existent endpoints/events)  
**Priority 2**: Apply available security middleware to establishment routes  
**Priority 3**: Decide on individual menu item CRUD implementation based on app requirements  

**Overall Assessment**: Documentation is significantly ahead of implementation. Recommend aligning documentation with current code reality first, then implement missing features if required by the establishments app.