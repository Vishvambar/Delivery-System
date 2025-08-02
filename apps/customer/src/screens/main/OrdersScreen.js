import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserOrders } from '../../store/slices/orderSlice';

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#FFA500';
    case 'Accepted': return '#4CAF50';
    case 'Prepared': return '#2196F3';
    case 'Handed to Delivery': return '#9C27B0';
    case 'Out for Delivery': return '#FF9800';
    case 'Delivered': return '#4CAF50';
    case 'Cancelled': return '#F44336';
    default: return '#666';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending': return 'time-outline';
    case 'Accepted': return 'checkmark-circle-outline';
    case 'Prepared': return 'restaurant-outline';
    case 'Handed to Delivery': return 'car-outline';
    case 'Out for Delivery': return 'bicycle-outline';
    case 'Delivered': return 'checkmark-done-outline';
    case 'Cancelled': return 'close-circle-outline';
    default: return 'help-outline';
  }
};

export default function OrdersScreen({ navigation }) {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user && isAuthenticated && token) {
      console.log('📤 OrdersScreen: User is authenticated, fetching orders for:', user._id);
      dispatch(fetchUserOrders(user._id));
    } else {
      console.log('📤 OrdersScreen: User not fully authenticated yet', { user: !!user, isAuthenticated, token: !!token });
    }
  }, [dispatch, user, isAuthenticated, token]);

  const handleRefresh = () => {
    if (user && isAuthenticated && token) {
      dispatch(fetchUserOrders(user._id));
    }
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderTracking', { orderId: order._id });
  };

  const renderOrder = ({ item: order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(order)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Ionicons 
            name={getStatusIcon(order.status)} 
            size={16} 
            color="white" 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <Text style={styles.vendorName}>{order.vendorId?.businessName || 'Unknown Vendor'}</Text>
      
      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>
          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.orderTotal}>${order.pricing?.total?.toFixed(2) || '0.00'}</Text>
      </View>

      <Text style={styles.orderDate}>
        {new Date(order.createdAt).toLocaleDateString()} at{' '}
        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {order.status === 'Out for Delivery' && (
        <TouchableOpacity 
          style={styles.trackButton}
          onPress={() => handleOrderPress(order)}
        >
          <Ionicons name="location-outline" size={16} color="#FF6B35" />
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySubtext}>Your order history will appear here</Text>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.orderButtonText}>Start Ordering</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={['#FF6B35']}
          />
        }
        contentContainerStyle={styles.ordersList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  ordersList: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 20,
  },
  trackButtonText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 30,
    textAlign: 'center',
  },
  orderButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
