import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchVendorDetails, updateVendorMenu, handleMenuUpdate } from '../../store/slices/vendorSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { dataSyncService } from '../../services/dataSync';
import { socketService } from '../../services/socketService';

export default function VendorDetailsScreen({ route, navigation }) {
  const { vendorId } = route.params;
  const dispatch = useDispatch();
  const { selectedVendor, loading } = useSelector((state) => state.vendors);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [syncIntervalId, setSyncIntervalId] = useState(null);

  useEffect(() => {
    console.log('📱 Customer: VendorDetailsScreen mounted with vendorId:', vendorId);
    if (vendorId) {
      dispatch(fetchVendorDetails(vendorId));
    }
  }, [dispatch, vendorId]);

  useEffect(() => {
    if (selectedVendor) {
      navigation.setOptions({ 
        title: selectedVendor.businessName || 'Menu' 
      });
      
      // Set up real-time Socket.IO listeners for menu updates
      const handleSocketMenuUpdate = (data) => {
        console.log('🔌 Customer: Received real-time menu update:', data);
        if (data.vendorId === vendorId) {
          dispatch(handleMenuUpdate(data));
        }
      };
      
      // Listen for real-time menu updates
      socketService.on('vendor_menu_updated', handleSocketMenuUpdate);
      
      // Start fallback polling for shared storage sync (slower interval since Socket.IO is primary)
      const intervalId = dataSyncService.startDataSync(async (sharedData) => {
        const vendorData = sharedData[vendorId];
        if (vendorData && vendorData.menu && Array.isArray(vendorData.menu)) {
          console.log('📱 Received updated menu from shared storage:', vendorData.menu.length, 'items');
          dispatch(updateVendorMenu({
            vendorId,
            menu: vendorData.menu
          }));
        }
      }, 5000); // Slower polling since Socket.IO handles real-time updates
      setSyncIntervalId(intervalId);
      
      // Cleanup function to remove socket listeners
      return () => {
        socketService.off('vendor_menu_updated', handleSocketMenuUpdate);
      };
    }
  }, [selectedVendor, navigation, vendorId, dispatch]);

  // Cleanup sync on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalId) {
        dataSyncService.stopDataSync(syncIntervalId);
      }
    };
  }, [syncIntervalId]);

  const handleAddToCart = (item) => {
    // Ensure we're working with normalized item data
    const normalizedItem = item.menuItem && item.menuItem._id ? item.menuItem : item;
    
    const cartItem = {
      id: normalizedItem._id,
      name: normalizedItem.name,
      price: normalizedItem.price,
      image: normalizedItem.imageUrl,
      vendorId: selectedVendor._id,
      vendorName: selectedVendor.businessName,
      quantity: 1
    };
    
    dispatch(addToCart(cartItem));
    Alert.alert('Added to Cart', `${normalizedItem.name} has been added to your cart`);
  };

  const getCategories = () => {
    if (!selectedVendor?.menu || !Array.isArray(selectedVendor.menu)) return ['All'];
    
    // Normalize menu items for category extraction
    const normalizedMenu = selectedVendor.menu.map(item => {
      if (item.menuItem && item.menuItem._id) {
        return item.menuItem;
      }
      return item;
    });
    
    const categories = [...new Set(normalizedMenu.map(item => item.category))];
    return ['All', ...categories];
  };

  const getFilteredMenu = () => {
    console.log('📱 Customer: Getting filtered menu. Selected vendor:', selectedVendor?.businessName);
    console.log('📱 Customer: Menu array:', selectedVendor?.menu);
    console.log('📱 Customer: Menu is array:', Array.isArray(selectedVendor?.menu));
    console.log('📱 Customer: Menu length:', selectedVendor?.menu?.length);
    
    if (!selectedVendor?.menu || !Array.isArray(selectedVendor.menu)) {
      console.log('📱 Customer: No valid menu found, returning empty array');
      return [];
    }
    
    // Normalize menu items - some have nested menuItem structure
    const normalizedMenu = selectedVendor.menu.map(item => {
      // If item has nested menuItem structure, extract it
      if (item.menuItem && item.menuItem._id) {
        return item.menuItem;
      }
      return item;
    });
    
    const filteredMenu = selectedCategory === 'All' 
      ? normalizedMenu.filter(item => item.isAvailable !== false)
      : normalizedMenu.filter(item => item.category === selectedCategory && item.isAvailable !== false);
    
    console.log('📱 Customer: Filtered menu result:', filteredMenu.length, 'items');
    return filteredMenu;
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }} 
        style={styles.itemImage} 
      />
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemBadges}>
            {item.isVegetarian && (
              <View style={styles.vegBadge}>
                <Text style={styles.vegText}>V</Text>
              </View>
            )}
            {!item.isAvailable && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Unavailable</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemPrice}>${item.price?.toFixed(2)}</Text>
          <Text style={styles.prepTime}>🕒 {item.preparationTime}min</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.addButton, !item.isAvailable && styles.addButtonDisabled]}
        onPress={() => handleAddToCart(item)}
        disabled={!item.isAvailable}
      >
        <Ionicons name="add" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderCategoryTab = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryTab,
        selectedCategory === category && styles.categoryTabActive
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryTabText,
        selectedCategory === category && styles.categoryTabTextActive
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  if (loading || !selectedVendor) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vendor Header */}
      <View style={styles.vendorHeader}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{selectedVendor.businessName}</Text>
          <Text style={styles.vendorCategory}>{selectedVendor.category}</Text>
          <View style={styles.vendorMeta}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {selectedVendor.rating?.average?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.ratingCount}>
                ({selectedVendor.rating?.count || 0})
              </Text>
            </View>
            <Text style={styles.deliveryFee}>
              Delivery: ${selectedVendor.deliveryFee || 0}
            </Text>
          </View>
          <Text style={styles.minOrder}>
            Min. order: ${selectedVendor.minimumOrder || 0}
          </Text>
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: selectedVendor.isOpen ? '#4CAF50' : '#F44336' 
        }]}>
          <Text style={styles.statusText}>
            {selectedVendor.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={getCategories()}
          keyExtractor={(item) => item}
          renderItem={({ item }) => renderCategoryTab(item)}
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
        />
      </View>

      {/* Debug Section */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={async () => {
          console.log('📱 Customer: Manual sync check triggered');
          const sharedData = await dataSyncService.getAllVendorData();
          console.log('📱 Customer: All shared data:', sharedData);
          const vendorData = sharedData[vendorId];
          if (vendorData?.menu) {
            dispatch(updateVendorMenu({ vendorId, menu: vendorData.menu }));
          }
        }}
      >
        <Text style={styles.debugButtonText}>🔄 Sync Now (Debug)</Text>
      </TouchableOpacity>

      {/* Menu Items */}
      <FlatList
        data={getFilteredMenu()}
        keyExtractor={(item) => item._id}
        renderItem={renderMenuItem}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No menu items found</Text>
            <Text style={styles.emptyStateSubtext}>
              {!selectedVendor?.menu ? 'Menu not loaded' : 'All items filtered out'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorHeader: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  vendorCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    color: '#333',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 3,
  },
  deliveryFee: {
    fontSize: 14,
    color: '#666',
  },
  minOrder: {
    fontSize: 14,
    color: '#666',
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
  categoriesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesList: {
    paddingVertical: 10,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryTabActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  menuList: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  itemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vegBadge: {
    backgroundColor: '#4CAF50',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  vegText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 5,
  },
  unavailableText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  prepTime: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  debugButton: {
    backgroundColor: '#2196F3',
    margin: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
