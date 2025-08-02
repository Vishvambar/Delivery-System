import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import OrderCard from '../components/OrderCard';
import { useNavigation } from '@react-navigation/native';

const MyDeliveriesScreen = () => {
  const navigation = useNavigation();
  const acceptedOrders = useSelector(state => state.delivery.acceptedOrders); // Assume we add this to the store later

  const renderItem = ({ item }) => (
    <OrderCard
      order={item}
      onNavigate={(orderId) => navigation.navigate('OrderDetails', { orderId })}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Deliveries</Text>
      <FlatList
        data={acceptedOrders}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => <Text style={styles.emptyText}>You have no active deliveries.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
});

export default MyDeliveriesScreen;