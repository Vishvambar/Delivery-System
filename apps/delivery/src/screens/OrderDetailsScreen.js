import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params;

  const [orderStatus, setOrderStatus] = useState('Accepted');

  // Dummy order data - in a real app, you would fetch this based on orderId
  const order = {
    id: orderId,
    customerName: 'Jane Doe',
    customerPhone: '555-123-4567',
    pickupLocation: { latitude: 37.78825, longitude: -122.4324, address: '123 Main St' },
    deliveryLocation: { latitude: 37.75525, longitude: -122.4554, address: '456 Oak Ave' },
  };

  const handleCallCustomer = () => {
    Linking.openURL(`tel:${order.customerPhone}`);
  };

  const handleStatusUpdate = () => {
    if (orderStatus === 'Accepted') {
      setOrderStatus('Picked Up');
      alert(`Order #${orderId} marked as picked up!`);
    } else if (orderStatus === 'Picked Up') {
      setOrderStatus('Delivered');
      alert(`Order #${orderId} marked as delivered!`);
      navigation.navigate('MyDeliveries'); // Navigate back to deliveries list
    }
  };

  const getButtonTitle = () => {
    if (orderStatus === 'Accepted') return 'Pick Up Order';
    if (orderStatus === 'Picked Up') return 'Complete Delivery';
    return 'Order Completed';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order #{order.id}</Text>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (order.pickupLocation.latitude + order.deliveryLocation.latitude) / 2,
            longitude: (order.pickupLocation.longitude + order.deliveryLocation.longitude) / 2,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          <Marker coordinate={order.pickupLocation} title="Pickup" pinColor="blue" />
          <Marker coordinate={order.deliveryLocation} title="Delivery" pinColor="green" />
        </MapView>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.subtitle}>Delivery Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{orderStatus}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{order.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Pickup:</Text>
          <Text style={styles.value}>{order.pickupLocation.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Delivery:</Text>
          <Text style={styles.value}>{order.deliveryLocation.address}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Call Customer" onPress={handleCallCustomer} />
        {orderStatus !== 'Delivered' && (
          <Button title={getButtonTitle()} onPress={handleStatusUpdate} color="#28a745" />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
  },
  mapContainer: {
    height: 250,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
  },
  value: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
});

export default OrderDetailsScreen;