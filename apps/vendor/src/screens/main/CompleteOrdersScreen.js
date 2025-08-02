import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { socketService } from '../../services/socketService';
import { api } from '../../services/api';

const ORDER_STATUSES = [
  'Pending',
  'Accepted',
  'Prepared',
  'Handed to Delivery',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const STATUS_COLORS = {
  'Pending': '#FF9500',
  'Accepted': '#4CAF50',
  'Prepared': '#2196F3',
  'Handed to Delivery': '#9C27B0',
  'Out for Delivery': '#795548',
  'Delivered': '#4CAF50',
  'Cancelled': '#F44336'
};

export default function CompleteOrdersScreen({ navigation }) {
  const { token, user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [vendorId, setVendorId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetchVendorProfile();
    setupSocketListeners();
    
    return () => {
      socketService.off('new_order');
      socketService.off('order_cancelled');
    };
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchOrders();
    }
  }, [vendorId, filterStatus]);

  const fetchVendorProfile = async () => {
    try {
      setProfileLoading(true);
      console.log('🏪 Fetching vendor profile for user:', user._id);
      // First, get the current user's vendor profile
      const response = await api.get('/vendors?includeAll=true');
      console.log('🏪 Vendors response:', response.data.data.vendors.length, 'vendors found');
      
      const userVendor = response.data.data.vendors.find(
        vendor => vendor.userId._id === user._id
      );
      
      if (userVendor) {
        console.log('✅ Vendor profile found:', userVendor._id, userVendor.businessName);
        setVendorId(userVendor._id);
      } else {
        console.log('❌ No vendor profile found for user:', user._id);
        console.log('🔧 Attempting to create vendor profile...');
        
        try {
          const createResponse = await api.post('/vendors/create-profile');
          if (createResponse.data.success) {
            console.log('✅ Vendor profile created successfully');
            // Refetch vendors to get the new profile
            const refetchResponse = await api.get('/vendors?includeAll=true');
            const vendorsData = refetchResponse.data.data.vendors || refetchResponse.data.vendors || refetchResponse.data;
            const newUserVendor = vendorsData.find(
              vendor => {
                const vendorUserId = vendor.userId?._id || vendor.userId;
                return vendorUserId === user._id;
              }
            );
            if (newUserVendor) {
              setVendorId(newUserVendor._id);
              Alert.alert('Profile Created', 'Your vendor profile has been created successfully!');
            } else {
              console.warn('⚠️ Created profile but could not find it in refetch');
              Alert.alert('Profile Created', 'Your vendor profile has been created. Please restart the app to continue.');
            }
          }
        } catch (createError) {
          console.error('❌ Failed to create vendor profile:', createError.response?.data || createError.message);
          
          // Check if error is "already exists"
          if (createError.response?.data?.message?.includes('already exists')) {
            console.log('🔍 Profile already exists but not found. Checking vendor role...');
            
            // The profile exists but we can't find it - this might be a data consistency issue
            Alert.alert(
              'Profile Issue', 
              'There seems to be an issue with your vendor profile. Please contact support or try logging out and back in.',
              [
                { text: 'OK', style: 'default' },
                { 
                  text: 'Restart App', 
                  style: 'destructive',
                  onPress: () => {
                    // Navigate to login or restart the app
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Auth' }],
                    });
                  }
                }
              ]
            );
          } else {
            Alert.alert('Error', 'Failed to create vendor profile. Please contact support.');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching vendor profile:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load vendor profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('new_order', (data) => {
      console.log('📦 New order received:', data);
      fetchOrders(); // Refresh orders list
      
      Alert.alert(
        'New Order!',
        `New order from ${data.customer}`,
        [
          { text: 'View Orders', onPress: () => fetchOrders() },
          { text: 'OK' }
        ]
      );
    });

    socketService.on('order_cancelled', (data) => {
      console.log('❌ Order cancelled:', data);
      fetchOrders(); // Refresh orders list
      
      Alert.alert(
        'Order Cancelled',
        `Order #${data.orderId} has been cancelled by the customer`,
        [{ text: 'OK' }]
      );
    });
  };

  const fetchOrders = async () => {
    if (!vendorId) {
      console.log('⏳ No vendorId yet, skipping order fetch');
      return;
    }

    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      console.log('📦 Fetching orders for vendor:', vendorId, 'with filter:', filterStatus);
      const response = await api.get(`/orders/vendor/${vendorId}${params}`);
      console.log('📦 Orders response:', response.data.data.orders.length, 'orders found');
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('❌ Error fetching orders:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);

    try {
      const response = await api.put(`/orders/${orderId}/status`, {
        status: newStatus
      });

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );

      // Emit socket event for real-time updates
      const order = orders.find(o => o._id === orderId);
      if (order) {
        socketService.emit('order_status_updated', {
          orderId,
          customerId: order.customerId._id,
          status: newStatus
        });
      }

      Alert.alert('Success', `Order status updated to ${newStatus}`);
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'Pending': 'Accepted',
      'Accepted': 'Prepared',
      'Prepared': 'Handed to Delivery'
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ['Pending', 'Accepted', 'Prepared'].includes(status);
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.customerName}>
        Customer: {item.customerId?.name || 'Unknown'}
      </Text>
      
      <Text style={styles.orderTotal}>
        Total: {formatPrice(item.pricing?.total)}
      </Text>
      
      <Text style={styles.orderTime}>
        {formatDate(item.createdAt)}
      </Text>

      <View style={styles.itemsPreview}>
        <Text style={styles.itemsCount}>
          {item.items?.length || 0} item(s)
        </Text>
        {item.items?.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.itemName}>
            • {orderItem.name} x{orderItem.quantity}
          </Text>
        ))}
        {item.items?.length > 2 && (
          <Text style={styles.moreItems}>
            +{item.items.length - 2} more items
          </Text>
        )}
      </View>

      {canUpdateStatus(item.status) && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => updateOrderStatus(item._id, getNextStatus(item.status))}
        >
          <Text style={styles.quickActionText}>
            Mark as {getNextStatus(item.status)}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderOrderDetails = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <View style={styles.orderDetails}>
              <Text style={styles.detailOrderNumber}>
                Order #{selectedOrder.orderNumber}
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.customerId?.name}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.customerId?.phone}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedOrder.status] }]}>
                  <Text style={styles.statusText}>{selectedOrder.status}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment:</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.paymentMethod?.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Items Ordered:</Text>
              {selectedOrder.items?.map((item, index) => (
                <View key={index} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemDetails}>
                    x{item.quantity} - {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.pricingSection}>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Subtotal:</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(selectedOrder.pricing?.subtotal)}
                  </Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Delivery Fee:</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(selectedOrder.pricing?.deliveryFee)}
                  </Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Tax:</Text>
                  <Text style={styles.pricingValue}>
                    {formatPrice(selectedOrder.pricing?.tax)}
                  </Text>
                </View>
                <View style={[styles.pricingRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    {formatPrice(selectedOrder.pricing?.total)}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Delivery Address:</Text>
              <Text style={styles.addressText}>
                {selectedOrder.deliveryAddress?.street}
                {'\n'}{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} {selectedOrder.deliveryAddress?.zipCode}
              </Text>

              {selectedOrder.deliveryAddress?.instructions && (
                <View>
                  <Text style={styles.sectionTitle}>Special Instructions:</Text>
                  <Text style={styles.instructionsText}>
                    {selectedOrder.deliveryAddress.instructions}
                  </Text>
                </View>
              )}

              {canUpdateStatus(selectedOrder.status) && (
                <TouchableOpacity
                  style={[styles.updateButton, updatingStatus && styles.updateButtonDisabled]}
                  onPress={() => updateOrderStatus(selectedOrder._id, getNextStatus(selectedOrder.status))}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.updateButtonText}>
                      Mark as {getNextStatus(selectedOrder.status)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Active', value: 'Accepted' },
    { label: 'Delivered', value: 'Delivered' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders Management</Text>
        <TouchableOpacity onPress={fetchOrders}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {filterButtons.map((button) => (
          <TouchableOpacity
            key={button.value}
            style={[
              styles.filterButton,
              filterStatus === button.value && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(button.value)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === button.value && styles.filterButtonTextActive
            ]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading || profileLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>
            {profileLoading ? 'Loading vendor profile...' : 
             vendorId ? 'Loading orders...' : 'Setting up vendor...'}
          </Text>
          {vendorId && (
            <Text style={styles.debugText}>Vendor ID: {vendorId}</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No orders found</Text>
              <Text style={styles.emptySubText}>
                Orders will appear here when customers place them
              </Text>
            </View>
          }
        />
      )}

      {renderOrderDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  debugText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
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
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  quickActionButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDetails: {
    flex: 1,
  },
  detailOrderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  orderItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  pricingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
    borderTopColor: '#eee',
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
    color: '#333',
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
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
  },
  updateButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
