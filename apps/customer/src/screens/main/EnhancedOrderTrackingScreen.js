import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { socketService } from '../../services/socketService';

const ORDER_STATUSES = [
  'Pending',
  'Accepted',
  'Prepared',
  'Handed to Delivery',
  'Out for Delivery',
  'Delivered'
];

const STATUS_ICONS = {
  'Pending': 'time-outline',
  'Accepted': 'checkmark-circle-outline',
  'Prepared': 'restaurant-outline',
  'Handed to Delivery': 'car-outline',
  'Out for Delivery': 'bicycle-outline',
  'Delivered': 'checkmark-done-outline'
};

const STATUS_COLORS = {
  'Pending': '#FF9500',
  'Accepted': '#4CAF50',
  'Prepared': '#2196F3',
  'Handed to Delivery': '#9C27B0',
  'Out for Delivery': '#795548',
  'Delivered': '#4CAF50'
};

export default function EnhancedOrderTrackingScreen({ navigation, route }) {
  const { orderId } = route.params;
  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    setupSocketListeners();
    
    // Join order room for real-time updates
    socketService.emit('join_order_room', orderId);

    return () => {
      socketService.off('order_status_updated');
      socketService.off('delivery_location_update');
      socketService.off('order_delivered');
      socketService.emit('leave_order_room', orderId);
    };
  }, [orderId]);

  const setupSocketListeners = () => {
    socketService.on('order_status_updated', (data) => {
      if (data.orderId === orderId) {
        console.log('📱 Order status updated:', data);
        setOrder(prevOrder => ({
          ...prevOrder,
          status: data.status
        }));
        
        // Show notification for status updates
        if (data.message) {
          Alert.alert('Order Update', data.message);
        }
      }
    });

    socketService.on('delivery_location_update', (data) => {
      if (data.orderId === orderId) {
        console.log('📱 Delivery location updated:', data);
        setDeliveryLocation(data.location);
      }
    });

    socketService.on('order_delivered', (data) => {
      if (data.orderId === orderId) {
        console.log('📱 Order delivered:', data);
        setOrder(prevOrder => ({
          ...prevOrder,
          status: 'Delivered',
          actualDeliveryTime: new Date().toISOString()
        }));
        
        Alert.alert(
          'Order Delivered!',
          'Your order has been delivered successfully. Enjoy your meal!',
          [
            { text: 'Rate Order', onPress: () => navigation.navigate('RateOrder', { orderId }) },
            { text: 'OK' }
          ]
        );
      }
    });
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/customer/${user._id}`);
      const orders = response.data.data.orders;
      const currentOrder = orders.find(o => o._id === orderId);
      
      if (currentOrder) {
        setOrder(currentOrder);
      } else {
        Alert.alert('Error', 'Order not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  };

  const getStatusIndex = (status) => {
    return ORDER_STATUSES.indexOf(status);
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEstimatedDeliveryTime = () => {
    if (!order) return 'N/A';
    
    if (order.status === 'Delivered' && order.actualDeliveryTime) {
      return `Delivered at ${formatTime(order.actualDeliveryTime)}`;
    }
    
    if (order.estimatedDeliveryTime) {
      return `Est. ${formatTime(order.estimatedDeliveryTime)}`;
    }
    
    return 'Calculating...';
  };

  const cancelOrder = () => {
    if (order.status !== 'Pending') {
      Alert.alert('Cannot Cancel', 'This order cannot be cancelled as it has already been accepted.');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/status`, {
                status: 'Cancelled'
              });

              // Emit socket event
              socketService.emit('cancel_order', {
                orderId,
                vendorId: order.vendorId._id,
                reason: 'Cancelled by customer'
              });

              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          }
        }
      ]
    );
  };

  const renderOrderStatus = () => {
    const currentStatusIndex = getStatusIndex(order.status);
    
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Order Status</Text>
        
        {ORDER_STATUSES.map((status, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          
          return (
            <View key={status} style={styles.statusItem}>
              <View style={styles.statusLine}>
                <View style={[
                  styles.statusDot,
                  isCompleted && styles.statusDotCompleted,
                  isCurrent && styles.statusDotCurrent
                ]}>
                  <Ionicons
                    name={STATUS_ICONS[status]}
                    size={16}
                    color={isCompleted ? '#fff' : '#ccc'}
                  />
                </View>
                
                {index < ORDER_STATUSES.length - 1 && (
                  <View style={[
                    styles.statusConnector,
                    isCompleted && styles.statusConnectorCompleted
                  ]} />
                )}
              </View>
              
              <View style={styles.statusContent}>
                <Text style={[
                  styles.statusText,
                  isCompleted && styles.statusTextCompleted,
                  isCurrent && styles.statusTextCurrent
                ]}>
                  {status}
                </Text>
                
                {isCurrent && (
                  <Text style={styles.statusTime}>
                    {status === 'Delivered' ? 
                      formatTime(order.actualDeliveryTime) :
                      'In Progress...'
                    }
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderDetails = () => (
    <View style={styles.detailsContainer}>
      <Text style={styles.sectionTitle}>Order Details</Text>
      
      <View style={styles.orderInfo}>
        <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
      </View>
      
      <View style={styles.restaurantInfo}>
        <Ionicons name="restaurant" size={20} color="#FF6B35" />
        <Text style={styles.restaurantName}>
          {order.vendorId?.businessName || 'Restaurant'}
        </Text>
      </View>
      
      <View style={styles.itemsList}>
        <Text style={styles.itemsTitle}>Items Ordered:</Text>
        {order.items?.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemName}>
              {item.name} x{item.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              {formatPrice(item.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.addressSection}>
        <Text style={styles.addressTitle}>Delivery Address:</Text>
        <Text style={styles.addressText}>
          {order.deliveryAddress?.street}
          {'\n'}{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.zipCode}
        </Text>
        {order.deliveryAddress?.instructions && (
          <Text style={styles.instructionsText}>
            Instructions: {order.deliveryAddress.instructions}
          </Text>
        )}
      </View>
      
      <View style={styles.pricingSection}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Subtotal:</Text>
          <Text style={styles.pricingValue}>
            {formatPrice(order.pricing?.subtotal)}
          </Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Delivery Fee:</Text>
          <Text style={styles.pricingValue}>
            {formatPrice(order.pricing?.deliveryFee)}
          </Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Tax:</Text>
          <Text style={styles.pricingValue}>
            {formatPrice(order.pricing?.tax)}
          </Text>
        </View>
        <View style={[styles.pricingRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {formatPrice(order.pricing?.total)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status Banner */}
        <View style={[
          styles.statusBanner,
          { backgroundColor: STATUS_COLORS[order.status] || '#ccc' }
        ]}>
          <Ionicons
            name={STATUS_ICONS[order.status]}
            size={24}
            color="#fff"
          />
          <View style={styles.statusBannerText}>
            <Text style={styles.currentStatus}>{order.status}</Text>
            <Text style={styles.estimatedTime}>
              {getEstimatedDeliveryTime()}
            </Text>
          </View>
        </View>

        {/* Order Status Timeline */}
        {renderOrderStatus()}

        {/* Order Details */}
        {renderOrderDetails()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {order.status === 'Pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelOrder}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Alert.alert('Contact Support', 'Feature coming soon')}
          >
            <Ionicons name="call" size={20} color="#FF6B35" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  statusBannerText: {
    marginLeft: 12,
    flex: 1,
  },
  currentStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  statusContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusLine: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  statusDotCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusDotCurrent: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusConnector: {
    width: 2,
    height: 30,
    backgroundColor: '#ccc',
    marginTop: 4,
  },
  statusConnectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusContent: {
    flex: 1,
    paddingTop: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#999',
  },
  statusTextCompleted: {
    color: '#333',
    fontWeight: '500',
  },
  statusTextCurrent: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  statusTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  orderInfo: {
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  addressSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
  },
  pricingSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  actionButtons: {
    padding: 16,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  contactButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
