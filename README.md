# Food Delivery Platform

A complete food delivery platform built with React Native (Expo) for mobile apps and Node.js/Express for the backend.

## 🏗️ Architecture

- **Backend**: Node.js + Express + MongoDB + Socket.IO
- **Frontend**: 3 React Native (Expo) apps
  - Customer App
  - Vendor App  
  - Delivery Partner App
- **Real-time**: Socket.IO for live order updates
- **Authentication**: JWT + bcrypt
- **State Management**: Redux Toolkit
- **Database**: MongoDB Atlas with Mongoose
- **Push Notifications**: Expo + Firebase Cloud Messaging

## 📱 Apps Overview

### 1. Customer App
- Browse restaurants/vendors
- View menus and add items to cart
- Place orders with real-time tracking
- Live order status updates
- Order history
- Push notifications

### 2. Vendor App
- Manage restaurant profile
- CRUD operations for menu items
- View and manage incoming orders
- Update order status (Pending → Accepted → Prepared → Handed to Delivery)
- Real-time order notifications
- Earnings dashboard

### 3. Delivery Partner App
- View available delivery orders
- Accept orders and navigate with Google Maps
- Update delivery status (Out for Delivery → Delivered)
- Track earnings and delivery history
- Real-time location sharing

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Expo CLI (`npm install -g expo-cli`)
- Google Maps API key
- Expo account (for push notifications)

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your values:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fooddelivery
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   PORT=5000
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   EXPO_ACCESS_TOKEN=your-expo-access-token
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Mobile Apps Setup

For each app (customer, vendor, delivery):

1. **Navigate to app directory**
   ```bash
   cd apps/customer  # or vendor, delivery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Expo development server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on device/simulator**
   - Download Expo Go app on your phone
   - Scan QR code to run app
   - Or press 'i' for iOS simulator, 'a' for Android emulator

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  role: "customer" | "vendor" | "delivery",
  phone: String,
  address: Object,
  fcmToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Vendors Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  businessName: String,
  category: String,
  location: Object,
  menu: [{
    name: String,
    price: Number,
    description: String,
    category: String,
    isAvailable: Boolean
  }],
  rating: { average: Number, count: Number },
  deliveryFee: Number,
  minimumOrder: Number,
  isOpen: Boolean
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  customerId: ObjectId (ref: User),
  vendorId: ObjectId (ref: Vendor),
  items: [{ name, price, quantity }],
  status: "Pending" | "Accepted" | "Prepared" | "Handed to Delivery" | "Out for Delivery" | "Delivered",
  assignedTo: ObjectId (ref: User),
  deliveryAddress: Object,
  pricing: { subtotal, deliveryFee, tax, total },
  paymentMethod: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  createdAt: Date
}
```

## 🔧 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register user
- `POST /login` - Login user  
- `GET /me` - Get current user
- `PUT /profile` - Update profile
- `POST /logout` - Logout user

### Vendors (`/api/vendors`)
- `GET /` - Get all vendors
- `GET /:id` - Get vendor details
- `GET /:id/menu` - Get vendor menu
- `POST /:id/menu` - Add menu item (vendor only)
- `PUT /:id/menu/:itemId` - Update menu item (vendor only)
- `DELETE /:id/menu/:itemId` - Delete menu item (vendor only)

### Orders (`/api/orders`)
- `POST /` - Create order (customer only)
- `GET /customer/:userId` - Get customer orders
- `GET /vendor/:vendorId` - Get vendor orders
- `PUT /:orderId/status` - Update order status
- `PUT /:orderId/assign` - Assign delivery partner
- `GET /delivery/available` - Get available delivery orders
- `GET /delivery/:userId` - Get delivery partner orders

## 🔄 Real-time Events (Socket.IO)

### Customer Events
- `order_placed` - When customer places order
- `order_status_updated` - Order status changes
- `order_accepted` - Vendor accepts order
- `order_prepared` - Order ready for pickup
- `order_out_for_delivery` - Delivery started
- `order_delivered` - Order delivered

### Vendor Events
- `new_order` - New order received
- `order_cancelled` - Customer cancelled order

### Delivery Events
- `new_delivery_available` - Order ready for pickup
- `order_assigned` - Order assigned to delivery partner
- `delivery_location_update` - Live location updates

## 🌐 Deployment

### Backend Deployment (Render/Railway)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Render**
   - Connect GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables from `.env`

3. **Deploy to Railway**
   - Connect GitHub repository
   - Add environment variables
   - Deploy automatically on push

### Mobile App Deployment

1. **Build for production**
   ```bash
   expo build:android  # For Android
   expo build:ios      # For iOS
   ```

2. **Publish to App Stores**
   - Google Play Store (Android)
   - Apple App Store (iOS)

## 🧪 Testing

### API Testing with Postman/curl

```bash
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

# Get vendors
curl -X GET http://localhost:5000/api/vendors
```

### Sample Test Data

Use these credentials for testing:

**Customer Account:**
- Email: `customer@test.com`
- Password: `password123`

**Vendor Account:**
- Email: `vendor@test.com`  
- Password: `password123`

**Delivery Account:**
- Email: `delivery@test.com`
- Password: `password123`

## 📝 Development Notes

### File Structure
```
project-root/
├── server/                 # Backend API
│   ├── models/            # Mongoose schemas
│   ├── controllers/       # Route handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Auth middleware
│   └── socket/           # Socket.IO handlers
│
├── apps/
│   ├── customer/         # Customer React Native app
│   ├── vendor/          # Vendor React Native app
│   └── delivery/        # Delivery React Native app
```

### Key Features Implemented
- ✅ JWT Authentication
- ✅ Real-time Socket.IO communication
- ✅ Redux Toolkit state management
- ✅ MongoDB with Mongoose ODM
- ✅ Push notifications setup
- ✅ Google Maps integration
- ✅ Order flow management
- ✅ File upload handling
- ✅ Error handling & validation

### Environment Variables Required
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_MAPS_API_KEY` - For maps and directions
- `EXPO_ACCESS_TOKEN` - For push notifications

## 🤝 Support

For issues and questions:
1. Check the API endpoints are running
2. Verify environment variables are set
3. Ensure MongoDB connection is working
4. Check mobile app can connect to backend

## 📄 License

This project is licensed under the MIT License.
#   D e l i v e r y - S y s t e m  
 