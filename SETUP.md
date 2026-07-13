# Grubsy Platform Setup Guide

## 🚀 Pre-Deployment Configuration Checklist

This guide contains all the APIs, services, and configurations you need to set up before deploying to AWS.

## 📋 Required Services & API Keys

### 1. **Stripe Payment Processing**
**Required for**: Payment processing, subscriptions, refunds

**Setup Steps:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create account or sign in
3. Get your API keys from Developers → API Keys
4. Enable test mode initially

**Keys Needed:**
```bash
STRIPE_SECRET_KEY=sk_test_...    # Test mode
STRIPE_WEBHOOK_SECRET=whsec_...  # For webhooks
```

**Production Keys** (when ready):
```bash
STRIPE_SECRET_KEY=sk_live_...    # Live mode
STRIPE_WEBHOOK_SECRET=whsec_...  # Live webhooks
```

### 2. **Google Maps Platform**
**Required for**: Location services, maps, geocoding

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable APIs: Maps JavaScript API, Geocoding API, Places API
4. Create API key with restrictions
5. Set up billing (required for production)

**APIs to Enable:**
- Maps JavaScript API
- Geocoding API
- Places API
- Directions API (if using routing)

**Keys Needed:**
```bash
GOOGLE_MAPS_API_KEY=AIzaSy...
```

### 3. **AWS Services**
**Required for**: Hosting, database, file storage

**Services Needed:**
- **AWS Account**: [aws.amazon.com](https://aws.amazon.com)
- **RDS MySQL**: Database hosting
- **ElastiCache Redis**: Session storage & caching
- **S3**: File uploads (images, documents)
- **EC2/ECS**: Application hosting
- **Certificate Manager**: SSL certificates
- **Route 53**: DNS management (optional)

### 4. **Firebase (Optional but Recommended)**
**Required for**: Push notifications, analytics

**Setup Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project
3. Add iOS/Android apps
4. Download config files:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)

## 🔧 Environment Configuration

### Backend Environment Variables (.env)

Create `Grubsy-Backend/.env` with:

```bash
# Environment
NODE_ENV=production
PORT=3000

# Database (AWS RDS)
DATABASE_URL=mysql://username:password@your-rds-endpoint.rds.amazonaws.com:3306/grubsy

# Redis (AWS ElastiCache)
REDIS_URL=redis://your-elasticache-endpoint.cache.amazonaws.com:6379

# JWT Security
JWT_SECRET=your-secure-random-jwt-secret-32-chars-minimum
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS (Your frontend domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Base URL (Your AWS domain)
BASE_URL=https://api.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1
```

### Mobile App Environment Variables

#### Driver App (.env)
```bash
EXPO_PUBLIC_WS_URL=wss://api.yourdomain.com
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Firebase (for notifications)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Analytics (optional)
AMPLITUDE_API_KEY=your_amplitude_key
```

#### Store App (.env)
```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_WS_URL=wss://api.yourdomain.com

# Firebase (optional)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# ... other Firebase config
```

#### User App (.env)
```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_WS_URL=wss://api.yourdomain.com

# Firebase (optional)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# ... other Firebase config
```

## 🗄️ Database Setup

### MySQL Database Requirements

**Create database with these tables:**
- `users` - Customer accounts
- `drivers` - Driver profiles
- `merchants` - Restaurant/store owners
- `restaurants` - Restaurant information
- `orders` - Order records
- `order_items` - Order line items
- `payments` - Payment records

**Database User:**
- Username: `grubsy_user`
- Password: Strong, unique password
- Permissions: SELECT, INSERT, UPDATE, DELETE on grubsy database

## 🔐 Security Checklist

### API Keys & Secrets
- [ ] Stripe secret key obtained
- [ ] Google Maps API key with restrictions
- [ ] JWT secret generated (32+ characters)
- [ ] Database password created
- [ ] AWS access keys created (if using S3)

### SSL & HTTPS
- [ ] Domain purchased
- [ ] SSL certificate obtained (AWS Certificate Manager)
- [ ] HTTPS redirect configured

### Network Security
- [ ] VPC created with public/private subnets
- [ ] Security groups configured
- [ ] Database only accessible from application
- [ ] Redis only accessible from application

## 📱 Mobile App Configuration

### iOS Setup
1. **Apple Developer Account**: [developer.apple.com](https://developer.apple.com)
2. **App Store Connect**: Create app listing
3. **Push Notifications**: Configure APNs certificates
4. **TestFlight**: Set up beta testing

### Android Setup
1. **Google Play Console**: [play.google.com/console](https://play.google.com/console)
2. **Firebase**: Set up Android app
3. **Google Services**: Download google-services.json
4. **Signing Keys**: Generate upload key

## 🚀 Deployment Preparation

### Pre-Deployment Checklist
- [ ] All API keys obtained and tested
- [ ] Environment variables configured
- [ ] Database schema created and migrated
- [ ] SSL certificate issued
- [ ] Domain DNS configured
- [ ] AWS infrastructure ready
- [ ] Docker images built and tested
- [ ] Health checks implemented

### Testing Checklist
- [ ] Backend API endpoints tested
- [ ] Database connections verified
- [ ] Payment processing tested (Stripe test mode)
- [ ] File uploads working (S3)
- [ ] WebSocket connections functional
- [ ] Authentication flow tested
- [ ] CORS configuration verified

## 💰 Cost Estimation

### Monthly Costs (Approximate)
- **Stripe**: 2.9% + 30¢ per transaction
- **Google Maps**: $200/month free, then $0.005/request
- **AWS**: $50-250/month (see AWS.md for details)
- **Domain**: $10-20/year
- **SSL**: Free (AWS Certificate Manager)

### One-time Setup Costs
- **Apple Developer**: $99/year
- **Google Play**: $25 one-time
- **Domain Registration**: $10-20/year

## 🔧 Quick Setup Commands

### Generate Secure JWT Secret
```bash
# Generate a secure random string
openssl rand -base64 32
# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Test API Keys
```bash
# Test Stripe key
curl -X GET "https://api.stripe.com/v1/customers" \
  -u "sk_test_your_key_here:"

# Test Google Maps key
curl "https://maps.googleapis.com/maps/api/geocode/json?address=London&key=YOUR_API_KEY"
```

## 📞 Support & Resources

### Getting Help
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Google Maps**: [developers.google.com/maps](https://developers.google.com/maps)
- **AWS**: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- **Expo/React Native**: [docs.expo.dev](https://docs.expo.dev)

### Testing Accounts
- **Stripe**: Use test mode first (`sk_test_...`)
- **Google**: Enable billing but use restricted keys
- **AWS**: Use free tier resources initially

---

**Ready to deploy?** Follow the `AWS.md` guide after completing this setup!