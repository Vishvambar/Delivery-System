# 🤖 Ultimate Agent Documentation - Food Delivery Platform

## 📋 Quick Reference

**Project Type**: Complete food delivery platform (Swiggy/DoorDash style)
**Architecture**: Microservices (Node.js backend + 3 React Native apps)
**Status**: ✅ FULLY FUNCTIONAL & PRODUCTION READY
**Last Updated**: January 2025

---

## 🎯 Project Overview

This is a **complete food delivery ecosystem** with three interconnected applications:

### 🏗️ System Architecture
```
Customer App ↔ 
                 Backend Server (Node.js + MongoDB + Socket.IO) ↔ 
Vendor App ↔                                                        ↔ Delivery App
```

### 🎯 Core Applications
1. **Customer App** (`apps/customer/`) - Browse restaurants, place orders, track deliveries
2. **Vendor App** (`apps/vendor/`) - Manage restaurant, menu items, process orders  
3. **Delivery App** (`apps/delivery/`) - Accept deliveries, navigate, update status
4. **Backend Server** (`server/`) - APIs, authentication, real-time communication

---

## 🚀 Quick Start Commands

### Essential Development Commands
```bash
# Backend Server
cd server
npm install
npm run dev                 # Development server with nodemon
# Server runs on http://localhost:5000

# Customer App  
cd apps/customer
npm install --legacy-peer-deps
npm start                   # Expo development server

# Vendor App
cd apps/vendor  
npm install --legacy-peer-deps
npm start                   # Expo development server

# Delivery App
cd apps/delivery
npm install --legacy-peer-deps  
npm start                   # Expo development server
```

### Build Commands
```bash
# Mobile apps
expo build:android          # Android APK
expo build:ios              # iOS IPA

# Backend production
npm start                   # Production server
```

### Diagnostics & Testing
```bash
# Health check
curl http://localhost:5000/health

# Database connection test
# Check server logs for "MongoDB Connected" message

# API test
curl -X GET http://localhost:5000/api/vendors
```

---

## 🏛️ Technology Stack

### Backend (`server/`)
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose ODM 7.5.0
- **Authentication**: JWT + bcrypt (12 salt rounds)
- **Real-time**: Socket.IO 4.7.2
- **Security**: Helmet, express-rate-limit, CORS
- **File Upload**: Multer (images stored as MongoDB Buffer)
- **Push Notifications**: expo-server-sdk 3.7.0

### Mobile Apps (`apps/`)
- **Framework**: React Native with Expo SDK
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit + React Redux
- **HTTP Client**: Axios 1.5.0
- **Real-time**: Socket.IO Client 4.7.2
- **Maps**: React Native Maps + Google Directions
- **Storage**: AsyncStorage (offline fallback)
- **Notifications**: Expo Notifications

### Version Compatibility Matrix
| App | Expo SDK | React Native | React | Status |
|-----|----------|--------------|-------|--------|
| Customer | 53 | 0.79.5 | 19.0.0 | ✅ Current |
| Vendor | 53 | 0.79.5 | 19.0.0 | ✅ Current |
| Delivery | **49** | **0.72.6** | **18.2.0** | ⚠️ **NEEDS UPDATE** |

---

## 📁 Project Structure

