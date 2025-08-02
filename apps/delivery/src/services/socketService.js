import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'http://192.168.5.110:5000'; // Update this to your server URL

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      if (!token || !user) {
        console.log('🔴 No token or user found, cannot connect to socket');
        return;
      }

      const userData = JSON.parse(user);

      this.socket = io(SERVER_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('🟢 Socket connected for delivery partner:', userData.name);
        this.isConnected = true;
        
        // Join delivery partner role room
        this.socket.emit('join_role_room', 'delivery');
        
        // Announce delivery partner is online
        this.socket.emit('delivery_partner_online', {
          deliveryPartnerId: userData._id,
          name: userData.name
        });
      });

      this.socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔴 Socket connection error:', error);
        this.isConnected = false;
      });

      // Listen for generic events
      this.socket.on('error', (error) => {
        console.error('🔴 Socket error:', error);
      });

    } catch (error) {
      console.error('🔴 Failed to connect socket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔴 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback = null) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn('🔴 Socket not connected, cannot emit:', event);
    }
  }

  joinOrderRoom(orderId) {
    this.emit('join_order_room', orderId);
  }

  leaveOrderRoom(orderId) {
    this.emit('leave_order_room', orderId);
  }
}

export const socketService = new SocketService();
