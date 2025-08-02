import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { imageService } from '../../services/imageService';
import { addToCart, updateCartItemQuantity } from '../../store/slices/cartSlice';
import { socketService } from '../../services/socketService';

const { width } = Dimensions.get('window');

const MENU_CATEGORIES = [
  'all',
  'appetizer',
  'main-course',
  'dessert',
  'beverage',
  'snack'
];

export default function EnhancedVendorDetailsScreen({ navigation, route }) {
  const { vendor } = route.params;
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart || { items: [] });
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [vendorDetails, setVendorDetails] = useState(vendor);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuImages, setMenuImages] = useState({});
  const [vendorLogo, setVendorLogo] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchVendorDetails();
    fetchMenuItems();
    loadVendorLogo();
    setupSocketListeners();

    return () => {
      socketService.off('vendor_menu_updated');
      socketService.off('vendor_status_changed');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('vendor_menu_updated', (data) => {
      if (data.vendorId === vendor._id) {
        console.log('📱 Menu updated for current vendor:', data);
        fetchMenuItems(); // Refresh menu
      }
    });

    socketService.on('vendor_status_changed', (data) => {
      if (data.vendorId === vendor._id) {
        console.log('📱 Vendor status changed:', data);
        setVendorDetails(prev => ({
          ...prev,
          isOpen: data.isOpen
        }));
      }
    });
  };

  const fetchVendorDetails = async () => {
    try {
      const response = await api.get(`/vendors/${vendor._id}`);
      setVendorDetails(response.data.data.vendor);
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendors/${vendor._id}/menu`);
      const menu = response.data.data.menu;
      setMenuItems(menu);
      
      // Load menu item images
      loadMenuImages(menu);
    } catch (error) {
      console.error('Error fetching menu:', error);
      Alert.alert('Error', 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const loadVendorLogo = async () => {
    try {
      const logoBase64 = await imageService.getVendorLogoBase64(vendor._id);
      if (logoBase64) {
        setVendorLogo(logoBase64);
      }
    } catch (error) {
      console.log('No vendor logo found');
    }
  };

  const loadMenuImages = async (menu) => {
    const imagePromises = menu.map(async (item) => {
      try {
        const imageBase64 = await imageService.getMenuItemImageBase64(vendor._id, item._id);
        return { itemId: item._id, image: imageBase64 };
      } catch (error) {
        return { itemId: item._id, image: null };
      }
    });

    const imageResults = await Promise.all(imagePromises);
    const imageMap = {};
    imageResults.forEach(result => {
      if (result.image) {
        imageMap[result.itemId] = result.image;
      }
    });
    setMenuImages(imageMap);
  };

  const getFilteredMenu = () => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.category === selectedCategory);
  };

  const getCategoryCount = (category) => {
    if (category === 'all') return menuItems.length;
    return menuItems.filter(item => item.category === category).length;
  };

  const getCartItemQuantity = (itemId) => {
    const cartItem = cart.items.find(item => item.menuItemId === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (item, selectedQuantity = 1) => {
    if (!vendorDetails.isOpen) {
      Alert.alert('Restaurant Closed', 'This restaurant is currently closed');
      return;
    }

    const cartData = {
      vendorId: vendor._id,
      vendorName: vendorDetails.businessName,
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity: selectedQuantity,
      image: menuImages[item._id] || null
    };

    dispatch(addToCart(cartData));
    
    Alert.alert(
      'Added to Cart',
      `${item.name} (x${selectedQuantity}) has been added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart', { screen: 'CartList' }) }
      ]
    );

    setModalVisible(false);
    setQuantity(1);
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      dispatch(updateCartItemQuantity({ menuItemId: itemId, quantity: 0 }));
    } else {
      dispatch(updateCartItemQuantity({ menuItemId: itemId, quantity: newQuantity }));
    }
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setQuantity(getCartItemQuantity(item._id) || 1);
    setModalVisible(true);
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryContainer}
    >
      {MENU_CATEGORIES.map((category) => {
        const count = getCategoryCount(category);
        if (count === 0 && category !== 'all') return null;
        
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category === 'all' ? 'All' : category.replace('-', ' ')} ({count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderMenuItem = (item) => {
    const cartQuantity = getCartItemQuantity(item._id);
    
    return (
      <TouchableOpacity
        key={item._id}
        style={[
          styles.menuItem,
          !item.isAvailable && styles.menuItemUnavailable
        ]}
        onPress={() => item.isAvailable && openItemModal(item)}
        disabled={!item.isAvailable}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.itemBadges}>
                {item.isVegetarian && (
                  <View style={styles.vegBadge}>
                    <Text style={styles.vegText}>V</Text>
                  </View>
                )}
                {!item.isAvailable && (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableText}>N/A</Text>
                  </View>
                )}
              </View>
            </View>
            
            {item.description && (
              <Text style={styles.itemDescription} numberOfLines={3}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.itemMeta}>
              <Text style={styles.itemPrice}>
                {formatPrice(item.price)}
              </Text>
              <Text style={styles.itemTime}>
                🕒 {item.preparationTime}min
              </Text>
              {item.spiceLevel && item.spiceLevel !== 'mild' && (
                <Text style={styles.spiceLevel}>
                  🌶️ {item.spiceLevel}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.itemImageContainer}>
            {menuImages[item._id] ? (
              <Image
                source={{ uri: menuImages[item._id] }}
                style={styles.itemImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="restaurant" size={24} color="#ccc" />
              </View>
            )}
            
            {item.isAvailable && (
              <View style={styles.cartControls}>
                {cartQuantity > 0 ? (
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item._id, cartQuantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{cartQuantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleUpdateQuantity(item._id, cartQuantity + 1)}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItemModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          {selectedItem && (
            <>
              {menuImages[selectedItem._id] && (
                <Image
                  source={{ uri: menuImages[selectedItem._id] }}
                  style={styles.modalImage}
                />
              )}
              
              <View style={styles.modalInfo}>
                <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                
                {selectedItem.description && (
                  <Text style={styles.modalItemDescription}>
                    {selectedItem.description}
                  </Text>
                )}
                
                <View style={styles.modalMeta}>
                  <Text style={styles.modalPrice}>
                    {formatPrice(selectedItem.price)}
                  </Text>
                  <Text style={styles.modalTime}>
                    🕒 {selectedItem.preparationTime} minutes
                  </Text>
                </View>
                
                <View style={styles.modalQuantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <View style={styles.modalQuantityControls}>
                    <TouchableOpacity
                      style={styles.modalQuantityButton}
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Ionicons name="remove" size={20} color="#FF6B35" />
                    </TouchableOpacity>
                    <Text style={styles.modalQuantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.modalQuantityButton}
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Ionicons name="add" size={20} color="#FF6B35" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={() => handleAddToCart(selectedItem, quantity)}
                >
                  <Text style={styles.modalAddButtonText}>
                    Add to Cart - {formatPrice(selectedItem.price * quantity)}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerImage}>
          {vendorLogo ? (
            <Image source={{ uri: vendorLogo }} style={styles.vendorImage} />
          ) : (
            <View style={styles.placeholderHeader}>
              <Ionicons name="restaurant" size={48} color="#ccc" />
            </View>
          )}
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          {!vendorDetails.isOpen && (
            <View style={styles.closedBanner}>
              <Text style={styles.closedBannerText}>Currently Closed</Text>
            </View>
          )}
        </View>

        {/* Vendor Info */}
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendorDetails.businessName}</Text>
          
          {vendorDetails.description && (
            <Text style={styles.vendorDescription}>
              {vendorDetails.description}
            </Text>
          )}
          
          <View style={styles.vendorMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.metaText}>
                {vendorDetails.rating?.average?.toFixed(1) || '0.0'} ({vendorDetails.rating?.count || 0})
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.metaText}>
                {vendorDetails.estimatedDeliveryTime} min
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="car" size={16} color="#666" />
              <Text style={styles.metaText}>
                {vendorDetails.deliveryFee === 0 ? 'Free' : `$${vendorDetails.deliveryFee.toFixed(2)}`}
              </Text>
            </View>
          </View>
          
          <Text style={styles.minimumOrder}>
            Minimum order: ${vendorDetails.minimumOrder}
          </Text>
        </View>

        {/* Menu Categories */}
        {renderCategoryFilter()}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menu</Text>
          {getFilteredMenu().map(renderMenuItem)}
        </View>
      </ScrollView>

      {renderItemModal()}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerImage: {
    height: 200,
    position: 'relative',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHeader: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    padding: 12,
    alignItems: 'center',
  },
  closedBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendorInfo: {
    backgroundColor: '#fff',
    padding: 20,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  vendorDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  vendorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  minimumOrder: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: '#fff',
  },
  menuContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemUnavailable: {
    opacity: 0.5,
  },
  itemContent: {
    flexDirection: 'row',
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  itemBadges: {
    flexDirection: 'row',
  },
  vegBadge: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  vegText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  unavailableBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 12,
  },
  itemTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  spiceLevel: {
    fontSize: 12,
    color: '#666',
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartControls: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalInfo: {
    padding: 20,
  },
  modalItemName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalItemDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  modalTime: {
    fontSize: 16,
    color: '#666',
  },
  modalQuantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalQuantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalQuantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  modalAddButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