```
System/
├── server/                          # Backend (Node.js + Express + MongoDB)
│   ├── config/
│   │   └── database.js              # MongoDB connection with Mongoose
│   ├── controllers/                 # Business logic handlers
│   │   ├── authController.js        # JWT auth, user management
│   │   ├── orderController.js       # Complete order lifecycle
│   │   └── vendorController.js      # Vendor + menu management
│   ├── middleware/                  # Auth & validation
│   │   ├── auth.js                  # JWT verification + role-based access
│   │   └── upload.js                # Multer image upload
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # Multi-role user model
│   │   ├── Order.js                 # Order with full status tracking
│   │   └── Vendor.js                # Vendor profile + menu items
│   ├── routes/                      # API endpoints
│   │   ├── auth.js                  # Authentication routes
│   │   ├── orders.js                # Order management
│   │   ├── vendors.js               # Vendor operations
│   │   └── images.js                # Image serving (Buffer → Base64)
│   ├── socket/                      # Real-time communication
│   │   └── socketHandler.js         # Socket.IO events + rooms
│   ├── .env                         # Environment variables
│   ├── package.json                 # Dependencies
│   └── server.js                    # Express app entry point
│
├── apps/customer/                   # Customer React Native App
│   ├── App.js                       # Main app with navigation
│   ├── app.json                     # Expo SDK 53 configuration
│   ├── package.json                 # Dependencies
│   └── src/
│       ├── navigation/              # React Navigation setup
│       ├── screens/                 # UI screens
│       │   ├── auth/                # Login/register
│       │   └── main/                # Home, vendor details, cart, tracking
│       ├── services/                # API calls + Socket.IO
│       ├── store/                   # Redux Toolkit slices
│       └── hooks/                   # Custom hooks (socket listeners)
│
├── apps/vendor/                     # Vendor React Native App
│   ├── App.js                       # Main app with push notifications
│   ├── app.json                     # Expo SDK 53 configuration  
│   ├── package.json                 # Dependencies
│   └── src/
│       ├── navigation/              # Tab + stack navigation
│       ├── screens/                 # UI screens
│       │   ├── auth/                # Vendor auth
│       │   └── main/                # Dashboard, menu, orders, profile
│       ├── services/                # API + Socket.IO + notifications
│       └── store/                   # Redux store
│
├── apps/delivery/                   # Delivery Partner App  
│   ├── App.js                       # Main app (⚠️ Expo SDK 49)
│   ├── app.json                     # Needs upgrade to SDK 53
│   ├── package.json                 # Dependencies need update
│   └── src/                         # App source
│
├── AGENT.md                         # AI agent guidance (current)
├── README.md                        # Project overview + setup
├── DOCUMENTATION.md                 # Technical documentation
├── COMPREHENSIVE_AGENT_DOCUMENTATION.md  # Detailed agent docs
├── COMPLETE_SYSTEM_GUIDE.md         # Implementation status
├── DATA_SYNC_IMPLEMENTATION.md      # Real-time sync details
├── REALTIME_SYNC_IMPLEMENTATION.md  # Socket.IO specifics
├── DEPLOYMENT_GUIDE.md              # Production deployment
└── SYSTEM_TEST_GUIDE.md             # Testing procedures
```

---

## 🗄️ Database Schema

### Users Collection (Multi-role)
```javascript
{
  _id: ObjectId,
  name: String,                     // Required, max 50 chars
  email: String,                    // Required, unique, validated
  passwordHash: String,             // bcrypt hashed, min 6 chars
  role: String,                     // "customer" | "vendor" | "delivery"
  phone: String,                    // Required, 10-digit validation
  address: {                        // Optional, for customers
    street: String,
    city: String, 
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  fcmToken: String,                 // Push notification token
  isActive: Boolean,                // Default: true
  lastLogin: Date,                  // Auto-updated on login
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-updated
}
```

