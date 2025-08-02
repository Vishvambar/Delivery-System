import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../../store/slices/vendorSlice';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { vendors, loading } = useSelector((state) => state.vendors);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const renderVendor = ({ item }) => (
    <TouchableOpacity 
      style={styles.vendorCard}
      onPress={() => navigation.navigate('VendorDetails', { vendorId: item._id })}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
        style={styles.vendorImage}
      />
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{item.businessName}</Text>
        <Text style={styles.vendorCategory}>{item.category}</Text>
        <Text style={styles.vendorRating}>⭐ {item.rating?.average?.toFixed(1) || '0.0'}</Text>
        <Text style={styles.deliveryInfo}>
          ${item.deliveryFee || 0} delivery • {item.estimatedDeliveryTime || 30} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No restaurants available</Text>
        <Text style={styles.emptySubtext}>Check back later for new restaurants!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vendors}
        renderItem={renderVendor}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  vendorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  vendorImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  vendorInfo: {
    padding: 16,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  vendorRating: {
    fontSize: 14,
    color: '#FF6B35',
    marginBottom: 4,
  },
  deliveryInfo: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
