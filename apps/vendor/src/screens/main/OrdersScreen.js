import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchVendorOrders, updateOrderStatus } from '../../store/slices/orderSlice';

export default function OrdersScreen({ navigation }) {
  const dispatch = useDispatch();
  const { orders, loading, stats } = useSelector((state) => state.orders);

  useEffect(() => {
    // Fetch orders when component mounts
    const vendorId = '688c90a002ecd124ee7ce6ec'; // Use the same vendor ID
    dispatch(fetchVendorOrders(vendorId));
  }, [dispatch]);

  const handleStatusUpdate = (orderId, newStatus, customerId) => {
    console.log('📱 Vendor: Updating order status:', orderId, newStatus);
    
    Alert.alert(
      `Update Order Status`,
      `Mark this order as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            dispatch(updateOrderStatus({
              orderId,
              status: newStatus,
              customerId
            }));
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#FF9500';
      case 'Accepted': return '#007AFF';
      case 'Prepared': return '#34C759';
      case 'Handed to Delivery': return '#5856D6';
      case 'Delivered': return '#30D158';
      default: return '#8E8E93';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Pending': return 'Accepted';
      case 'Accepted': return 'Prepared';
      case 'Prepared': return 'Handed to Delivery';
      default: return null;
    }
  };

  const renderOrderItem = ({ item }) => {
    const nextStatus = getNextStatus(item.status);
    
    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>
              {item.orderNumber || `Order #${item._id.slice(-6)}`}
            </Text>
            <Text style={styles.customerName}>
              {item.customerName || 'Customer'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Order Items */}
        {item.items && item.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Items:</Text>
            {item.items.map((orderItem, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.itemName}>
                  {orderItem.quantity}x {orderItem.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ${(orderItem.price * orderItem.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Order Total */}
        {item.pricing && (
          <View style={styles.totalSection}>
            <Text style={styles.totalText}>
              Total: ${item.pricing.total?.toFixed(2) || '0.00'}
            </Text>
          </View>
        )}

        {/* Action Button */}
        {nextStatus && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getStatusColor(nextStatus) }]}
            onPress={() => handleStatusUpdate(item._id, nextStatus, item.customerId)}
          >
            <Text style={styles.actionButtonText}>
              Mark as {nextStatus}
            </Text>
          </TouchableOpacity>
        )}

        {/* Order Time */}
        <Text style={styles.orderTime}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Just now'}
        </Text>
      </View>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View key="pending" style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View key="accepted" style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.accepted}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View key="prepared" style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.prepared}</Text>
        <Text style={styles.statLabel}>Ready</Text>
      </View>
      <View key="completed" style={styles.statCard}>
        <Text style={styles.statNumber}>{stats.completed}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            const vendorId = '688c90a002ecd124ee7ce6ec';
            dispatch(fetchVendorOrders(vendorId));
          }}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {renderStatsCard()}

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              const vendorId = '688c90a002ecd124ee7ce6ec';
              dispatch(fetchVendorOrders(vendorId));
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              Orders will appear here when customers place them
            </Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  itemsSection: {
    marginBottom: 10,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginBottom: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