### Vendors Collection  
```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // Ref to User (unique)
  businessName: String,             // Required
  category: String,                 // "restaurant"|"cafe"|"bakery"|"fast-food"|"dessert"|"beverage"
  cuisineType: [String],            // ["indian","chinese","italian","mexican","american","thai","japanese"]
  description: String,              // Max 500 chars
  location: {                       // Required business location
    address: String,
    city: String,
    state: String, 
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  logo: Buffer,                     // Vendor logo as Buffer
  menu: [{                          // Menu items array
    _id: ObjectId,                  // Auto-generated item ID
    name: String,                   // Required
    description: String,            // Max 200 chars
    price: Number,                  // Required, min 0
    category: String,               // "appetizer"|"main-course"|"dessert"|"beverage"|"snack"
    image: Buffer,                  // Item image as Buffer
    isAvailable: Boolean,           // Default: true
    preparationTime: Number,        // Minutes, default: 15
    isVegetarian: Boolean,          // Default: false
    spiceLevel: String              // "mild"|"medium"|"hot"|"extra-hot"
  }],
  rating: {
    average: Number,                // 0-5, default: 0
    count: Number                   // Default: 0
  },
  deliveryFee: Number,              // Default: 2.99
  minimumOrder: Number,             // Default: 10
  estimatedDeliveryTime: Number,    // Minutes, default: 30
  isOpen: Boolean,                  // Default: true
  operatingHours: {                 // Operating schedule
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    // ... for each day
  },
  totalOrders: Number,              // Default: 0
  totalRevenue: Number,             // Default: 0
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String,              // Auto-generated unique ID (ORD-timestamp)
  customerId: ObjectId,             // Ref to User
  vendorId: ObjectId,               // Ref to Vendor
  items: [{                         // Ordered items
    menuItemId: ObjectId,           // Ref to menu item
    name: String,                   // Item name (snapshot)
    price: Number,                  // Item price (snapshot)
    quantity: Number,               // Quantity ordered
    specialInstructions: String     // Optional notes
  }],
  status: String,                   // "Pending"|"Accepted"|"Prepared"|"Handed to Delivery"|"Out for Delivery"|"Delivered"|"Cancelled"
  assignedTo: ObjectId,             // Ref to delivery partner User
  deliveryAddress: {                // Required delivery location
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number },
    instructions: String            // Delivery instructions
  },
  pricing: {                        // Order cost breakdown
    subtotal: Number,               // Sum of item prices
    deliveryFee: Number,            // Vendor's delivery fee
    tax: Number,                    // Calculated tax
    discount: Number,               // Applied discounts
    total: Number                   // Final amount
  },
  paymentMethod: String,            // "cash"|"card"|"wallet"|"upi"
  paymentStatus: String,            // "pending"|"paid"|"failed"|"refunded"
  estimatedDeliveryTime: Date,      // Expected delivery
  actualDeliveryTime: Date,         // Actual delivery time
  statusHistory: [{                 // Status change log
    status: String,                 // Status value
    timestamp: Date,                // When changed
    updatedBy: ObjectId,            // Who changed it
    notes: String                   // Optional notes
  }],
  rating: {                         // Customer feedback
    food: Number,                   // 1-5 food rating
    delivery: Number,               // 1-5 delivery rating
    overall: Number,                // 1-5 overall rating
    review: String,                 // Text review
    reviewDate: Date                // When reviewed
  },
  cancellationReason: String,       // If cancelled
  refundAmount: Number,             // If refunded
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Reference

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: TBD

### Authentication Headers
```bash
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Core API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/register` | Register new user | ❌ | - |
| POST | `/login` | User login | ❌ | - |
| GET | `/me` | Get current user | ✅ | Any |
| PUT | `/profile` | Update profile | ✅ | Any |
| PUT | `/password` | Change password | ✅ | Any |
| POST | `/logout` | User logout | ✅ | Any |

#### Vendors (`/api/vendors`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all vendors | ❌ | - |
| GET | `/:id` | Get vendor details | ❌ | - |
| GET | `/:id/menu` | Get vendor menu | ❌ | - |
| POST | `/:id/menu` | Add menu item | ✅ | Vendor |
| PUT | `/:id/menu/:itemId` | Update menu item | ✅ | Vendor |
| DELETE | `/:id/menu/:itemId` | Delete menu item | ✅ | Vendor |
| PUT | `/profile` | Update vendor profile | ✅ | Vendor |
| POST | `/:id/logo` | Upload vendor logo | ✅ | Vendor |

#### Orders (`/api/orders`)
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/` | Create order | ✅ | Customer |
| GET | `/customer/:userId` | Customer's orders | ✅ | Customer |
| GET | `/vendor/:vendorId` | Vendor's orders | ✅ | Vendor |
| PUT | `/:orderId/status` | Update order status | ✅ | Vendor/Delivery |
| PUT | `/:orderId/assign` | Assign delivery partner | ✅ | Vendor/Delivery |
| GET | `/delivery/available` | Available deliveries | ✅ | Delivery |
| GET | `/delivery/:userId` | Delivery partner's orders | ✅ | Delivery |

