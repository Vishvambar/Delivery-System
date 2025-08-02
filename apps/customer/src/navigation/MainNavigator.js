import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import EnhancedHomeScreen from '../screens/main/EnhancedHomeScreen';
import RestaurantsListScreen from '../screens/main/RestaurantsListScreen';
import CartScreen from '../screens/main/CartScreen';
import EnhancedCartScreen from '../screens/main/EnhancedCartScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import VendorDetailsScreen from '../screens/main/VendorDetailsScreen';
import EnhancedVendorDetailsScreen from '../screens/main/EnhancedVendorDetailsScreen';
import OrderTrackingScreen from '../screens/main/OrderTrackingScreen';
import EnhancedOrderTrackingScreen from '../screens/main/EnhancedOrderTrackingScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="HomeList" 
        component={EnhancedHomeScreen}
        options={{ title: 'Restaurants' }}
      />
      <Stack.Screen 
        name="RestaurantsList" 
        component={RestaurantsListScreen}
        options={{ title: 'All Restaurants' }}
      />
      <Stack.Screen 
        name="VendorDetails" 
        component={EnhancedVendorDetailsScreen}
        options={{ title: 'Menu' }}
      />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="CartList" 
        component={EnhancedCartScreen}
        options={{ title: 'Your Cart' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersScreen}
        options={{ title: 'My Orders' }}
      />
      <Stack.Screen 
        name="OrderTracking" 
        component={EnhancedOrderTrackingScreen}
        options={{ title: 'Track Order' }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
