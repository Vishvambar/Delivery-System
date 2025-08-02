import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { fetchOrderDetails } from '../../store/slices/orderSlice';

const statusSteps = [
  { key: 'Pending', label: 'Order Placed', icon: 'receipt-outline' },
  { key: 'Accepted', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'Prepared', label: 'Preparing', icon: 'restaurant-outline' },
  { key: 'Handed to Delivery', label: 'Ready for Pickup', icon: 'bag-outline' },
  { key: 'Out for Delivery', label: 'On the Way', icon: 'car-outline' },
  { key: 'Delivered', label: 'Delivered', icon: 'checkmark-done-outline' },
];

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const { selectedOrder, loading } = useSelector((state) => state.orders);
  const [deliveryLocation, setDeliveryLocation] = useState(null);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetails(orderId));
    }
  }, [dispatch, orderId]);

  useEffect(() => {
    if (selectedOrder) {
      navigation.setOptions({ 
        title: `Order #${selectedOrder.orderNumber}` 
      });

      // Mock delivery location for demonstration
      if (selectedOrder.status === 'Out for Delivery') {
        setDeliveryLocation({
          latitude: 37.78825 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4324 + (Math.random() - 0.5) * 0.01,
        });
      }
    }
  }, [selectedOrder, navigation]);

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const getStepStatus = (stepIndex, currentIndex) => {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const handleCallDelivery = () => {
    Alert.alert('Call Delivery Partner', 'This feature would normally call the delivery partner');
  };

  const renderStatusStep = (step, index) => {
    const currentIndex = getStatusIndex(selectedOrder?.status);
    const status = getStepStatus(index, currentIndex);
    
    return (
      <View key={step.key} style={styles.statusStep}>
        <View style={[
          styles.statusIcon,
          status === 'completed' && styles.statusIconCompleted,
          status === 'current' && styles.statusIconCurrent,
        ]}>
          <Ionicons 
            name={step.icon} 
            size={20} 
            color={status === 'pending' ? '#ccc' : 'white'} 
          />
        </View>
        <View style={styles.statusText}>
          <Text style={[
            styles.statusLabel,
            status !== 'pending' && styles.statusLabelActive
          ]}>
            {step.label}
          </Text>
          {status === 'current' && (
            <Text style={styles.statusTime}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        {index < statusSteps.length - 1 && (
          <View style={[
            styles.statusLine,
            status === 'completed' && styles.statusLineCompleted
          ]} />
        )}
      </View>
    );
  };

  if (loading || !selectedOrder) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Order Status Progress */}
      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusSteps}>
          {statusSteps.map((step, index) => renderStatusStep(step, index))}
        </View>
      </View>

      {/* Map View for Delivery Tracking */}
      {selectedOrder.status === 'Out for Delivery' && deliveryLocation && (
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Live Tracking</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: deliveryLocation.latitude,
              longitude: deliveryLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={deliveryLocation}
              title="Delivery Partner"
              description="Your order is on the way"
            />
            <Marker
              coordinate={{
                latitude: selectedOrder.deliveryAddress?.coordinates?.latitude || 37.78825,
                longitude: selectedOrder.deliveryAddress?.coordinates?.longitude || -122.4324,
              }}
              title="Delivery Address"
              description={selectedOrder.deliveryAddress?.fullAddress}
              pinColor="red"
            />
          </MapView>
          
          <TouchableOpacity style={styles.callButton} onPress={handleCallDelivery}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.callButtonText}>Call Delivery Partner</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order Details */}
      <View style={styles.orderDetails}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>
            {selectedOrder.vendorId?.businessName || 'Restaurant'}
          </Text>
          <Text style={styles.orderTime}>
            Ordered on {new Date(selectedOrder.createdAt).toLocaleDateString()} at{' '}
            {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.itemsList}>
          {selectedOrder.items?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${selectedOrder.pricing?.subtotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${selectedOrder.pricing?.deliveryFee?.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${selectedOrder.pricing?.tax?.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${selectedOrder.pricing?.total?.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.address}>
            {selectedOrder.deliveryAddress?.fullAddress || 'No address specified'}
          </Text>
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
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statusSteps: {
    paddingLeft: 10,
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusIconCurrent: {
    backgroundColor: '#FF6B35',
  },
  statusText: {
    flex: 1,
    paddingVertical: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusLabelActive: {
    color: '#333',
    fontWeight: '600',
  },
  statusTime: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 2,
  },
  statusLine: {
    position: 'absolute',
    left: 19.5,
    top: 40,
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  statusLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  mapContainer: {
    backgroundColor: 'white',
    marginBottom: 15,
    padding: 20,
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderDetails: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
  },
  vendorInfo: {
    marginBottom: 20,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  itemsList: {
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  addressSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  address: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});
