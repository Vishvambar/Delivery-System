import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [dashboardStats, setDashboardStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor profile using fetch (like MenuScreen does)
      const response = await fetch('http://192.168.5.110:5000/api/vendors?includeAll=true', {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor profile');
      }
      
      const vendorResponse = await response.json();
      const vendor = vendorResponse.data.vendors.find(v => v.userId._id === user.id);
      setVendorProfile(vendor);

      // Fetch orders for stats calculation
      if (vendor) {
        const ordersResponse = await fetch(`http://192.168.5.110:5000/api/orders/vendor/${vendor._id}`, {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
          }
        });
        
        if (!ordersResponse.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const ordersData = await ordersResponse.json();
        console.log('📦 Orders response structure:', ordersData);
        
        let orders = [];
        if (ordersData.data && Array.isArray(ordersData.data.orders)) {
          orders = ordersData.data.orders;
        } else if (ordersData.data && Array.isArray(ordersData.data)) {
          orders = ordersData.data;
        } else if (Array.isArray(ordersData)) {
          orders = ordersData;
        } else {
          console.log('⚠️ Unexpected orders data structure, using empty array');
          orders = [];
        }
        
        console.log('📊 Processing orders:', orders.length);
        
        // Calculate today's stats
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => 
          new Date(order.createdAt).toDateString() === today
        );
        
        // Calculate pending orders
        const pendingOrders = orders.filter(order => 
          ['Pending', 'Accepted', 'Prepared'].includes(order.status)
        );
        
        // Calculate today's revenue from completed orders
        const todayRevenue = todayOrders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
        
        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = orders
          .filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear &&
                   order.status === 'Delivered';
          })
          .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

        setDashboardStats({
          todayOrders: todayOrders.length,
          pendingOrders: pendingOrders.length,
          todayRevenue: todayRevenue,
          monthlyRevenue: monthlyRevenue,
          averageRating: vendor.rating?.average || 0,
          totalReviews: vendor.rating?.count || 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFD700" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF6B35']}
        />
      }
    >
      {/* Restaurant Overview Card */}
      <LinearGradient
        colors={['#FF6B35', '#FF8A50']}
        style={styles.restaurantOverviewCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.restaurantHeader}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>
              {vendorProfile?.businessName || 'Your Restaurant'}
            </Text>
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStarRating(dashboardStats.averageRating)}
              </View>
              <Text style={styles.ratingText}>
                {dashboardStats.averageRating.toFixed(1)} ({dashboardStats.totalReviews} reviews)
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.settingsIcon}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Order Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📦 Order Statistics</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.todayOrdersCard]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{dashboardStats.todayOrders}</Text>
              <Text style={styles.statTitle}>Today's Orders</Text>
            </View>
          </View>
          
          <View style={[styles.statCard, styles.pendingOrdersCard]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={28} color="#FF9800" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{dashboardStats.pendingOrders}</Text>
              <Text style={styles.statTitle}>Pending Orders</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Revenue Analytics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>💰 Revenue Analytics</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.todayRevenueCard]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash" size={28} color="#2196F3" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>${dashboardStats.todayRevenue.toFixed(2)}</Text>
              <Text style={styles.statTitle}>Today's Revenue</Text>
            </View>
          </View>
          
          <View style={[styles.statCard, styles.monthlyRevenueCard]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={28} color="#9C27B0" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>${dashboardStats.monthlyRevenue.toFixed(2)}</Text>
              <Text style={styles.statTitle}>Monthly Revenue</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  
  // Restaurant Overview Card
  restaurantOverviewCard: {
    margin: 20,
    marginTop: 30,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    marginTop:60,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  settingsIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 16,
  },
  
  // Stats Sections
  statsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Stat Cards
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flex: 0.48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  // Specific card styles
  todayOrdersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  pendingOrdersCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  todayRevenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  monthlyRevenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
});
