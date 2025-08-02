import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notificationService';
import { socketService } from './src/services/socketService';
import { useSocketListeners } from './src/hooks/useSocketListeners';

// App content component to use hooks inside Provider
function AppContent() {
  // Set up Socket.IO listeners
  useSocketListeners();
  
  return <AppNavigator />;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap
      const data = response.notification.request.content.data;
      if (data.orderId) {
        // Navigate to order details
        // This would be handled by your navigation logic
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppContent />
      </NavigationContainer>
    </Provider>
  );
}
