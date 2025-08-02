import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/main/DashboardScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import MenuScreen from '../screens/main/MenuScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import OrderDetailsScreen from '../screens/main/OrderDetailsScreen';
import MenuItemScreen from '../screens/main/MenuItemScreen';
import AddEditMenuItemScreen from '../screens/main/AddEditMenuItemScreen';
import CompleteOrdersScreen from '../screens/main/CompleteOrdersScreen';
import RestaurantDetailsScreen from '../screens/main/RestaurantDetailsScreen';
import OperatingHoursScreen from '../screens/main/OperatingHoursScreen';
import PricingFeesScreen from '../screens/main/PricingFeesScreen';
import SalesReportScreen from '../screens/main/SalesReportScreen';
import ReviewsRatingsScreen from '../screens/main/ReviewsRatingsScreen';
import HelpCenterScreen from '../screens/main/HelpCenterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="OrdersList" 
        component={CompleteOrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
    </Stack.Navigator>
  );
}

function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MenuList" 
        component={MenuScreen}
        options={{ title: 'Menu Management' }}
      />
      <Stack.Screen 
        name="MenuItem" 
        component={MenuItemScreen}
        options={{ title: 'Edit Menu Item' }}
      />
      <Stack.Screen 
        name="AddEditMenuItem" 
        component={AddEditMenuItemScreen}
        options={{ title: 'Add/Edit Menu Item' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="RestaurantDetails" 
        component={RestaurantDetailsScreen}
        options={{ title: 'Restaurant Details' }}
      />
      <Stack.Screen 
        name="OperatingHours" 
        component={OperatingHoursScreen}
        options={{ title: 'Operating Hours' }}
      />
      <Stack.Screen 
        name="PricingFees" 
        component={PricingFeesScreen}
        options={{ title: 'Pricing & Fees' }}
      />
      <Stack.Screen 
        name="SalesReport" 
        component={SalesReportScreen}
        options={{ title: 'Sales Report' }}
      />
      <Stack.Screen 
        name="ReviewsRatings" 
        component={ReviewsRatingsScreen}
        options={{ title: 'Reviews & Ratings' }}
      />
      <Stack.Screen 
        name="HelpCenter" 
        component={HelpCenterScreen}
        options={{ title: 'Help Center' }}
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

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Menu" component={MenuStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
