# AGENT.md - Food Delivery Platform

## Project Overview

This is a comprehensive food delivery platform with a microservices architecture consisting of:
- **Backend**: Node.js + Express + MongoDB + Socket.IO server
- **Mobile Apps**: 3 React Native (Expo) applications
  - Customer App (`apps/customer`)
  - Vendor App (`apps/vendor`) 
  - Delivery Partner App (`apps/delivery`)

## Technology Stack

### Backend (`server/`)
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO
- **Security**: Helmet, express-rate-limit, CORS
- **Push Notifications**: expo-server-sdk

### Mobile Apps (`apps/`)
- **Framework**: React Native with Expo SDK
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit + React Redux
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Maps**: React Native Maps + Directions
- **Storage**: AsyncStorage
- **Notifications**: Expo Notifications
- **Device Features**: Location, Image Picker, Device info

### Version Compatibility Note
- **Customer & Vendor Apps**: Expo SDK 53, React Native 0.79.5, React 19.0.0
- **Delivery App**: Expo SDK 49, React Native 0.72.6, React 18.2.0
- ⚠️ **Action Required**: Update delivery app to match SDK versions

## Development Commands

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
npm install --legacy-peer-deps  # Install dependencies (use legacy for Expo SDK 53)
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

### Testing Commands
Currently no test commands are configured - tests need to be implemented.

## Project Structure

```
System/
├── server/                 # Backend API server
│   ├── config/
│   │   └── database.js     # MongoDB connection configuration
│   ├── controllers/        # Route handler logic
│   │   ├── authController.js    # Authentication handlers
│   │   ├── orderController.js   # Order management handlers
│   │   └── vendorController.js  # Vendor management handlers
│   ├── middleware/         # Authentication and validation middleware
│   │   └── auth.js         # JWT auth & role-based authorization
│   ├── models/            # Mongoose database schemas
│   │   ├── User.js        # User schema (customer/vendor/delivery)
│   │   ├── Order.js       # Order schema with status tracking
│   │   └── Vendor.js      # Vendor schema with menu items
│   ├── routes/            # API route definitions
│   │   ├── auth.js        # Authentication routes
│   │   ├── orders.js      # Order management routes
│   │   └── vendors.js     # Vendor management routes
│   ├── socket/            # Socket.IO event handlers
│   │   └── socketHandler.js    # Real-time event management
│   ├── .env               # Environment variables
│   ├── package.json       # Server dependencies
│   └── server.js          # Main server entry point
│
├── apps/
│   ├── customer/          # Customer mobile app
│   │   ├── App.js         # Main app component
│   │   ├── app.json       # Expo configuration
│   │   └── src/
│   │       ├── navigation/ # App navigation structure
│   │       ├── screens/    # App screens/components
│   │       ├── services/   # API and external services
│   │       └── store/      # Redux store configuration
│   │
│   ├── vendor/            # Vendor mobile app
│   │   ├── App.js         # Main app component with notifications
│   │   ├── app.json       # Expo configuration
│   │   └── src/
│   │       ├── navigation/ # App navigation structure
│   │       ├── screens/    # App screens
│   │       │   ├── auth/   # Authentication screens
│   │       │   └── main/   # Main app screens
│   │       │       ├── DashboardScreen.js
│   │       │       ├── MenuItemScreen.js
│   │       │       ├── MenuScreen.js
│   │       │       ├── OrderDetailsScreen.js
│   │       │       ├── OrdersScreen.js
│   │       │       └── ProfileScreen.js
│   │       ├── services/   # API and external services
│   │       │   ├── notificationService.js
│   │       │   └── socketService.js
│   │       └── store/      # Redux store configuration
│   │
│   └── delivery/          # Delivery partner mobile app
│       ├── App.js         # Main app component
│       ├── app.json       # Expo configuration
│       └── src/           # App source code
│
├── README.md             # Comprehensive project documentation
├── DOCUMENTATION.md      # Detailed technical documentation
└── AGENT.md             # This file - AI agent guidance
```

## Environment Variables

### Server (.env in server/)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fooddelivery
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_ACCESS_TOKEN=your-expo-access-token
```

## API Architecture

### Base URL
- Development: `http://localhost:5000`
- Production: TBD

### Main Routes
- `/api/auth/*` - Authentication endpoints
- `/api/vendors/*` - Vendor management
- `/api/orders/*` - Order management
- `/health` - Health check endpoint

### Authentication
- JWT tokens in Authorization header: `Bearer <token>`
- Socket.IO auth via `auth.token` in handshake
- Role-based authorization: customer, vendor, delivery
- Optional auth middleware for public endpoints

## Database Schema Details

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

## Real-time Features (Socket.IO)

### Rooms
- `user:<userId>` - Private user rooms
- `role:<role>` - Role-based rooms (role:customer, role:vendor, role:delivery)
- `order:<orderId>` - Order-specific rooms

### Server Events (Emitted to clients)
- `connected` - Connection confirmation
- `order_accepted` - Vendor accepted order
- `order_prepared` - Order ready for pickup
- `new_delivery_available` - Available delivery order
- `order_handed_to_delivery` - Order given to delivery partner
- `order_assigned` - Delivery partner assigned
- `order_out_for_delivery` - Delivery started
- `order_picked_up` - Order picked up
- `delivery_location_update` - Live delivery tracking
- `order_delivered` - Order completed
- `order_completed` - Vendor notification
- `new_order` - New order for vendor
- `order_cancelled` - Order cancellation
- `order_status_update` - General status updates