#### Images (`/api/images`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendor-logo/:vendorId` | Get vendor logo | ❌ |
| GET | `/vendor-logo/:vendorId/base64` | Logo as base64 | ❌ |
| GET | `/menu-item/:vendorId/:itemId` | Get item image | ❌ |
| GET | `/menu-item/:vendorId/:itemId/base64` | Item image as base64 | ❌ |

---

## 🔄 Real-Time Communication (Socket.IO)

### Room Management
- `user:<userId>` - Private user rooms for targeted messages
- `role:<role>` - Role-based rooms (customer, vendor, delivery)
- `order:<orderId>` - Order-specific rooms for all parties

### Server Events (Server → Client)
| Event | Description | Target | Trigger |
|-------|-------------|--------|---------|
| `connected` | Connection confirmation | All | Socket connection |
| `new_order` | New order notification | Vendor | Customer places order |
| `order_accepted` | Order accepted | Customer | Vendor accepts |
| `order_prepared` | Order ready | Customer | Vendor marks prepared |
| `order_handed_to_delivery` | Given to delivery | Customer | Vendor hands over |
| `order_out_for_delivery` | Delivery started | Customer | Delivery partner starts |
| `order_delivered` | Order completed | Customer, Vendor | Delivery completed |
| `order_cancelled` | Order cancelled | Vendor | Customer cancels |
| `order_status_update` | General status change | Order room | Any status update |
| `menu_item_added` | New menu item | Customers | Vendor adds item |
| `menu_item_updated` | Menu item changed | Customers | Vendor updates item |
| `menu_item_deleted` | Menu item removed | Customers | Vendor deletes item |
| `vendor_status_changed` | Vendor open/closed | Customers | Vendor toggles status |
| `new_delivery_available` | Available delivery | Delivery partners | Order ready for pickup |
| `order_assigned` | Delivery assigned | Delivery partner | Order assigned |
| `delivery_location_update` | Live tracking | Customer | Delivery location update |

### Client Events (Client → Server)
| Event | Description | Sender | Purpose |
|-------|-------------|--------|---------|
| `join_order_room` | Join order room | All | Subscribe to order updates |
| `leave_order_room` | Leave order room | All | Unsubscribe from order |
| `vendor_online` | Vendor status | Vendor | Announce availability |
| `order_accepted` | Accept order | Vendor | Accept incoming order |
| `order_prepared` | Mark prepared | Vendor | Order ready for pickup |
| `order_handed_to_delivery` | Hand to delivery | Vendor | Give to delivery partner |
| `delivery_partner_online` | Delivery available | Delivery | Announce availability |
| `order_picked_up` | Pickup confirmation | Delivery | Confirm pickup |
| `delivery_location_update` | Share location | Delivery | Live tracking |
| `order_delivered` | Mark delivered | Delivery | Confirm delivery |
| `order_placed` | Place order | Customer | Create new order |
| `cancel_order` | Cancel order | Customer | Cancel pending order |

### Real-Time Flow Examples

#### Order Placement Flow
```
1. Customer places order → Server emits `new_order` → Vendor receives notification
2. Vendor accepts → Server emits `order_accepted` → Customer receives update
3. Vendor prepares → Server emits `order_prepared` → Customer receives update
4. Vendor hands to delivery → Server emits `order_handed_to_delivery` → Customer receives update
5. Delivery starts → Server emits `order_out_for_delivery` → Customer receives update
6. Delivery completes → Server emits `order_delivered` → Customer & Vendor receive update
```

