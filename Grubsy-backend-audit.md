# Grubsy Backend Code Audit

## Project Overview
**Tech stack:** Node.js + Express + Prisma + MySQL + Socket.io + Stripe + Swagger + JWT authentication + Winston logging + Redis caching + Helmet security + CORS.

**Key libraries:** @prisma/client, express, socket.io, stripe, jsonwebtoken, bcryptjs, winston, ioredis, helmet, cors, swagger-jsdoc, multer, joi, express-rate-limit.

**Main entry:** src/server.js
**Database:** MySQL with Prisma ORM
**Authentication:** JWT tokens with role-based access (customer, merchant, driver)
**Real-time:** Socket.io for WebSocket connections
**Payments:** Stripe, PayPal, Klarna integration
**Documentation:** Swagger UI at /api-docs
**Health check:** /health endpoint with DB, Redis, WebSocket status

## API Endpoints Map
**Base URL:** /api

### Authentication Routes
- **POST /api/auth/login** - User login (email/password)
- **POST /api/auth/logout** - User logout
- **POST /api/auth/refresh** - Refresh JWT token
- **POST /api/users/register** - User registration
- **POST /api/users/login** - User login (duplicate)
- **POST /api/users/refresh** - Refresh user token (duplicate)
- **GET /api/users/profile** - Get user profile

### Driver Authentication Routes
- **POST /api/driver/auth/login** - Driver login (phone/OTP or email/password)
- **POST /api/driver/auth/refresh** - Refresh driver JWT token

### Merchant Routes
- **GET /api/merchants** - Get all merchants (with cuisine/bookable filters)
- **GET /api/merchants/:id** - Get merchant by ID
- **GET /api/merchants/:id/menu** - Get merchant menu
- **POST /api/merchants/auth/login** - Merchant login
- **POST /api/merchants/auth/logout** - Merchant logout
- **POST /api/merchants/auth/refresh** - Refresh merchant token
- **GET /api/merchants/profile** - Get merchant profile
- **PUT /api/merchants/profile** - Update merchant profile

### Order Routes
- **GET /api/orders** - Get orders (with filters: userEmail, partnerId, status)
- **POST /api/orders** - Create new order
- **GET /api/orders/:orderId** - Get order by ID
- **PATCH /api/orders/:orderId/status** - Update order status
- **POST /api/orders/:orderId/location** - Update driver location
- **POST /api/orders/:orderId/photos** - Upload order photos
- **PUT /api/orders/:orderId** - Update order
- **GET /api/orders/available** - Get available orders for drivers
- **POST /api/orders/:orderId/accept** - Accept order (restaurant)
- **POST /api/orders/:orderId/mark-ready** - Mark order ready for pickup
- **POST /api/orders/:orderId/hand-off** - Hand off order to driver
- **POST /api/orders/:orderId/delay** - Report order delay
- **POST /api/orders/:orderId/cancel** - Cancel order
- **POST /api/orders/:orderId/adjustments** - Create order adjustments

### Courier Routes
- **GET /api/couriers** - Get all couriers
- **GET /api/couriers/assigned** - Get assigned couriers
- **POST /api/couriers/:courierId/ratings** - Rate courier

### FAQ Routes
- **GET /api/faqs** - Get all FAQs
- **GET /api/faqs/search** - Search FAQs
- **GET /api/faqs/categories** - Get FAQ categories

### Driver Routes
- **GET /api/driver/earnings** - Get driver earnings
- **GET /api/driver/earnings/breakdown** - Get earnings breakdown

### Payment Routes
- **POST /api/payments/stripe/intent** - Create Stripe payment intent
- **POST /api/payments/paypal/order** - Create PayPal order
- **POST /api/payments/klarna/session** - Create Klarna session
- **POST /api/payments/refund** - Process refund

## Database Schema Map
**Provider:** MySQL
**ORM:** Prisma

### Core Tables
**Users** - Customer accounts
- id, Users_Full_Name, Users_Email (unique), Users_Password, Grubsy_User_ID (unique), Users_Phone_Number, Date_Of_Birth, Status, Acc_Created_At, Last_Login

**Merchants** - Restaurant/establishment accounts
- id, Grubsy_Partner_ID (unique), Merchants_Name, Description, Cuisine, Address, Area, PostCode, Hygiene_Rating, Opening_Times, Halal_Friendly, Photo, Booking_Available, Active, Owners_Name, Owners_Number, Merchant_Email (unique), Merchants_Password, coordinate_lat/lon

