import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from './apiService';

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  async initialize() {
    try {
      // Check if running in Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo) {
        console.log('📱 Running in Expo Go - Push notifications are limited');
        console.log('ℹ️  For full push notification support, use a development build');
        // Only set up local notifications in Expo Go
        await this.setupLocalNotifications();
        return;
      }

      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return;
      }

      // Only try to get push token in development builds
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        this.expoPushToken = token.data;
        console.log('📱 Expo Push Token:', this.expoPushToken);

        // Send token to backend
        await this.updatePushToken(this.expoPushToken);
      } catch (tokenError) {
        console.log('📱 Push token not available in this environment');
      }

      await this.setupLocalNotifications();

    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  }

  async setupLocalNotifications() {
    try {
      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      console.log('📱 Local notifications configured');
    } catch (error) {
      console.error('Failed to setup local notifications:', error);
    }
  }

  async updatePushToken(token) {
    try {
      await apiService.put('/auth/profile', { fcmToken: token });
      console.log('📱 Push token updated on server');
    } catch (error) {
      console.error('Failed to update push token:', error);
    }
  }

  async scheduleLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  // Vendor-specific notifications
  newOrderNotification(orderNumber) {
    this.scheduleLocalNotification(
      '🔔 New Order!',
      `You have received order #${orderNumber}`,
      { type: 'new_order', orderNumber }
    );
  }

  orderCancelledNotification(orderNumber) {
    this.scheduleLocalNotification(
      '❌ Order Cancelled',
      `Order #${orderNumber} has been cancelled by customer`,
      { type: 'order_cancelled', orderNumber }
    );
  }

  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();