#### Menu Update Flow
```
1. Vendor adds menu item → Server emits `menu_item_added` → All customers receive update
2. Customer apps automatically refresh menu without reload
```

---

## 📱 Mobile App Features

### Customer App (`apps/customer/`)
**Status**: ✅ **FULLY FUNCTIONAL**

#### Core Features
- ✅ User registration and JWT authentication
- ✅ Browse restaurants with logo previews
- ✅ Real-time menu display with item images
- ✅ Shopping cart with quantity controls
- ✅ Single-page checkout with address management
- ✅ Real-time order tracking with status updates
- ✅ Order history with complete timeline
- ✅ Push notifications for order updates
- ✅ Offline fallback with AsyncStorage sync

#### Key Screens
- `EnhancedHomeScreen.js` - Restaurant discovery with filters
- `EnhancedVendorDetailsScreen.js` - Menu browsing + cart
- `EnhancedCartScreen.js` - Cart management + checkout
- `EnhancedOrderTrackingScreen.js` - Real-time order tracking

#### Real-Time Integration
- Socket.IO listeners for order status updates
- Live menu updates when vendors make changes
- Instant notifications without app reload

### Vendor App (`apps/vendor/`)
**Status**: ✅ **FULLY FUNCTIONAL**

#### Core Features
- ✅ Vendor registration and profile management
- ✅ Logo upload and display
- ✅ Complete menu item CRUD with image upload
- ✅ Real-time order notifications
- ✅ Order management dashboard
- ✅ Order status workflow (Accept → Prepare → Hand to Delivery)
- ✅ Earnings and analytics dashboard
- ✅ Operating hours management

#### Key Screens
- `DashboardScreen.js` - Analytics and overview
- `MenuScreen.js` - Menu management interface
- `AddEditMenuItemScreen.js` - Item creation/editing with image upload
- `OrdersScreen.js` - Real-time order management
- `OrderDetailsScreen.js` - Individual order handling
- `ProfileScreen.js` - Vendor profile and settings

#### Real-Time Integration
- Instant order notifications via Socket.IO
- Real-time order status updates
- Menu changes propagated to customer apps

### Delivery App (`apps/delivery/`)
**Status**: ⚠️ **NEEDS SDK UPGRADE**

#### Current Issues
- Using Expo SDK 49 (needs upgrade to 53)
- React Native 0.72.6 (needs upgrade to 0.79.5)
- React 18.2.0 (needs upgrade to 19.0.0)

#### Planned Features
- View available delivery orders
- Accept and manage deliveries
- Google Maps navigation integration
- Real-time location sharing
- Delivery history and earnings
- Order status updates

#### Upgrade Required
```bash
cd apps/delivery
expo upgrade 53
npm install --legacy-peer-deps
# Update dependencies to match other apps
```

---

## 🧪 Testing & Quality Assurance

### Test Accounts
```javascript
// Pre-configured test accounts
{
  customer: {
    email: "customer@test.com",
    password: "password123"
  },
  vendor: {
    email: "vendor@test.com", 
    password: "password123"
  },
  delivery: {
    email: "delivery@test.com",
    password: "password123"
  }
}
```

### API Testing Examples
```bash
# Health Check
curl -X GET http://localhost:5000/health

# Register Customer
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

# Get Vendors
curl -X GET http://localhost:5000/api/vendors

# Add Menu Item (with auth)
curl -X POST http://localhost:5000/api/vendors/{vendorId}/menu \
  -H "Authorization: Bearer {token}" \
  -F "name=Pizza Margherita" \
  -F "price=12.99" \
  -F "description=Classic pizza" \
  -F "category=main-course" \
  -F "image=@pizza.jpg"

# Place Order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer {customerToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "...",
    "items": [{"menuItemId": "...", "quantity": 2}],
    "deliveryAddress": {...},
    "paymentMethod": "cash"
  }'
```