### Client Events (Received from clients)
- `join_order_room` - Join order-specific room
- `leave_order_room` - Leave order-specific room
- `vendor_online` - Vendor comes online
- `order_accepted` - Vendor accepts order
- `order_prepared` - Order preparation complete
- `order_handed_to_delivery` - Hand to delivery partner
- `delivery_partner_online` - Delivery partner available
- `order_picked_up` - Delivery pickup confirmation
- `delivery_location_update` - Location sharing
- `order_delivered` - Delivery completion
- `order_placed` - Customer places order
- `cancel_order` - Order cancellation
- `typing` - Chat typing indicator
- `send_message` - Order chat messages

## Key Features Implementation

### Authentication System
- JWT token-based authentication
- bcrypt password hashing with salt rounds (12)
- Role-based access control (customer/vendor/delivery)
- Password validation (min 6 characters)
- Email validation with regex
- Optional authentication for public endpoints

### Order Management System
- Complete order lifecycle tracking
- Auto-generated unique order numbers
- Status history with timestamps
- Real-time status updates via Socket.IO
- Delivery address with coordinates
- Pricing breakdown with tax calculation
- Payment method tracking
- Customer rating and review system

### Vendor Management
- Business profile management
- Menu CRUD operations
- Category-based menu organization
- Operating hours management
- Location-based search (2dsphere indexing)
- Revenue and order tracking
- Real-time order notifications

### Real-time Communication
- Socket.IO with JWT authentication
- Room-based messaging
- Live order tracking
- Delivery location updates
- Push notifications via Expo

## Development Workflow

1. **Server Setup**:
   ```bash
   cd server
   npm install
   cp .env.example .env  # Configure environment
   npm run dev
   ```

2. **Mobile App Setup**:
   ```bash
   cd apps/customer  # or vendor/delivery
   npm install --legacy-peer-deps
   npm start
   ```

3. **Testing Flow**:
   - Use test accounts from README.md
   - Test API with Postman/curl
   - Verify real-time features work
   - Check notification functionality

## Code Conventions

### Backend
- Express.js route handlers in `controllers/`
- Mongoose models with proper validation and indexing
- JWT middleware for protected routes with role authorization
- Socket.IO event handlers in `socket/`
- Error handling with development/production modes
- Rate limiting for API protection

### Mobile Apps
- React Native functional components
- Redux Toolkit for state management
- React Navigation v6 for routing
- Expo managed workflow
- Socket.IO client for real-time features
- Expo Notifications for push notifications
- AsyncStorage for local data persistence

### Database Design
- Proper indexing for performance optimization
- Pre-save middleware for data processing
- Virtual fields for computed values
- Reference population for related data
- Input validation with custom error messages

## Common Issues & Solutions

1. **MongoDB Connection**: Ensure MongoDB URI is correct in .env
2. **Socket.IO**: Verify JWT token is passed correctly in handshake
3. **Expo**: Make sure server URL is accessible from mobile device
4. **Maps**: Require valid Google Maps API key
5. **Notifications**: Ensure Expo push token is configured
6. **Version Mismatch**: Update delivery app to match other apps' SDK versions
7. **Legacy Dependencies**: Use `--legacy-peer-deps` for npm install

## Security Features

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS configuration for development/production
- JWT token expiration (7 days)
- Password hashing with bcrypt (12 salt rounds)
- Input validation and sanitization
- Role-based access control
- Environment variable protection

## Performance Optimizations

- Database indexing for frequently queried fields
- Connection pooling with Mongoose
- Rate limiting to prevent abuse
- Efficient Socket.IO room management
- Pagination for large data sets
- Image optimization for menu items
- Lazy loading for mobile app screens

## Deployment Notes

### Backend
- Deploy to Render/Railway/Heroku
- Set production environment variables
- Use `npm start` command
- Configure MongoDB Atlas for production
- Set up proper CORS origins

### Mobile Apps
- Build with `expo build:android` / `expo build:ios`
- Deploy to App Store/Play Store
- Update server URLs for production
- Configure push notification certificates
- Test on physical devices

## Test Accounts (from README.md)
- **Customer**: customer@test.com / password123
- **Vendor**: vendor@test.com / password123  
- **Delivery**: delivery@test.com / password123

## Development Priorities

### Immediate Tasks
1. ⚠️ **Critical**: Update delivery app to Expo SDK 53
2. Implement comprehensive testing suite
3. Add error monitoring and logging
4. Complete "coming soon" features in apps

### Future Enhancements
- Set up CI/CD pipeline
- Add performance monitoring
- Implement analytics tracking
- Add payment gateway integration
- Implement chat system between users
- Add advanced search and filtering
- Implement loyalty/rewards system
- Add multi-language support

## Debugging Guide

### Server Issues
- Check MongoDB connection: `MongoDB Connected: <host>` in logs
- Verify JWT_SECRET in environment variables
- Check API endpoints with `/health` route
- Monitor Socket.IO connections in server logs

### Mobile App Issues
- Check network connectivity to server
- Verify Expo SDK compatibility
- Test on physical device for location/notifications
- Check Redux DevTools for state management
- Verify API base URL configuration

### Common Error Patterns
- 401 Unauthorized: Check JWT token format and expiration
- 403 Forbidden: Verify user role permissions
- 500 Internal Server Error: Check server logs and database connection
- Socket connection failed: Verify auth token in handshake
- Expo build failed: Check SDK version compatibility

This documentation provides comprehensive guidance for AI agents working on this food delivery platform project.
