import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { imageService } from '../../services/imageService';
import { socketService } from '../../services/socketService';

export default function RestaurantsListScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorLogos, setVendorLogos] = useState({});

  useEffect(() => {
    fetchVendors();
    setupSocketListeners();

    return () => {
      socketService.off('vendor_status_changed');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('vendor_status_changed', (data) => {
      console.log('📱 Vendor status changed:', data);
      setVendors(prevVendors =>
        prevVendors.map(vendor =>
          vendor._id === data.vendorId
            ? { ...vendor, isOpen: data.isOpen }
            : vendor
        )
      );
    });
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors?sortBy=rating');
      const vendorList = response.data.data.vendors;
      setVendors(vendorList);

      // Load vendor logos
      loadVendorLogos(vendorList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const loadVendorLogos = async (vendorList) => {
    const logoPromises = vendorList.map(async (vendor) => {
      try {
        const logoBase64 = await imageService.getVendorLogoBase64(vendor._id);
        return { vendorId: vendor._id, logo: logoBase64 };
      } catch (error) {
        return { vendorId: vendor._id, logo: null };
      }
    });

    const logoResults = await Promise.all(logoPromises);
    const logoMap = {};
    logoResults.forEach(result => {
      if (result.logo) {
        logoMap[result.vendorId] = result.logo;
      }
    });
    setVendorLogos(logoMap);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVendors();
    setRefreshing(false);
  };

  const formatRating = (rating) => {
    return rating.average ? rating.average.toFixed(1) : '0.0';
  };

  const formatDeliveryTime = (time) => {
    return `${time} min`;
  };

  const formatDeliveryFee = (fee) => {
    return fee === 0 ? 'Free' : `$${fee.toFixed(2)}`;
  };

  const renderVendorCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.vendorCard,
        !item.isOpen && styles.vendorCardClosed
      ]}
      onPress={() => navigation.navigate('VendorDetails', { vendor: item })}
      disabled={!item.isOpen}
    >
      <View style={styles.cardImage}>
        {vendorLogos[item._id] ? (
          <Image
            source={{ uri: vendorLogos[item._id] }}
            style={styles.vendorImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant" size={32} color="#ccc" />
          </View>
        )}
        {!item.isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            { color: item.isOpen ? '#4CAF50' : '#F44336' }
          ]}>
            {item.isOpen ? '● Open' : '● Closed'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {item.businessName}
        </Text>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location?.city || 'Location not available'}
          </Text>
        </View>

        <Text style={styles.vendorDescription} numberOfLines={2}>
          {item.description || 'Great food awaits you!'}
        </Text>

        <View style={styles.cuisineContainer}>
          {item.cuisineType?.slice(0, 3).map((cuisine, index) => (
            <View key={index} style={styles.cuisineBadge}>
              <Text style={styles.cuisineText}>{cuisine}</Text>
            </View>
          ))}
        </View>

        <View style={styles.vendorMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.metaText}>
              {formatRating(item.rating)} ({item.rating.count || 0})
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.metaText}>
              {formatDeliveryTime(item.estimatedDeliveryTime)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="car" size={16} color="#666" />
            <Text style={styles.metaText}>
              {formatDeliveryFee(item.deliveryFee)}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.minimumOrder}>
            Min order: ${item.minimumOrder}
          </Text>
          <View style={styles.menuCount}>
            <Text style={styles.menuCountText}>
              {item.menuItemCount || item.menu?.length || 0} dishes
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Restaurants</Text>
        <View style={styles.headerSpacer} />
      </View>

      {vendors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No restaurants found</Text>
          <Text style={styles.emptyText}>
            Please check back later for available restaurants.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchVendors}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendorCard}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.vendorsList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
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
  vendorsList: {
    padding: 16,
  },
  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  vendorCardClosed: {
    opacity: 0.7,
  },
  cardImage: {
    height: 140,
    position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  vendorDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cuisineContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  cuisineBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  cuisineText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  vendorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  minimumOrder: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuCount: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  menuCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
});
