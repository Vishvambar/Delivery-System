import { io } from 'socket.io-client';

const SOCKET_URL = __DEV__ 
  ? 'http://192.168.5.110:5000'  // Development - Use computer's IP
  : 'https://your-backend-url.com';  // Production

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    console.log('🔌 Connecting to socket...');

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });

    // Listen for auth errors
    this.socket.on('auth_error', (error) => {
      console.error('🔌 Socket auth error:', error);
      this.disconnect();
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // Order-related socket events
  joinOrderRoom(orderId) {
    if (this.socket?.connected) {
      this.socket.emit('join_order_room', orderId);
    }
  }

  leaveOrderRoom(orderId) {
    if (this.socket?.connected) {
      this.socket.emit('leave_order_room', orderId);
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);

      // Store callback for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);

      // Remove from stored callbacks
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Emit events
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('🔌 Socket not connected, cannot emit:', event);
    }
  }

  // Vendor-specific events
  goOnline() {
    this.emit('vendor_online');
  }

  acceptOrder(orderData) {
    this.emit('order_accepted', orderData);
  }

  orderPrepared(orderData) {
    this.emit('order_prepared', orderData);
  }

  handToDelivery(orderData) {
    this.emit('order_handed_to_delivery', orderData);
  }

  // Menu update events
  menuItemAdded(vendorId, menuItem) {
    console.log('🔌 Emitting menu_item_added');
    this.emit('menu_item_added', { vendorId, menuItem });
  }

  menuItemUpdated(vendorId, menuItem) {
    console.log('🔌 Emitting menu_item_updated');
    this.emit('menu_item_updated', { vendorId, menuItem });
  }

  menuItemDeleted(vendorId, menuItemId) {
    console.log('🔌 Emitting menu_item_deleted');
    this.emit('menu_item_deleted', { vendorId, menuItemId });
  }

  menuItemAvailabilityChanged(vendorId, menuItemId, isAvailable) {
    console.log('🔌 Emitting menu_item_availability_changed');
    this.emit('menu_item_availability_changed', { vendorId, menuItemId, isAvailable });
  }

  vendorStatusUpdated(vendorId, isOpen, status) {
    console.log('🔌 Emitting vendor_status_updated');
    this.emit('vendor_status_updated', { vendorId, isOpen, status });
  }
}

export const socketService = new SocketService();