### Real-Time Testing Workflow
1. **Start all services**: Server + Customer + Vendor apps
2. **Test menu sync**: Add item in vendor → Verify instant update in customer
3. **Test order flow**: Place order → Accept → Update status → Verify real-time updates
4. **Test notifications**: Verify Socket.IO events work correctly
5. **Test offline**: Disconnect network → Verify AsyncStorage fallback

### Integration Testing Checklist
- [ ] Backend server starts without errors
- [ ] MongoDB connection established
- [ ] All APIs respond correctly
- [ ] JWT authentication works
- [ ] Socket.IO connections successful
- [ ] Image upload/retrieval working
- [ ] Real-time events propagating
- [ ] Mobile apps connect to server
- [ ] End-to-end order flow complete

---

## 🚀 Deployment Guide

### Environment Variables (`.env` in `server/`)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fooddelivery

# Authentication  
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=production

# External Services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_ACCESS_TOKEN=your-expo-access-token

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Backend Deployment (Render/Railway/Heroku)
1. **Environment Setup**:
   - Set all environment variables
   - Configure MongoDB Atlas for production
   - Update CORS origins for production domains

2. **Build Configuration**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node.js version: 16+

3. **Production Checklist**:
   - [ ] MongoDB Atlas whitelist deployment IP
   - [ ] Set NODE_ENV=production
   - [ ] Configure proper CORS origins
   - [ ] Set up SSL certificate
   - [ ] Configure rate limiting

### Mobile App Deployment
1. **Update Server URLs**: 
   - Update API base URLs in mobile apps for production
   - Configure production Socket.IO endpoints

2. **Build for Production**:
   ```bash
   cd apps/customer  # or vendor
   expo build:android    # Android APK
   expo build:ios        # iOS IPA
   ```

3. **App Store Deployment**:
   - Google Play Store (Android)
   - Apple App Store (iOS)
   - Configure app signing certificates
   - Update app metadata and descriptions

### Production Monitoring
- Set up logging with Winston or similar
- Monitor API response times
- Track Socket.IO connection health
- Monitor database performance
- Set up error tracking (Sentry, etc.)

---

## 🐛 Common Issues & Solutions

### Critical Issues

#### Issue #1: Expo SDK Version Mismatch
**Problem**: Delivery app uses SDK 49, others use SDK 53
**Symptoms**: Dependency conflicts, build errors
**Solution**:
```bash
cd apps/delivery
expo upgrade 53
npm install --legacy-peer-deps
# Update package.json dependencies to match other apps
```

#### Issue #2: MongoDB Connection Failures
**Problem**: `MongoNetworkError`, connection timeouts
**Symptoms**: Server startup fails, "Cannot connect to MongoDB"
**Solution**:
- Verify MONGODB_URI format in .env
- Check MongoDB Atlas network access (whitelist IPs)
- Ensure MongoDB cluster is running
- Check firewall/network connectivity

#### Issue #3: Socket.IO Connection Issues
**Problem**: Real-time features not working
**Symptoms**: No real-time updates, connection failures
**Solution**:
```javascript
// Verify client connection
socket.on('connect', () => {
  console.log('Connected to server');
});

// Check server logs for connection attempts
// Verify JWT token in socket handshake
// Ensure server URL is correct in mobile apps
```

#### Issue #4: JWT Authentication Failures
**Problem**: "Token expired" or "Invalid token" errors
**Symptoms**: API returns 401 Unauthorized
**Solution**:
```bash
# Check JWT_SECRET in .env
# Verify token format: "Bearer <token>"
# Check token expiration (default 7 days)
# Re-login to get fresh token
```

#### Issue #5: Image Upload/Display Issues
**Problem**: Images not uploading or displaying
**Symptoms**: Image upload fails, blank images in apps
**Solution**:
```javascript
// Check multer configuration
// Verify image routes are accessible
// Check Buffer storage in MongoDB
// Ensure base64 conversion is working
```

