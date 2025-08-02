import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '../components/OrderCard';
import LoadingIndicator from '../components/LoadingIndicator';
import { setOrders } from '../store/store';
// import { api } from '../services/api';
import { socketService } from '../services/socketService';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const orders = useSelector(state => state.delivery.orders || []);
  const { user } = useSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAvailableOrders();
    setupSocketListeners();
    
    return () => {
      socketService.off('new_delivery_available');
      socketService.off('order_assigned');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('new_delivery_available', (data) => {
      console.log('🚚 New delivery available:', data);
      fetchAvailableOrders();
      Alert.alert('New Delivery Available', 'A new delivery order is ready for pickup!');
    });

    socketService.on('order_assigned', (data) => {
      if (data.deliveryPartnerId === user._id) {
        console.log('🚚 Order assigned to me:', data);
        Alert.alert('Order Assigned', `Order #${data.orderNumber} has been assigned to you!`);
        fetchAvailableOrders();
      }
    });
  };

  const fetchAvailableOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/orders/delivery/available');
      const availableOrders = response.data.data.orders || [];
      dispatch(setOrders(availableOrders));
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
      Alert.alert('Error', 'Failed to load available orders');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await api.put(`/orders/${orderId}/assign`, {
        deliveryPartnerId: user._id
      });

      Alert.alert(
        'Order Accepted',
        'Order has been assigned to you successfully!',
        [
          {
            text: 'View Details',
            onPress: () => navigation.navigate('OrderDetails', { orderId })
          },
          { text: 'OK' }
        ]
      );

      // Emit socket event
      socketService.emit('order_picked_up', {
        orderId,
        deliveryPartnerId: user._id
      });

      // Refresh available orders
      fetchAvailableOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      Alert.alert('Error', 'Failed to accept order. Please try again.');
    }
  };

  const handleNavigateToDetails = (orderId) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => handleNavigateToDetails(item._id)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <Text style={styles.orderTime}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <View style={styles.orderInfo}>
        <View style={styles.locationRow}>
          <Ionicons name="restaurant" size={16} color="#FF6B35" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.vendorId?.businessName || 'Restaurant'}
          </Text>
        </View>
        
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.deliveryAddress?.street}, {item.deliveryAddress?.city}
          </Text>
        </View>
      </View>

      <View style={styles.orderMeta}>
        <Text style={styles.itemCount}>
          {item.items?.length || 0} item(s)
        </Text>
        <Text style={styles.orderTotal}>
          {formatPrice(item.pricing?.total)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptOrder(item._id)}
      >
        <Text style={styles.acceptButtonText}>Accept Order</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Deliveries</Text>
        <TouchableOpacity onPress={fetchAvailableOrders}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No delivery orders available</Text>
            <Text style={styles.emptySubText}>
              New orders will appear here when they're ready for pickup
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  orderInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;  