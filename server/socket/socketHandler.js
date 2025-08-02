const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`👤 User connected: ${socket.user.name} (${socket.user.role})`);

    // Join user to their personal room
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);

    // Join role-based rooms
    socket.join(`role:${socket.user.role}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Food Delivery Platform',
      user: socket.user,
      timestamp: new Date()
    });

    // Handle order-related events
    socket.on('join_order_room', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`📦 User ${socket.user.name} joined order room: ${orderId}`);
    });

    socket.on('leave_order_room', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`📦 User ${socket.user.name} left order room: ${orderId}`);
    });

    // Vendor-specific events
    if (socket.user.role === 'vendor') {
      socket.on('vendor_online', () => {
        socket.broadcast.emit('vendor_status_changed', {
          vendorId: socket.user.id,
          status: 'online',
          timestamp: new Date()
        });
      });

      socket.on('order_accepted', (data) => {
        const { orderId, customerId, estimatedTime } = data;

        // Notify customer
        io.to(`user:${customerId}`).emit('order_accepted', {
          orderId,
          message: 'Your order has been accepted!',
          estimatedTime,
          timestamp: new Date()
        });

        // Notify order room
        io.to(`order:${orderId}`).emit('order_status_update', {
          orderId,
          status: 'Accepted',
          timestamp: new Date()
        });
      });

      socket.on('order_prepared', (data) => {
        const { orderId, customerId } = data;

        // Notify customer
        io.to(`user:${customerId}`).emit('order_prepared', {
          orderId,
          message: 'Your order is ready!',
          timestamp: new Date()
        });

        // Notify delivery partners about available order
        io.to('role:delivery').emit('new_delivery_available', {
          orderId,
          message: 'New delivery order available',
          timestamp: new Date()
        });
      });

      socket.on('order_handed_to_delivery', (data) => {
        const { orderId, customerId, deliveryPartnerId } = data;

        // Notify customer
        io.to(`user:${customerId}`).emit('order_handed_to_delivery', {
          orderId,
          message: 'Your order has been handed to delivery partner',
          timestamp: new Date()
        });

        // Notify delivery partner
        if (deliveryPartnerId) {
          io.to(`user:${deliveryPartnerId}`).emit('order_assigned', {
            orderId,
            message: 'New delivery order assigned to you',
            timestamp: new Date()
          });
        }
      });

      // Menu update events
      socket.on('menu_item_added', (data) => {
        const { vendorId, menuItem } = data;
        console.log(`📋 Menu item added by vendor ${socket.user.name}`);
        
        // Broadcast to all customers
        io.to('role:customer').emit('vendor_menu_updated', {
          vendorId,
          action: 'added',
          menuItem,
          timestamp: new Date()
        });
      });

      socket.on('menu_item_updated', (data) => {
        const { vendorId, menuItem } = data;
        console.log(`📋 Menu item updated by vendor ${socket.user.name}`);
        
        // Broadcast to all customers
        io.to('role:customer').emit('vendor_menu_updated', {
          vendorId,
          action: 'updated',
          menuItem,
          timestamp: new Date()
        });
      });

      socket.on('menu_item_deleted', (data) => {
        const { vendorId, menuItemId } = data;
        console.log(`📋 Menu item deleted by vendor ${socket.user.name}`);
        
        // Broadcast to all customers
        io.to('role:customer').emit('vendor_menu_updated', {
          vendorId,
          action: 'deleted',
          menuItemId,
          timestamp: new Date()
        });
      });

      socket.on('menu_item_availability_changed', (data) => {
        const { vendorId, menuItemId, isAvailable } = data;
        console.log(`📋 Menu item availability changed by vendor ${socket.user.name}`);
        
        // Broadcast to all customers
        io.to('role:customer').emit('vendor_menu_updated', {
          vendorId,
          action: 'availability_changed',
          menuItemId,
          isAvailable,
          timestamp: new Date()
        });
      });

      socket.on('vendor_status_updated', (data) => {
        const { vendorId, isOpen, status } = data;
        console.log(`🏪 Vendor status updated: ${status}`);
        
        // Broadcast to all customers
        io.to('role:customer').emit('vendor_status_changed', {
          vendorId,
          isOpen,
          status,
          timestamp: new Date()
        });
      });
    }

    // Delivery partner specific events
    if (socket.user.role === 'delivery') {
      socket.on('delivery_partner_online', () => {
        socket.broadcast.to('role:vendor').emit('delivery_partner_available', {
          deliveryPartnerId: socket.user.id,
          name: socket.user.name,
          timestamp: new Date()
        });
      });

      socket.on('order_picked_up', (data) => {
        const { orderId, customerId, vendorId } = data;

        // Notify customer
        io.to(`user:${customerId}`).emit('order_out_for_delivery', {
          orderId,
          message: 'Your order is out for delivery!',
          timestamp: new Date()
        });

        // Notify vendor
        io.to(`user:${vendorId}`).emit('order_picked_up', {
          orderId,
          message: 'Order has been picked up by delivery partner',
          timestamp: new Date()
        });
      });

      socket.on('delivery_location_update', (data) => {
        const { orderId, customerId, location } = data;

        // Send live location to customer
        io.to(`user:${customerId}`).emit('delivery_location_update', {
          orderId,
          location,
          timestamp: new Date()
        });
      });

      socket.on('order_delivered', (data) => {
        const { orderId, customerId, vendorId } = data;

        // Notify customer
        io.to(`user:${customerId}`).emit('order_delivered', {
          orderId,
          message: 'Your order has been delivered! Enjoy your meal!',
          timestamp: new Date()
        });

        // Notify vendor
        io.to(`user:${vendorId}`).emit('order_completed', {
          orderId,
          message: 'Order has been successfully delivered',
          timestamp: new Date()
        });

        // Update order room
        io.to(`order:${orderId}`).emit('order_status_update', {
          orderId,
          status: 'Delivered',
          timestamp: new Date()
        });
      });
    }

    // Customer-specific events
    if (socket.user.role === 'customer') {
      socket.on('order_placed', (data) => {
        const { orderId, vendorId } = data;

        // Join order room for real-time updates
        socket.join(`order:${orderId}`);

        // Notify vendor
        io.to(`user:${vendorId}`).emit('new_order', {
          orderId,
          message: 'New order received!',
          customer: socket.user.name,
          timestamp: new Date()
        });
      });

      socket.on('cancel_order', (data) => {
        const { orderId, vendorId, reason } = data;

        // Notify vendor
        io.to(`user:${vendorId}`).emit('order_cancelled', {
          orderId,
          reason,
          message: 'Order has been cancelled by customer',
          timestamp: new Date()
        });

        // Update order room
        io.to(`order:${orderId}`).emit('order_status_update', {
          orderId,
          status: 'Cancelled',
          reason,
          timestamp: new Date()
        });
      });
    }

    // Generic events for all users
    socket.on('typing', (data) => {
      socket.broadcast.to(`order:${data.orderId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: data.isTyping
      });
    });

    socket.on('send_message', (data) => {
      const { orderId, message } = data;

      io.to(`order:${orderId}`).emit('new_message', {
        orderId,
        message,
        sender: {
          id: socket.user.id,
          name: socket.user.name,
          role: socket.user.role
        },
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`👤 User disconnected: ${socket.user.name} (${reason})`);

      // Notify role-based rooms about user going offline
      if (socket.user.role === 'vendor') {
        socket.broadcast.emit('vendor_status_changed', {
          vendorId: socket.user.id,
          status: 'offline',
          timestamp: new Date()
        });
      } else if (socket.user.role === 'delivery') {
        socket.broadcast.to('role:vendor').emit('delivery_partner_unavailable', {
          deliveryPartnerId: socket.user.id,
          name: socket.user.name,
          timestamp: new Date()
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
    });
  });

  // Global events
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  console.log('🔌 Socket.IO server initialized');
};

module.exports = socketHandler;