### Development Issues

#### Issue #6: npm install Failures
**Problem**: Dependency conflicts with Expo SDK 53
**Symptoms**: "peer dep" errors, package conflicts
**Solution**:
```bash
npm install --legacy-peer-deps
# Use legacy peer deps for Expo SDK 53 compatibility
```

#### Issue #7: Redux State Issues
**Problem**: State not updating, proxy errors
**Symptoms**: "Proxy handler is null", state inconsistencies
**Solution**:
```javascript
// Use serializable state
const serializedState = JSON.parse(JSON.stringify(state));
// Avoid storing non-serializable data in Redux
```

#### Issue #8: AsyncStorage Sync Issues
**Problem**: Offline data not syncing
**Symptoms**: Data loss when offline
**Solution**:
```javascript
// Implement proper error handling
try {
  await AsyncStorage.setItem('key', JSON.stringify(data));
} catch (error) {
  console.error('AsyncStorage error:', error);
}
```

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT tokens** with 7-day expiration
- **bcrypt password hashing** (12 salt rounds)
- **Role-based access control** (customer/vendor/delivery)
- **Protected routes** with middleware validation

### API Security
- **Helmet.js** security headers
- **Rate limiting** (100 requests per 15 minutes)
- **CORS configuration** for allowed origins
- **Input validation** and sanitization
- **SQL injection prevention** with Mongoose ODM

### File Upload Security
- **File type validation** (images only)
- **File size limits** (5MB maximum)
- **Buffer storage** (no external file systems)
- **Malicious file detection**

### Socket.IO Security
- **JWT authentication** for socket connections
- **Room-based access control**
- **Event validation**
- **Connection rate limiting**

---

## ⚡ Performance Optimizations

### Database Optimizations
- **Indexing** on frequently queried fields
- **Connection pooling** with Mongoose
- **Query optimization** with projection
- **2dsphere indexing** for location queries

### Real-Time Optimizations
- **Room-based messaging** (targeted broadcasts)
- **Event cleanup** (proper listener removal)
- **Connection pooling** for Socket.IO
- **Heartbeat monitoring**

### Mobile App Optimizations
- **Lazy loading** for screens
- **Image caching** with AsyncStorage
- **Memory management** (cleanup intervals/listeners)
- **Background sync** for offline functionality

### API Optimizations
- **Response caching** for static data
- **Pagination** for large datasets
- **Compression** middleware
- **Request batching** where possible

---

## 🤖 Agent Workflow Guidelines

### 1. Task Planning & Tracking
```javascript
// ALWAYS use todo_write for complex tasks
const todos = [
  { id: "1", content: "Analyze requirements", status: "todo", priority: "high" },
  { id: "2", content: "Implement feature", status: "todo", priority: "medium" },
  { id: "3", content: "Test functionality", status: "todo", priority: "medium" }
];
```

### 2. Code Analysis Approach
1. **Use codebase_search_agent** for conceptual searches
2. **Use Grep** for exact text/pattern matching
3. **Use Read** to examine specific files
4. **Understand patterns** before making changes

### 3. Making Changes
1. **Check existing conventions** in the file/directory
2. **Verify dependencies** in package.json
3. **Follow established patterns** (imports, naming, structure)
4. **Test immediately** with get_diagnostics

### 4. Testing Protocol
1. **Run build commands**: `npm run dev`, `npm start`
2. **Check health endpoint**: `curl localhost:5000/health`
3. **Test APIs** with curl/Postman
4. **Verify real-time features** across apps
5. **Check console logs** for errors

### 5. Common Agent Tasks

#### Adding New API Endpoint
1. Plan with todo_write
2. Add route in `routes/` directory
3. Create controller logic in `controllers/`
4. Update middleware if needed
5. Test with curl
6. Update mobile app services
7. Test end-to-end

