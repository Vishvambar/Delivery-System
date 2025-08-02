import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen'; // We'll create this next

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// A stack navigator for the "Home" tab to allow for screen transitions (e.g., from Home to OrderDetails)
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AvailableOrders" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Hide the header for all screens within the tabs
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="MyDeliveries" component={MyDeliveriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;