**Drivers** - Delivery driver accounts
- Driver_ID (unique), first_name, last_name, profile_photo_url, email, phone, phone_verified_at, email_verified_at, status (enum), date_joined, last_login, vehicle_type (enum), vehicle_reg, driving_licence, licence_expiry, Registered_address, address_line1, city, postcode, country, insurance_provider, insurance_policy_number, insurance_expiry, insurance_verified (enum), insurance_document_url, utr_number, ni_number, availability, current_location_lat/lng, location_updated_at, completed_orders, cancellations_count, emergencies, earnings_total, tips_total, current_balance, last_payout_at, rating, emergency_contact_name/phone, base_city, work_schedule, driver_pw, otp, push/sound/vibrate/max_distance notifications

**Orders** - Order management
- id, orderId (unique), orderedItems, userId, partnerId, orderDate, status (enum), basketSubtotal, serviceFee, deliveryFee, orderGrandTotal, tips, deliveryAddress, deliveryInstructions, userEmail, driverId, sku, createdAt, deliveredAt, paymentLink, paymentStatus, stripeSessionId, userPhoneNumber, coordinates, merchantAcceptedAt, driverPickupAt, merchantOrderImages, driverOrderImages, userCodeGiven, acceptedAt, atRestaurantAt, cancellationReason, cancelledAt, deliveryCode, deliveryPostcode, driverAllocatedAt, driverAllocatingAt, emergencyReason, emergencyReportedAt, emergencyType, originalDriverPenalty, outForDeliveryAt, pickedUpAt, pickupCode, readyAt, reallocatedAt, reallocatedDriverId

**Menu_Items** - Restaurant menu items
- id, Menu_Item_ID (unique), merchant_name, Grubsy_Partner_ID, Food_Category, Item, Regular/Medium/Large/Platter prices, Image, Description, Notes, SKU, Available

### Supporting Tables
**Basket_Table** - Shopping cart items
**Bookings** - Restaurant reservations
**Combo_Options/Combos** - Meal combo deals
**CRM_Back_Office** - CRM integration
**Delivery_Zones** - Delivery area configuration
**Documents** - File/document storage
**Order_Lines** - Order line items
**Order_Messages** - Order communication
**User_FAQ_s/Merchant_FAQ_s/Driver_FAQ_s** - FAQ content
**User_Session** - User session tracking

### Enums
**Orders_status:** PENDING, ACCEPTED, READY_FOR_DRIVER, ALLOCATING_DRIVER, ALLOCATED_DRIVER, AT_RESTAURANT, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

**Drivers_status:** pending, active, suspended, deactivated

**Drivers_vehicle_type:** bicycle, scooter, motorbike, car, van

**Drivers_insurance_verified:** unverified, pending, verified, rejected

## Middleware Map

### Authentication Middleware
**authRequired (src/middleware/authRequired.js)**
- Validates Bearer JWT token
- Supports customer, merchant, driver roles
- Adds user/merchant data to req object
- Throws 401 for missing token, 403 for invalid token

**merchantAuthRequired (src/middleware/authRequired.js)**
- Specific middleware for merchant-only routes
- Validates merchant JWT tokens
- Adds merchant data to req object

### Other Middleware
**auth.js (middleware/auth.js)** - Legacy auth middleware
**authContext.js (middleware/authContext.js)** - Auth context utilities
**idempotency.js (middleware/idempotency.js)** - Prevents duplicate requests
**socketSecurity.js (middleware/socketSecurity.js)** - WebSocket security
**webhookSecurity.js (middleware/webhookSecurity.js)** - Webhook validation

## Services Map

### Payment Service (services/paymentService.js)
**Methods:**
- createStripePaymentIntent() - Create Stripe payment intents
- confirmStripePayment() - Confirm Stripe payments
- getPayPalAccessToken() - Get PayPal OAuth token
- createPayPalOrder() - Create PayPal orders
- capturePayPalOrder() - Capture PayPal payments
- createKlarnaSession() - Create Klarna payment sessions
- createKlarnaOrder() - Create Klarna orders
- createApplePaySession() - Apple Pay via Stripe
- createGooglePaySession() - Google Pay via Stripe
- processRefund() - Refund any payment method
- validatePayment() - Fraud detection and risk scoring
- calculateRiskScore() - Calculate payment risk score

**Features:** Multi-provider support (Stripe/PayPal/Klarna), fraud detection, risk scoring, refunds

### Commission Service (services/commissionService.js)
**Purpose:** Calculate commissions and fees for orders

### Financial Reporting Service (services/financialReportingService.js)
**Purpose:** Generate financial reports and analytics

### Bitrix24 Service (services/bitrix24Service.js)
**Purpose:** CRM integration with Bitrix24

