# Project Documentation

## 1. Project Overview

This project is a comprehensive system composed of a central server and three client applications: Customer, Delivery, and Vendor. It appears to be a food delivery or a similar on-demand service platform.

The architecture follows a microservices-like pattern, with a Node.js backend powered by Express.js, and what appears to be three separate client applications, likely built with a framework like React Native for mobile.

### 1.1. Components

*   **Server**: A Node.js application that handles business logic, API requests, database management, and real-time communication via WebSockets.
*   **Customer App**: The client-facing application for users to browse, order, and track their purchases.
*   **Vendor App**: An application for businesses or vendors to manage their products, orders, and interactions with customers.
*   **Delivery App**: An application for delivery personnel to manage and fulfill delivery tasks.

## 2. Server-side Documentation

The server is a Node.js application using the Express.js framework, with MongoDB as the database (managed via Mongoose), and Socket.IO for real-time features.

### 2.1. API Endpoints

The API is structured into three main resources: `auth`, `orders`, and `vendors`.

#### 2.1.1. Authentication (`/api/auth`)

*   **POST /api/auth/register**: Register a new user.
*   **POST /api/auth/login**: Log in an existing user.
*   **GET /api/auth/me**: Get the profile of the currently authenticated user. (Protected)
*   **PUT /api/auth/profile**: Update the profile of the currently authenticated user. (Protected)
*   **PUT /api/auth/password**: Change the password of the currently authenticated user. (Protected)
*   **POST /api/auth/logout**: Log out the currently authenticated user. (Protected)

#### 2.1.2. Orders (`/api/orders`)

