# Complete System Test Guide

## Overview
This guide provides step-by-step instructions to test the complete food delivery system with real-time features.

## Prerequisites
1. **Server Running**: Backend server must be running on `http://192.168.5.110:5000`
2. **MongoDB Connected**: Database connection established
3. **Mobile Apps**: Both customer and vendor apps running on Expo Go
4. **Test Accounts**: Use existing test accounts or create new ones

## Test Scenarios

### 1. Authentication Flow Test

#### Customer App Authentication
1. **Sign Up Test**:
   - Open customer app
   - Navigate to Sign Up screen
   - Fill in required fields:
     - Name: "Test Customer"
     - Email: "customer-new@test.com"
     - Phone: "1234567890"
     - Password: "password123"
     - Address fields with street, city, state, zip
   - Submit form
   - Verify success message and automatic login

2. **Login Test**:
   - Use existing account: `customer@test.com` / `password123`
   - Verify JWT token storage
   - Verify Socket.IO connection established

#### Vendor App Authentication
1. **Login Test**:
   - Use existing account: `vendor@test.com` / `password123`
   - Verify vendor profile loads
   - Verify menu items display
   - Verify Socket.IO connection established

### 2. Vendor Management Flow Test

#### Menu Management
1. **Add New Menu Item**:
   - Navigate to Menu screen in vendor app
   - Tap "Add Item" button
   - Fill in item details:
     - Name: "Test Pizza"
     - Description: "Delicious test pizza"
     - Price: "15.99"
     - Category: "Main Course"
     - Preparation Time: "20"
     - Set as vegetarian
     - Select spice level
   - Add image (from gallery or camera)
   - Submit form
   - Verify item appears in menu list
   - **Real-time Test**: Check if new item appears in customer app immediately

2. **Edit Menu Item**:
   - Select existing menu item
   - Edit details (change price, description)
   - Update image
   - Save changes
   - **Real-time Test**: Verify changes reflect in customer app

3. **Toggle Item Availability**:
   - Toggle availability switch on menu item
   - **Real-time Test**: Verify item becomes unavailable/available in customer app

#### Vendor Profile Management
1. **Update Business Information**:
   - Navigate to Profile screen
   - Update business name, description
   - Change operating hours
   - Update delivery fee and minimum order
   - Save changes

2. **Upload Vendor Logo**:
   - Tap on profile image placeholder
   - Select image from gallery/camera
   - Verify upload success
   - **Real-time Test**: Check if logo updates in customer app vendor list

### 3. Customer Ordering Flow Test

#### Browse and Search
1. **Home Screen Test**:
   - Verify vendor list loads with images
   - Test search functionality
   - Filter by categories
   - Check vendor ratings and delivery info

2. **Vendor Details Test**:
   - Select a vendor
   - Verify menu loads with images
   - Check item details (price, description, preparation time)
   - Verify only available items are shown

#### Cart and Checkout
1. **Add Items to Cart**:
   - Add multiple items to cart
   - Adjust quantities using +/- buttons
   - Add special instructions
   - Verify cart total calculations

2. **Address Management**:
   - Add/edit delivery address
   - Verify all required fields are validated
   - Ensure coordinates are automatically added

3. **Payment Method Selection**:
   - Test all payment methods (Cash, Card, UPI)
   - Verify selection persistence

4. **Place Order**:
   - Complete checkout process
   - Verify order validation (minimum order, address, etc.)
   - Confirm order placement success
   - Note the order number

### 4. Real-time Order Management Test

#### Vendor Order Processing
1. **New Order Notification**:
   - After placing order from customer app
   - Verify vendor app receives real-time notification
   - Check order appears in Orders screen
   - Verify all order details are correct

2. **Order Status Updates**:
   - **Accept Order**: Tap "Accept" on new order
     - Verify customer receives real-time update
     - Check status changes to "Accepted"
   
   - **Mark as Prepared**: Change status to "Prepared"
     - Verify customer receives notification
     - Check estimated time updates
   
   - **Hand to Delivery**: Update to "Handed to Delivery"
     - Verify status propagates to customer app
   
   - **Out for Delivery**: Update to "Out for Delivery"
     - Test real-time tracking updates
   
   - **Mark as Delivered**: Final status update
     - Verify completion in both apps
     - Check order moves to history

#### Customer Order Tracking
1. **Real-time Status Updates**:
   - Monitor order tracking screen
   - Verify status updates appear instantly
   - Check notification messages
   - Test order timeline visualization

2. **Order History**:
   - Navigate to order history
   - Verify all past orders are listed
   - Check order details are preserved
   - Test filtering by status