#### Adding Real-Time Feature
1. Define Socket.IO events in `socket/socketHandler.js`
2. Update mobile app socket services
3. Add event listeners in mobile components
4. Test real-time propagation
5. Verify room management

#### Debugging Issues
1. Check server logs (`npm run dev` output)
2. Verify database connection
3. Test API endpoints individually
4. Check Socket.IO connections
5. Examine mobile app console logs

### 6. File Patterns to Follow

#### Backend Controllers
```javascript
// controllers/exampleController.js
const asyncHandler = require('express-async-handler');
const Model = require('../models/Model');

// @desc    Description
// @route   POST /api/example
// @access  Private
const createExample = asyncHandler(async (req, res) => {
  // Validation
  const { field1, field2 } = req.body;
  
  // Business logic
  const example = await Model.create({
    field1,
    field2,
    userId: req.user._id
  });
  
  // Response
  res.status(201).json({
    success: true,
    data: example
  });
});

module.exports = { createExample };
```

#### Mobile App Screens
```javascript
// React Native screen pattern
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

const ExampleScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Component mount logic
  }, []);
  
  return (
    <View style={styles.container}>
      <Text>Content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  }
});

export default ExampleScreen;
```

### 7. Critical Reminders

#### Security Best Practices
- Never commit secrets (.env files)
- Always validate user input
- Use proper authentication middleware
- Implement role-based access control
- Hash passwords before storage

#### Performance Best Practices
- Clean up event listeners
- Use memoization for expensive operations
- Implement proper error boundaries
- Optimize database queries
- Cache frequently accessed data

#### Code Quality
- Follow existing naming conventions
- Write descriptive commit messages
- Add error handling for async operations
- Use TypeScript-like JSDoc comments
- Keep components/functions small and focused

---

## 📞 Emergency Procedures

### System Down
1. **Check health endpoint**: `GET /health`
2. **Verify MongoDB connection**
3. **Check environment variables**
4. **Restart in order**: Database → Server → Mobile Apps

### Data Issues
1. **Backup current state**
2. **Identify corruption source**
3. **Restore from backup**
4. **Implement additional validation**

### Performance Issues
1. **Check database query performance**
2. **Monitor Socket.IO connections**
3. **Profile memory usage**
4. **Implement temporary rate limiting**

---

## 📈 Monitoring & Maintenance

### Health Checks
```bash
# API Health
curl http://localhost:5000/health

# Database Status
# Check MongoDB Atlas dashboard

# Socket.IO Connections
# Monitor server console for connection logs
```

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Backup database weekly
- [ ] Monitor error logs daily
- [ ] Test real-time features after updates
- [ ] Check security vulnerabilities

### Performance Monitoring
- API response times
- Database query performance
- Socket.IO connection health
- Mobile app crash reports
- Memory usage patterns

---

## 🎯 Quick Reference Commands

### Development
```bash
# Start everything
cd server && npm run dev &
cd apps/customer && npm start &
cd apps/vendor && npm start &

# Health checks
curl localhost:5000/health
curl localhost:5000/api/vendors

# Database check (look for "MongoDB Connected")
cd server && npm run dev
```

### Testing
```bash
# API testing
curl -X POST localhost:5000/api/auth/register -d '{"name":"Test","email":"test@test.com","password":"password123","role":"customer","phone":"1234567890"}' -H "Content-Type: application/json"

# Socket.IO testing
# Use browser console: io('http://localhost:5000')
```

### Debugging
```bash
# Check logs
cd server && npm run dev | grep -i error

# Database queries
# Use MongoDB Compass with connection string

# Mobile app logs
# Check Expo console in terminal/browser
```

---

**This documentation serves as the definitive guide for AI agents working on this food delivery platform. It contains all necessary information for effective development, debugging, and maintenance.**

**Last Updated**: January 8, 2025  
**Status**: ✅ Production Ready  
**Version**: 2.0.0
