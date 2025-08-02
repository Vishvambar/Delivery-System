# 🤖 Comprehensive Agent Documentation - Food Delivery Platform

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture & Technology Stack](#-architecture--technology-stack)
3. [Development Environment](#-development-environment)
4. [Project Structure](#-project-structure)
5. [Database Schema](#-database-schema)
6. [API Documentation](#-api-documentation)
7. [Real-Time Features](#-real-time-features)
8. [Mobile Apps](#-mobile-apps)
9. [Development Commands](#-development-commands)
10. [Testing & Quality Assurance](#-testing--quality-assurance)
11. [Deployment Guide](#-deployment-guide)
12. [Common Issues & Solutions](#-common-issues--solutions)
13. [Security Features](#-security-features)
14. [Performance Optimizations](#-performance-optimizations)
15. [Agent Workflow Guidelines](#-agent-workflow-guidelines)

## 🏗️ Project Overview

This is a comprehensive **food delivery platform** consisting of a microservices architecture with:

- **Backend**: Node.js + Express + MongoDB + Socket.IO server
- **Mobile Apps**: 3 React Native (Expo) applications
  - **Customer App**: Browse restaurants, place orders, track deliveries
  - **Vendor App**: Manage restaurants, menus, orders
  - **Delivery Partner App**: Accept and fulfill delivery orders

### Key Capabilities
- **Real-time synchronization** between all apps
- **Order lifecycle management** from placement to delivery
- **Live tracking** with Google Maps integration
- **Push notifications** for all stakeholders
- **Offline fallback** with AsyncStorage sync

## 🛠️ Architecture & Technology Stack

### Backend (`server/`)
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose ODM 7.5.0
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO 4.7.2
- **Security**: Helmet, express-rate-limit, CORS
- **Push Notifications**: expo-server-sdk 3.7.0

### Mobile Apps (`apps/`)
- **Framework**: React Native with Expo SDK
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit + React Redux
- **HTTP Client**: Axios 1.5.0
- **Real-time**: Socket.IO Client 4.7.2
- **Maps**: React Native Maps + Directions
- **Storage**: AsyncStorage
- **Notifications**: Expo Notifications

### Version Matrix
| App | Expo SDK | React Native | React |
|-----|----------|--------------|-------|
| Customer | 53 | 0.79.5 | 19.0.0 |
| Vendor | 53 | 0.79.5 | 19.0.0 |
| Delivery | **49** | **0.72.6** | **18.2.0** |

⚠️ **Critical Note**: Delivery app needs SDK upgrade to match other apps

## 🌍 Development Environment

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- Expo CLI: `npm install -g expo-cli`
- Google Maps API key
- Expo account (push notifications)

### Environment Variables (`.env` in `server/`)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fooddelivery
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_ACCESS_TOKEN=your-expo-access-token
```

## 📁 Project Structure

```
System/
├── server/                 # Backend API server
│   ├── config/
│   │   └── database.js     # MongoDB connection
│   ├── controllers/        # Route handlers
│   │   ├── authController.js    # Authentication logic
│   │   ├── orderController.js   # Order management
│   │   └── vendorController.js  # Vendor operations
│   ├── middleware/         # Auth & validation
│   │   └── auth.js         # JWT auth + role-based authorization
│   ├── models/            # Mongoose schemas
│   │   ├── User.js        # User schema (multi-role)
│   │   ├── Order.js       # Order lifecycle management
│   │   └── Vendor.js      # Vendor + menu management
│   ├── routes/            # API route definitions
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── orders.js      # Order management routes
│   │   └── vendors.js     # Vendor management routes
│   ├── socket/            # Socket.IO handlers
│   │   └── socketHandler.js    # Real-time event management
│   ├── .env               # Environment configuration
│   ├── package.json       # Dependencies
│   └── server.js          # Application entry point
│
├── apps/
│   ├── customer/          # Customer mobile app
│   │   ├── App.js         # Main app component
│   │   ├── app.json       # Expo configuration
│   │   ├── package.json   # App dependencies
│   │   └── src/
│   │       ├── navigation/ # App navigation
│   │       ├── screens/    # UI screens
│   │       ├── services/   # API services
│   │       ├── store/      # Redux configuration
│   │       └── hooks/      # Custom hooks (socket listeners)
│   │
│   ├── vendor/            # Vendor mobile app
│   │   ├── App.js         # Main app with notifications
│   │   ├── app.json       # Expo configuration
│   │   ├── package.json   # App dependencies
│   │   └── src/
│   │       ├── navigation/ # Navigation structure
│   │       ├── screens/    # App screens
│   │       │   ├── auth/   # Login/register screens
│   │       │   └── main/   # Dashboard, menu, orders
│   │       ├── services/   # API + socket services
│   │       ├── store/      # Redux store
│   │       └── hooks/      # Socket integration hooks
│   │
│   └── delivery/          # Delivery partner app
│       ├── App.js         # Main app component
│       ├── app.json       # Expo configuration (SDK 49)
│       ├── package.json   # Dependencies (needs upgrade)
│       └── src/           # App source code
│
├── README.md             # Project documentation
├── DOCUMENTATION.md      # Technical documentation
├── AGENT.md             # AI agent guidance
├── DATA_SYNC_IMPLEMENTATION.md    # Real-time sync details
└── REALTIME_SYNC_IMPLEMENTATION.md # Socket.IO implementation
```

## 🗄️ Database Schema

### Users Collection (User.js)
```javascript
{
  name: String,                    // Required, max 50 chars
  email: String,                   // Required, unique, validated
  passwordHash: String,            // Required, min 6 chars, auto-hashed
  role: String,                    // Required: customer|vendor|delivery
  phone: String,                   // Required, 10-digit validation
  address: {                       // Optional address object
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  fcmToken: String,                // For push notifications
  isActive: Boolean,               // Default true
  lastLogin: Date,                 // Auto-updated
  createdAt: Date,                 // Auto-generated
  updatedAt: Date                  // Auto-generated
}
```

### Orders Collection (Order.js)
```javascript
{
  orderNumber: String,             // Auto-generated unique ID
  customerId: ObjectId,            // Ref to User
  vendorId: ObjectId,              // Ref to Vendor
  items: [{                        // Array of order items
    menuItemId: ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    specialInstructions: String
  }],
  status: String,                  // Pending|Accepted|Prepared|Handed to Delivery|Out for Delivery|Delivered|Cancelled
  assignedTo: ObjectId,            // Ref to delivery User
  deliveryAddress: {               // Required delivery location
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number },
    instructions: String
  },
  pricing: {                       // Order pricing breakdown
    subtotal: Number,
    deliveryFee: Number,
    tax: Number,
    discount: Number,
    total: Number
  },
  paymentMethod: String,           // cash|card|wallet|upi
  paymentStatus: String,           // pending|paid|failed|refunded
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  statusHistory: [{               // Status change tracking
    status: String,
    timestamp: Date,
    updatedBy: ObjectId,
    notes: String
  }],
  rating: {                       // Customer feedback
    food: Number,                 // 1-5 rating
    delivery: Number,             // 1-5 rating
    overall: Number,              // 1-5 rating
    review: String,
    reviewDate: Date
  },
  cancellationReason: String,
  refundAmount: Number
}
```

### Vendors Collection (Vendor.js)
```javascript
{
  userId: ObjectId,               // Ref to User, unique
  businessName: String,           // Required
  category: String,               // restaurant|cafe|bakery|fast-food|dessert|beverage
  cuisineType: [String],          // indian|chinese|italian|mexican|american|thai|japanese
  description: String,            // Max 500 chars
  location: {                     // Required business location
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  menu: [{                        // Menu items array
    name: String,                 // Required
    description: String,          // Max 200 chars
    price: Number,                // Required, min 0
    category: String,             // appetizer|main-course|dessert|beverage|snack
    imageUrl: String,
    isAvailable: Boolean,         // Default true
    preparationTime: Number,      // Minutes, default 15
    isVegetarian: Boolean,        // Default false
    spiceLevel: String           // mild|medium|hot|extra-hot
  }],
  rating: {
    average: Number,              // 0-5, default 0
    count: Number                 // Default 0
  },
  deliveryFee: Number,            // Default 2.99
  minimumOrder: Number,           // Default 10
  estimatedDeliveryTime: Number,  // Minutes, default 30
  isOpen: Boolean,                // Default true
  operatingHours: {               // Daily hours
    monday: { open: String, close: String },
    // ... for each day
  },
  totalOrders: Number,            // Default 0
  totalRevenue: Number            // Default 0
}
```

## 🔌 API Documentation

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: TBD

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/register` | Register new user | ❌ | - |
| POST | `/login` | User login | ❌ | - |
| GET | `/me` | Get current user profile | ✅ | Any |
| PUT | `/profile` | Update user profile | ✅ | Any |
| PUT | `/password` | Change password | ✅ | Any |
| POST | `/logout` | User logout | ✅ | Any |

### Vendor Routes (`/api/vendors`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get all vendors | ❌ | - |
| GET | `/:id` | Get vendor details | ❌ | - |
| GET | `/:id/menu` | Get vendor menu | ❌ | - |
| POST | `/:id/menu` | Add menu item | ✅ | Vendor |
| PUT | `/:id/menu/:itemId` | Update menu item | ✅ | Vendor |
| DELETE | `/:id/menu/:itemId` | Delete menu item | ✅ | Vendor |
| PUT | `/profile` | Update vendor profile | ✅ | Vendor |

### Order Routes (`/api/orders`)
| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/` | Create order | ✅ | Customer |
| GET | `/customer/:userId` | Get customer orders | ✅ | Customer |
| GET | `/vendor/:vendorId` | Get vendor orders | ✅ | Vendor |
| PUT | `/:orderId/status` | Update order status | ✅ | Vendor/Delivery |
| PUT | `/:orderId/assign` | Assign delivery partner | ✅ | Vendor/Delivery |
| GET | `/delivery/available` | Get available orders | ✅ | Delivery |
| GET | `/delivery/:userId` | Get delivery orders | ✅ | Delivery |

### Authentication
- **JWT tokens** in Authorization header: `Bearer <token>`
- **Socket.IO auth** via `auth.token` in handshake
- **Role-based authorization**: customer, vendor, delivery

## 🔄 Real-Time Features (Socket.IO)

### Room Management
- `user:<userId>` - Private user rooms
- `role:<role>` - Role-based rooms (role:customer, role:vendor, role:delivery)
- `order:<orderId>` - Order-specific rooms

### Server Events (Emitted to clients)
| Event | Description | Target |
|-------|-------------|--------|
| `connected` | Connection confirmation | All clients |
| `order_accepted` | Vendor accepted order | Customer |
| `order_prepared` | Order ready for pickup | Customer |
| `new_delivery_available` | Available delivery order | Delivery partners |
| `order_handed_to_delivery` | Order given to delivery | Customer |
| `order_assigned` | Delivery partner assigned | Delivery partner |
| `order_out_for_delivery` | Delivery started | Customer |
| `order_picked_up` | Order picked up | Vendor |
| `delivery_location_update` | Live delivery tracking | Customer |
| `order_delivered` | Order completed | Customer |
| `order_completed` | Vendor notification | Vendor |
| `new_order` | New order for vendor | Vendor |
| `order_cancelled` | Order cancellation | All parties |
| `menu_item_added` | New menu item | Customers |
| `menu_item_updated` | Menu item updated | Customers |
| `menu_item_deleted` | Menu item removed | Customers |

### Client Events (Received from clients)
| Event | Description | Sender |
|-------|-------------|--------|
| `join_order_room` | Join order-specific room | All |
| `leave_order_room` | Leave order-specific room | All |
| `vendor_online` | Vendor comes online | Vendor |
| `order_accepted` | Vendor accepts order | Vendor |
| `order_prepared` | Order preparation complete | Vendor |
| `order_handed_to_delivery` | Hand to delivery partner | Vendor |
| `delivery_partner_online` | Delivery partner available | Delivery |
| `order_picked_up` | Delivery pickup confirmation | Delivery |
| `delivery_location_update` | Location sharing | Delivery |
| `order_delivered` | Delivery completion | Delivery |
| `order_placed` | Customer places order | Customer |
| `cancel_order` | Order cancellation | Customer |

## 📱 Mobile Apps

### Customer App Features
- ✅ Browse restaurants/vendors by location
- ✅ View detailed menus with real-time updates
- ✅ Add items to cart and customize orders
- ✅ Place orders with delivery address
- ✅ Real-time order tracking
- ✅ Live delivery location updates
- ✅ Order history and ratings
- ✅ Push notifications
- ✅ Offline fallback with AsyncStorage

### Vendor App Features
- ✅ Manage restaurant profile and details
- ✅ CRUD operations for menu items
- ✅ Real-time order notifications
- ✅ Order management dashboard
- ✅ Update order status workflow
- ✅ Earnings and analytics dashboard
- ✅ Operating hours management
- ✅ Real-time menu sync to customer app

### Delivery Partner App Features
- ⚠️ **Needs SDK upgrade** (Expo 49 → 53)
- View available delivery orders
- Accept and manage deliveries
- Google Maps navigation integration
- Real-time location sharing
- Delivery history and earnings
- Order status updates

## 🖥️ Development Commands

### Server Commands
```bash
cd server
npm install                 # Install dependencies
npm run dev                 # Start development server with nodemon
npm start                   # Start production server
```

### Mobile App Commands
```bash
cd apps/customer            # (or vendor/delivery)
npm install --legacy-peer-deps  # Install dependencies (SDK 53 apps)
npm start                   # Start Expo development server
npm run android             # Run on Android emulator/device
npm run ios                 # Run on iOS simulator/device
npm run web                 # Run in web browser
expo start                  # Alternative start command
```

### Build Commands
```bash
# For mobile apps
expo build:android          # Build Android APK
expo build:ios             # Build iOS IPA
```

## 🧪 Testing & Quality Assurance

### Test Data Accounts
```javascript
// Customer Account
{
  "email": "customer@test.com",
  "password": "password123"
}

// Vendor Account
{
  "email": "vendor@test.com",
  "password": "password123"
}

// Delivery Account
{
  "email": "delivery@test.com",
  "password": "password123"
}
```

### API Testing
```bash
# Health check
curl -X GET http://localhost:5000/health

# Register customer
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Customer",
    "email": "customer@test.com",
    "password": "password123",
    "role": "customer",
    "phone": "1234567890"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123"
  }'
```

### Real-Time Testing Workflow
1. **Start all services**: Server + 3 mobile apps
2. **Test menu sync**: Add/edit/delete items in vendor app → Verify instant updates in customer app
3. **Test order flow**: Place order in customer app → Accept/prepare/deliver in vendor/delivery apps
4. **Verify Socket.IO**: Check real-time notifications and status updates
5. **Test offline fallback**: Disconnect network → Verify AsyncStorage sync

## 🚀 Deployment Guide

### Backend Deployment (Render/Railway/Heroku)
1. **Environment Setup**:
   - Set all environment variables from `.env`
   - Configure MongoDB Atlas for production
   - Update CORS origins for production domains

2. **Build Configuration**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node.js version: 16+

### Mobile App Deployment
1. **Build for Production**:
   ```bash
   expo build:android  # Android APK
   expo build:ios      # iOS IPA
   ```

2. **App Store Deployment**:
   - Google Play Store (Android)
   - Apple App Store (iOS)
   - Update server URLs in production builds

## 🐛 Common Issues & Solutions

### Issue #1: Expo SDK Version Mismatch
**Problem**: Delivery app uses Expo SDK 49 while others use SDK 53
**Solution**: 
```bash
cd apps/delivery
expo upgrade 53
npm install --legacy-peer-deps
```

### Issue #2: MongoDB Connection Failures
**Problem**: `MongoNetworkError` or connection timeouts
**Solution**: 
- Verify MONGODB_URI format
- Check network connectivity
- Whitelist IP addresses in MongoDB Atlas

### Issue #3: Socket.IO Connection Issues
**Problem**: Real-time features not working
**Solution**:
- Verify JWT token in socket handshake
- Check server Socket.IO configuration
- Ensure client apps are connecting to correct server URL

### Issue #4: Redux Proxy Serialization Error
**Problem**: `TypeError: Proxy handler is null` in AsyncStorage
**Solution**: Use `JSON.parse(JSON.stringify())` for clean serializable copies

### Issue #5: Price Display Errors
**Problem**: `Cannot read property 'toFixed' of undefined`
**Solution**: Add null checks: `(item.price || 0).toFixed(2)`

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** (100 requests per 15 minutes)
- **CORS** configuration for development/production
- **JWT token expiration** (7 days)
- **Password hashing** with bcrypt (12 salt rounds)
- **Input validation** and sanitization
- **Role-based access control** (customer/vendor/delivery)
- **Environment variable protection**

## ⚡ Performance Optimizations

### Database Optimizations
- **Indexing** for frequently queried fields
- **Connection pooling** with Mongoose
- **Pagination** for large data sets
- **2dsphere indexing** for location-based queries

### Real-Time Optimizations
- **Room-based messaging** (targeted broadcasts)
- **Event cleanup** (proper Socket.IO listener removal)
- **Memoized selectors** (prevents unnecessary re-renders)
- **Change detection** (only syncs when data changes)

### Mobile App Optimizations
- **Lazy loading** for screens
- **Image optimization** for menu items
- **AsyncStorage caching** for offline functionality
- **Memory management** (proper cleanup of intervals/listeners)

## 🤖 Agent Workflow Guidelines

### 1. Task Planning & Management
- **ALWAYS** use `todo_write` to plan complex tasks
- Break down large features into smaller, manageable steps
- Mark todos as `in-progress` and `completed` as you work
- Update priorities based on dependencies and critical path

### 2. Code Analysis & Understanding
- Use `codebase_search_agent` for conceptual searches
- Use `Grep` for specific text/pattern searches
- Use `Read` to examine individual files
- Always understand existing patterns before making changes

### 3. Making Changes
- **First** understand the file's conventions and patterns
- **Check** existing dependencies in package.json files
- **Follow** established naming conventions
- **Test** changes immediately with `get_diagnostics`

### 4. Testing & Validation
- Run build commands: `npm run dev`, `npm start`
- Use test accounts for verification
- Test real-time features across all apps
- Verify API endpoints with curl/Postman

### 5. Common Agent Tasks

#### Adding New Features
1. Plan with `todo_write`
2. Research existing implementation patterns
3. Update database schemas if needed
4. Implement API endpoints
5. Add real-time Socket.IO events
6. Update mobile app screens/components
7. Test end-to-end functionality

#### Debugging Issues
1. Check server logs and database connections
2. Verify API responses with curl
3. Test Socket.IO connections
4. Check mobile app console logs
5. Validate Redux state management

#### Performance Optimization
1. Identify bottlenecks with profiling
2. Optimize database queries and indexing
3. Improve Socket.IO event efficiency
4. Optimize mobile app re-renders
5. Implement caching strategies

### 6. File Patterns to Follow

#### Backend Files
- **Controllers**: Handle business logic, validate input, return responses
- **Models**: Define schemas with proper validation and indexing
- **Routes**: Define endpoints with proper middleware
- **Socket handlers**: Manage real-time events and room management

#### Mobile App Files
- **Screens**: UI components with navigation integration
- **Services**: API calls and external service integration
- **Store**: Redux slices with proper action creators
- **Hooks**: Reusable logic (especially Socket.IO listeners)

### 7. Critical Reminders

#### Security
- Never commit secrets to repository
- Always validate user input
- Use proper authentication middleware
- Implement role-based access control

#### Performance
- Use memoization for expensive operations
- Clean up event listeners and intervals
- Optimize database queries
- Implement proper caching

#### Reliability
- Add proper error handling
- Implement graceful fallbacks
- Test offline scenarios
- Ensure data consistency

### 8. Emergency Procedures

#### System Down
1. Check server health endpoint: `/health`
2. Verify MongoDB connection
3. Check environment variables
4. Restart services in order: Database → Server → Apps

#### Data Corruption
1. Backup current database state
2. Identify source of corruption
3. Restore from latest backup
4. Implement additional validation

#### Performance Issues
1. Check database query performance
2. Monitor Socket.IO connection counts
3. Profile mobile app memory usage
4. Implement temporary rate limiting

---

## 📞 Support & Maintenance

For ongoing development and maintenance:

1. **Monitor logs** for errors and performance issues
2. **Update dependencies** regularly for security
3. **Backup database** frequently
4. **Test real-time features** after any changes
5. **Keep documentation updated** as features evolve

This comprehensive documentation serves as the definitive guide for AI agents working on this food delivery platform. It provides all necessary context, patterns, and procedures for effective development and maintenance.

---

**Last Updated**: August 1, 2025  
**Version**: 1.0.0  
**Maintainer**: AI Agent System