### 5. Image Handling Test

#### Menu Item Images
1. **Upload Test**:
   - Add new menu item with image
   - Verify image uploads to MongoDB as Buffer
   - Check image displays correctly in customer app

2. **Update Test**:
   - Edit menu item and change image
   - Verify old image is replaced
   - Test image caching and loading

#### Vendor Logos
1. **Profile Image Upload**:
   - Upload vendor profile image
   - Verify storage in MongoDB
   - Check display in customer app vendor list

### 6. Socket.IO Real-time Features Test

#### Connection Verification
1. **Authentication Test**:
   - Login to both apps
   - Verify socket connections with JWT tokens
   - Check user-specific rooms are joined

2. **Room Management**:
   - Place order and verify both parties join order room
   - Test order-specific communications

#### Event Broadcasting
1. **Menu Updates**:
   - Add/edit menu items in vendor app
   - Verify instant updates in customer app
   - Test multiple customers receiving updates

2. **Order Status Changes**:
   - Process order through all stages
   - Verify real-time updates in customer app
   - Test notification delivery

3. **Vendor Status Updates**:
   - Toggle vendor online/offline status
   - Verify customer app updates vendor availability

### 7. Error Handling and Edge Cases

#### Network Issues
1. **Offline Behavior**:
   - Disconnect internet during order placement
   - Verify appropriate error messages
   - Test reconnection handling

2. **Server Downtime**:
   - Stop server temporarily
   - Verify graceful error handling
   - Test automatic reconnection

#### Validation Tests
1. **Form Validation**:
   - Submit forms with missing required fields
   - Test invalid data inputs (negative prices, etc.)
   - Verify proper error messages

2. **Authentication Edge Cases**:
   - Test expired JWT tokens
   - Verify automatic logout on auth errors
   - Test socket disconnection on auth failure

### 8. Performance Test

#### Load Testing
1. **Multiple Concurrent Orders**:
   - Place multiple orders simultaneously
   - Verify all orders are processed correctly
   - Check real-time updates don't conflict

2. **Image Loading**:
   - Test menu with many images
   - Verify loading performance
   - Check image caching efficiency

#### Memory and Storage
1. **MongoDB Storage**:
   - Verify images are stored as Buffer data
   - Check storage efficiency
   - Test image retrieval performance

## Expected Results

### ✅ Success Criteria
- [ ] All authentication flows work without errors
- [ ] Menu management with images functions correctly
- [ ] Orders can be placed and processed end-to-end
- [ ] Real-time updates work instantly across all apps
- [ ] Socket.IO connections are stable and authenticated
- [ ] Images upload and display correctly
- [ ] Error handling is graceful and informative
- [ ] All validation rules are enforced
- [ ] Performance is acceptable for production use

### 🔧 Common Issues and Solutions

1. **Socket Connection Failed**:
   - Verify server is running
   - Check JWT token is valid
   - Confirm IP address is correct in API configuration

2. **Image Upload Fails**:
   - Check device permissions for camera/gallery
   - Verify server has multer middleware configured
   - Confirm MongoDB connection is stable

3. **Order Validation Error**:
   - Ensure delivery address has coordinates
   - Verify all required fields are filled
   - Check minimum order requirements

4. **Real-time Updates Not Working**:
   - Verify Socket.IO connection is established
   - Check user is in correct rooms
   - Confirm event names match between client and server

## Test Results Documentation

### Test Execution Log
Date: ___________
Tester: ___________

| Test Case | Status | Notes |
|-----------|---------|-------|
| Customer Authentication | ⭕ Pass / ❌ Fail | |
| Vendor Authentication | ⭕ Pass / ❌ Fail | |
| Menu Management | ⭕ Pass / ❌ Fail | |
| Image Upload | ⭕ Pass / ❌ Fail | |
| Order Placement | ⭕ Pass / ❌ Fail | |
| Real-time Updates | ⭕ Pass / ❌ Fail | |
| Order Processing | ⭕ Pass / ❌ Fail | |
| Socket.IO Features | ⭕ Pass / ❌ Fail | |
| Error Handling | ⭕ Pass / ❌ Fail | |
| Performance | ⭕ Pass / ❌ Fail | |

### Overall System Status
- [ ] **Ready for Production** - All tests pass
- [ ] **Needs Minor Fixes** - Some non-critical issues
- [ ] **Needs Major Work** - Critical issues found

### Deployment Readiness Checklist
- [ ] All core features working
- [ ] Real-time functionality tested
- [ ] Image handling verified
- [ ] Authentication secure
- [ ] Error handling implemented
- [ ] Performance acceptable
- [ ] Documentation complete