### Mock Services
**mockPaymentService.js** - Mock payment processing for testing
**mockSheetBestService.js** - Mock Google Sheets integration

## Missing Items Summary
- MISSING_IMPLEMENTATION: Photo upload endpoints are disabled (order_photos/driver_activities tables missing)
- MISSING_IMPLEMENTATION: Driver activity logging endpoints are disabled (tables missing)
- MISSING_IMPLEMENTATION: Order activity logging not implemented
- MISSING_IMPLEMENTATION: Real-time notifications via Socket.io not fully implemented
- MISSING_IMPLEMENTATION: Password hashing for driver authentication (TODO in driverAuth.js)
- MISSING_IMPLEMENTATION: Route optimization service not implemented
- MISSING_IMPLEMENTATION: Voice guidance service not implemented
- MISSING_IMPLEMENTATION: Emergency penalty calculation has TODO
- MISSING_IMPLEMENTATION: Earnings calculations use mock data
- MISSING_IMPLEMENTATION: Many service files have incomplete implementations
- MISSING_FILE: Real Google Sheets integration (currently using Prisma/MySQL)
- MISSING_FILE: Redis caching not fully utilized
- MISSING_FILE: Webhook handlers for payment providers
- MISSING_FILE: Email/SMS notification services
- MISSING_FILE: Background job processing (order status updates, notifications)

## Build/Env Requirements
**Required env vars:**
- DATABASE_URL - MySQL connection string
- JWT_SECRET - JWT signing secret
- REDIS_URL - Redis connection URL
- STRIPE_SECRET_KEY - Stripe API key
- PAYPAL_CLIENT_ID/SECRET - PayPal credentials
- KLARNA_USERNAME/PASSWORD - Klarna credentials
- FRONTEND_URL - Frontend application URL
- BACKEND_URL - Backend application URL
- NODE_ENV - Environment (development/production/test)
- PORT - Server port (default 3002)

**Database:** MySQL 8.0+
**Node.js:** 18+ (ES modules)
**Redis:** For caching and session storage
**External APIs:** Stripe, PayPal, Klarna, Bitrix24

---

## Controllers

### Orders Controller (controllers/orders.js)
**Purpose:** Handle all order-related operations
**Key Methods:**
- getAll() - Fetch orders with filtering
- create() - Create new orders
- getById() - Get single order
- updateStatus() - Update order status with validation
- updateLocation() - Update driver location (stub)
- uploadPhotos() - Handle photo uploads
- updateOrder() - Update order details
- acceptOrder() - Restaurant accepts order
- markReady() - Mark order ready for pickup
- handOff() - Hand off to driver
- delayOrder() - Report delays
- cancelOrder() - Cancel orders
- createAdjustment() - Create order adjustments
- getAvailableOrders() - Get orders for drivers

**Features:** Status validation, data transformation, Prisma integration

### Users Controller (controllers/users.js)
**Purpose:** User authentication and profile management
**Key Methods:**
- registerUser() - Register new users
- loginUser() - Authenticate users
- refreshUserToken() - Refresh JWT tokens
- getUserProfile() - Get user profile data

### Merchants Controller (controllers/merchants.js)
**Purpose:** Merchant/restaurant management
**Key Methods:**
- getAll() - List merchants with filters
- getById() - Get merchant details
- getMenu() - Get restaurant menu
- updateProfile() - Update merchant profile

### Couriers Controller (controllers/couriers.js)
**Purpose:** Courier/driver management for restaurants
**Key Methods:**
- getAll() - List all couriers
- getAssigned() - Get couriers assigned to restaurant
- rateCourier() - Rate courier performance

### Payments Controller (controllers/payments.js)
**Purpose:** Payment processing and webhooks
**Key Methods:**
- createIntent() - Create payment intents
- confirmPayment() - Confirm payments
- handleWebhook() - Handle payment webhooks
- processRefund() - Process refunds

### Printer Controller (controllers/printer.js)
**Purpose:** Receipt printing for orders

---

## Routes

### API Router (src/api.js)
**Purpose:** Main API router combining all endpoints
**Routes:**
- /merchants - Merchant endpoints
- /orders - Order management
- /auth - User authentication
- /users - User management (duplicate)
- /payments - Payment processing
- /merchants - Merchant operations (duplicate)
- /couriers - Courier management
- /driver/auth - Driver authentication
- /driver - Driver operations

### Auth Router (src/auth.js)
**Purpose:** User authentication routes
**Routes:**
- POST /login - User login
- POST /logout - User logout
- POST /refresh - Token refresh

