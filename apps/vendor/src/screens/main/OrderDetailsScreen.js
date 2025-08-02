import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

export default function OrderDetailsScreen({ route }) {
  const { orderId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Details</Text>
      <Text style={styles.subtitle}>Order ID: {orderId}</Text>
      <Text style={styles.message}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#999',
  },
});
