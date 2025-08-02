import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const OrderCard = ({ order, onAccept, onNavigate }) => {
  return (
    <TouchableOpacity onPress={() => onNavigate(order.id)} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order ID: #{order.id}</Text>
        <Text style={styles.status}>Status: {order.status}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.location}>Pickup: {order.pickupLocation}</Text>
        <Text style={styles.location}>Delivery: {order.deliveryLocation}</Text>
        <Text style={styles.price}>Fare: ${order.fare}</Text>
      </View>
      {onAccept && (
        <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(order.id)}>
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: 'gray',
  },
  body: {
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  acceptButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OrderCard;