### Driver Auth Router (src/driverAuth.js)
**Purpose:** Driver authentication with phone/OTP support
**Routes:**
- POST /login - Driver login (phone/OTP or email/password)
- POST /refresh - Refresh driver token

### Orders Router (routes/orders.js)
**Purpose:** Order management routes with full CRUD
**Routes:** 15+ order-related endpoints

### Users Router (routes/users.js)
**Purpose:** User management with auth
**Routes:** Registration, login, profile management

### Merchants Router (routes/merchants.js)
**Purpose:** Merchant operations
**Routes:** Profile management, menu access

### Couriers Router (routes/couriers.js)
**Purpose:** Courier management
**Routes:** Listing, assignment, rating

### Payments Router (routes/payments.js)
**Purpose:** Payment processing
**Routes:** Intent creation, confirmation, refunds

---

## Services

### Payment Service (services/paymentService.js)
**Purpose:** Multi-provider payment processing
**Providers:** Stripe, PayPal, Klarna, Apple Pay, Google Pay
**Features:** Payment intents, confirmations, refunds, fraud detection, risk scoring

### Commission Service (services/commissionService.js)
**Purpose:** Calculate platform commissions and fees

### Financial Reporting Service (services/financialReportingService.js)
**Purpose:** Generate financial reports and analytics

### Bitrix24 Service (services/bitrix24Service.js)
**Purpose:** CRM integration and data synchronization

### Sync Service (integrations/syncService.js)
**Purpose:** Data synchronization between systems

### Upload Service (integrations/upload.js)
**Purpose:** File upload handling with Multer

---

## Middleware

### Auth Required (src/middleware/authRequired.js)
**Purpose:** JWT authentication middleware
**Features:** Role-based access (customer, merchant, driver), token validation, user context

### Rate Limiting (middleware/rateLimiting.js)
**Purpose:** API rate limiting to prevent abuse

### Validation (middleware/validate.js)
**Purpose:** Request validation using Joi schemas

### CORS (middleware/cors.js)
**Purpose:** Cross-origin resource sharing configuration

### Security (middleware/security.js)
**Purpose:** Security headers and protections

---

## Database Models

### Prisma Schema (prisma/schema.prisma)
**Models:** 16 database models
**Enums:** Order statuses, driver statuses, vehicle types, insurance verification
**Features:** MySQL provider, field mappings, indexes, relationships

### Key Relationships
- Orders belong to Users and Merchants
- Drivers are independent entities
- Menu_Items belong to Merchants
- Bookings belong to Merchants and Users

---

## Configuration

### Constants (src/config/constants.js)
**Purpose:** Application constants and configuration values

### Enums (src/config/enums.js)
**Purpose:** Type-safe enums for the application

### Logger (src/utils/logger.js)
**Purpose:** Winston-based logging configuration

### Validation Utils (src/utils/validate.js)
**Purpose:** Response formatting and validation helpers

---

## Scripts

### Database Scripts
- add-driver-password-column.sql - Add password column to drivers
- add-merchant-password-column.js - Merchant password migration
- recreate-drivers-table.sql - Recreate drivers table
- insert-fake-driver.sql - Test data insertion

### Import Scripts
- import-from-csv.js - CSV data import
- import-from-sheets.js - Google Sheets import
- comprehensive-import.js - Full data import

### Utility Scripts
- check-database.js - Database health check
- test-order-acceptance.js - Order testing
- update-menu-availability.js - Menu management

---

## Tests

### Test Structure (tests/)
**Coverage:** Unit and integration tests
**Framework:** Jest
**Mock Services:** Payment and SheetBest mocks

### Test Files
- Unit tests for services
- Integration tests for API endpoints
- Database connection tests

---

## Integrations

### Bitrix24 (integrations/bitrix24.js)
**Purpose:** CRM integration for customer management

### Google Services (integrations/google.js)
**Purpose:** Google APIs integration (Maps, Sheets)

### Sync Service (integrations/syncService.js)
**Purpose:** Data synchronization between platforms

### Upload Service (integrations/upload.js)
**Purpose:** File upload handling and storage

---

## Monitoring

### Prometheus (monitoring/prometheus.yml)
**Purpose:** Metrics collection and monitoring

### Loki (monitoring/loki-config.yml)
**Purpose:** Log aggregation

### Promtail (monitoring/promtail-config.yml)
**Purpose:** Log shipping to Loki

### Alert Rules (monitoring/alert_rules.yml)
**Purpose:** Monitoring alerts and thresholds

---

## Nginx Configuration

### nginx.conf (nginx/nginx.conf)
**Purpose:** Reverse proxy and load balancing configuration
**Features:** SSL termination, rate limiting, static file serving