*   **POST /**: Create a new order. (Protected, Customer role required)
*   **GET /customer/:userId**: Get all orders for a specific customer. (Protected, Customer role required)
*   **GET /vendor/:vendorId**: Get all orders for a specific vendor. (Protected, Vendor role required)
*   **PUT /:orderId/status**: Update the status of an order. (Protected, Vendor or Delivery role required)
*   **PUT /:orderId/assign**: Assign a delivery partner to an order. (Protected, Vendor or Delivery role required)
*   **GET /delivery/available**: Get all available orders for delivery. (Protected, Delivery role required)
*   **GET /delivery/:userId**: Get all orders for a specific delivery partner. (Protected, Delivery role required)

#### 2.1.3. Vendors (`/api/vendors`)

*   **GET /**: Get a list of all vendors.
*   **GET /:id**: Get a specific vendor by ID.
*   **GET /:id/menu**: Get the menu for a specific vendor.
*   **POST /:id/menu**: Add a new item to a vendor's menu. (Protected, Vendor role required)
*   **PUT /:id/menu/:itemId**: Update an existing item on a vendor's menu. (Protected, Vendor role required)
*   **DELETE /:id/menu/:itemId**: Delete an item from a vendor's menu. (Protected, Vendor role required)
*   **PUT /profile**: Update the profile of the currently authenticated vendor. (Protected, Vendor role required)

### 2.2. Database Schema

The database consists of three main collections: `users`, `orders`, and `vendors`.

#### 2.2.1. User Schema (`User`)

*   `name`: The user's full name.
*   `email`: The user's unique email address.
*   `passwordHash`: The user's hashed password.
*   `role`: The user's role in the system (`customer`, `vendor`, or `delivery`).
*   `phone`: The user's 10-digit phone number.
*   `address`: The user's physical address, including coordinates.
*   `fcmToken`: Firebase Cloud Messaging token for push notifications.
*   `isActive`: A boolean indicating if the user's account is active.
*   `lastLogin`: The timestamp of the user's last login.

#### 2.2.2. Order Schema (`Order`)

*   `orderNumber`: A unique identifier for the order.
*   `customerId`: The ID of the customer who placed the order.
*   `vendorId`: The ID of the vendor fulfilling the order.
*   `items`: An array of items included in the order.
*   `status`: The current status of the order (e.g., `Pending`, `Delivered`).
*   `assignedTo`: The ID of the delivery partner assigned to the order.
*   `deliveryAddress`: The address where the order will be delivered.
*   `pricing`: An object containing the subtotal, delivery fee, tax, discount, and total price.
*   `paymentMethod`: The method of payment (e.g., `cash`, `card`).
*   `paymentStatus`: The status of the payment (e.g., `pending`, `paid`).
*   `estimatedDeliveryTime`: The estimated time of delivery.
*   `actualDeliveryTime`: The actual time of delivery.
*   `statusHistory`: A log of all status changes for the order.
*   `rating`: Customer feedback on the food, delivery, and overall experience.
*   `cancellationReason`: The reason for a cancelled order.
*   `refundAmount`: The amount refunded for a cancelled order.

#### 2.2.3. Vendor Schema (`Vendor`)

*   `userId`: The ID of the user who owns the vendor account.
*   `businessName`: The name of the vendor's business.
*   `category`: The type of business (e.g., `restaurant`, `cafe`).
*   `cuisineType`: The type of cuisine offered by the vendor.
*   `description`: A brief description of the vendor.
*   `location`: The vendor's physical location.
*   `menu`: An array of menu items offered by the vendor.
*   `rating`: The vendor's average rating and the number of reviews.
*   `deliveryFee`: The fee for delivering an order from this vendor.
*   `minimumOrder`: The minimum order amount.
*   `estimatedDeliveryTime`: The estimated time for delivery.
*   `isOpen`: A boolean indicating if the vendor is currently open.
*   `operatingHours`: The vendor's hours of operation for each day of the week.
*   `totalOrders`: The total number of orders fulfilled by the vendor.
*   `totalRevenue`: The total revenue generated by the vendor.

### 2.3. Real-time Events (Socket.IO)

The server uses Socket.IO for real-time communication between the clients and the server. All socket connections are authenticated using a JWT token.

#### 2.3.1. Rooms

*   `user:<userId>`: A private room for each user.
*   `role:<role>`: A room for all users with a specific role (e.g., `role:delivery`).
*   `order:<orderId>`: A room for all parties involved in a specific order.

#### 2.3.2. Server-emitted Events

*   `connected`: Sent to the client upon successful connection.
*   `order_accepted`: Notifies a customer that their order has been accepted.
*   `order_prepared`: Notifies a customer that their order is ready for pickup.
*   `new_delivery_available`: Notifies all delivery partners of a new delivery opportunity.
*   `order_handed_to_delivery`: Notifies a customer that their order has been given to a delivery partner.
*   `order_assigned`: Notifies a delivery partner that they have been assigned an order.
*   `order_out_for_delivery`: Notifies a customer that their order is on its way.
*   `order_picked_up`: Notifies a vendor that an order has been picked up.
*   `delivery_location_update`: Sends the delivery partner's live location to the customer.
*   `order_delivered`: Notifies the customer that their order has been delivered.
*   `order_completed`: Notifies the vendor that an order has been completed.
*   `new_order`: Notifies a vendor of a new incoming order.
*   `order_cancelled`: Notifies a vendor that an order has been cancelled.
*   `order_status_update`: Sent to the order room to notify all parties of a status change.

#### 2.3.3. Client-emitted Events

*   `join_order_room`: Allows a user to join an order-specific room.
*   `leave_order_room`: Allows a user to leave an order-specific room.
*   `vendor_online`: Sent by a vendor when they come online.
*   `order_accepted`: Sent by a vendor to accept an order.
*   `order_prepared`: Sent by a vendor when an order is ready.
*   `order_handed_to_delivery`: Sent by a vendor when an order is handed to a delivery partner.
*   `delivery_partner_online`: Sent by a delivery partner when they come online.
*   `order_picked_up`: Sent by a delivery partner when they pick up an order.
*   `delivery_location_update`: Sent by a delivery partner to update their location.
*   `order_delivered`: Sent by a delivery partner when an order is delivered.
*   `order_placed`: Sent by a customer when they place a new order.
*   `cancel_order`: Sent by a customer to cancel an order.
*   `typing`: Indicates that a user is typing a message in the order chat.
*   `send_message`: Sends a message to the order chat.

### 2.4. Authentication

Authentication is handled using JSON Web Tokens (JWT). When a user logs in, a token is generated and must be included in the `Authorization` header of all protected API requests as a Bearer token.

For real-time communication, the JWT token is passed in the `auth.token` field of the socket handshake.

### 2.5. Environment Variables

The following environment variables are required for the server to run correctly. These should be placed in a `.env` file in the `server/` directory.

*   `MONGODB_URI`: The connection string for the MongoDB database.
*   `JWT_SECRET`: A secret key for signing JWT tokens.
*   `JWT_EXPIRE`: The expiration time for JWT tokens (e.g., `7d`).
*   `PORT`: The port on which the server will run.
*   `NODE_ENV`: The environment in which the server is running (e.g., `development`, `production`).
*   `GOOGLE_MAPS_API_KEY`: Your Google Maps API key.
*   `EXPO_ACCESS_TOKEN`: Your Expo push notification access token.

## 3. Client-side Documentation

There are three client applications in this project, located in the `apps/` directory.

### 3.1. Customer App (`apps/customer`)

*   **Purpose**: Allows customers to interact with the service.
*   **Key Features**: (To be determined)

### 3.2. Vendor App (`apps/vendor`)

*   **Purpose**: Allows vendors to manage their side of the service.
*   **Key Features**: (To be determined)

### 3.3. Delivery App (`apps/delivery`)

*   **Purpose**: Allows delivery personnel to manage deliveries.
*   **Key Features**: (To be determined)

## 4. Setup and Installation

To set up and run the project locally, follow these steps:

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    ```

2.  **Install server dependencies**:

    ```bash
    cd server
    npm install
    ```

3.  **Set up environment variables**:

    *   Create a `.env` file in the `server/` directory.
    *   Copy the contents of `.env.example` (if it exists) or use the environment variables listed in section 2.5 of this documentation.

4.  **Start the server**:

    ```bash
    npm start
    ```

5.  **Install client dependencies**:

    *   Navigate to each client directory (`apps/customer`, `apps/vendor`, `apps/delivery`) and run:

        ```bash
        npm install
        ```

6.  **Run the client applications**:

    *   In each client directory, run:

        ```bash
        npm start
        ```
