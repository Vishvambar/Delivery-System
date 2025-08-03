import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    ScrollView,
    Modal,
    Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { imageService } from '../../services/imageService';
import { socketService } from '../../services/socketService';
import { addToCart } from '../../store/slices/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'restaurant', name: 'Restaurant', icon: 'restaurant-outline' },
    { id: 'cafe', name: 'Cafe', icon: 'cafe-outline' },
    { id: 'fast-food', name: 'Fast Food', icon: 'fast-food-outline' },
    { id: 'dessert', name: 'Dessert', icon: 'ice-cream-outline' },
    { id: 'beverage', name: 'Beverage', icon: 'wine-outline' }
];

const { width } = Dimensions.get('window');

export default function EnhancedHomeScreen({ navigation }) {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [promotionalAds, setPromotionalAds] = useState([]);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [vendorLogos, setVendorLogos] = useState({});
    const [menuImages, setMenuImages] = useState({});

    useEffect(() => {
        fetchInitialData();
        setupSocketListeners();

        return () => {
            socketService.off('vendor_status_changed');
            socketService.off('vendor_menu_updated');
        };
    }, []);

    const fetchInitialData = async () => {
        await Promise.all([
            fetchVendors(),
            fetchAllMenuItems(),
            generatePromotionalAds()
        ]);
    };

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

        socketService.on('vendor_menu_updated', (data) => {
            console.log('📱 Vendor menu updated:', data);
            // Could trigger a refresh or show a notification
        });
    };

    const fetchVendors = async () => {
        try {
            // Use fetch instead of axios for better reliability
            const response = await fetch('http://192.168.5.110:5000/api/vendors?sortBy=rating', {
                headers: {
                    'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const vendorList = data.data.vendors;
            setVendors(vendorList);

            // Load vendor logos
            loadVendorLogos(vendorList);
        } catch (error) {
            console.error('Error fetching vendors:', error);
            Alert.alert('Error', 'Failed to load restaurants');
        }
    };

    const fetchAllMenuItems = async () => {
        try {
            const response = await fetch('http://192.168.5.110:5000/api/vendors?sortBy=rating', {
                headers: {
                    'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const vendorList = data.data.vendors;

            // Collect all menu items from all vendors
            const allMenuItems = [];
            vendorList.forEach(vendor => {
                if (vendor.menu && vendor.menu.length > 0) {
                    vendor.menu.forEach(item => {
                        allMenuItems.push({
                            ...item,
                            vendorId: vendor._id,
                            vendorName: vendor.businessName,
                            vendor: vendor
                        });
                    });
                }
            });

            // Shuffle and take first 20 items for variety
            const shuffledItems = allMenuItems.sort(() => 0.5 - Math.random()).slice(0, 20);
            setMenuItems(shuffledItems);

            // Load menu item images
            loadMenuImages(shuffledItems);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    const generatePromotionalAds = async () => {
        try {
            const response = await fetch('http://192.168.5.110:5000/api/vendors?sortBy=rating', {
                headers: {
                    'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const vendorList = data.data.vendors;

            // Create promotional ads from top restaurants
            const ads = vendorList.slice(0, 3).map((vendor, index) => ({
                id: vendor._id,
                vendor: vendor,
                title: vendor.businessName,
                offer: getOfferText(index),
                backgroundColor: getAdBackgroundColor(index),
                image: vendor.logo
            }));

            setPromotionalAds(ads);
        } catch (error) {
            console.error('Error generating promotional ads:', error);
        }
    };

    const getOfferText = (index) => {
        const offers = [
            '🔥 30% OFF on first order',
            '🚚 Free delivery today only',
            '⭐ Get 2 items for price of 1'
        ];
        return offers[index] || '🍽️ Special offer available';
    };

    const getAdBackgroundColor = (index) => {
        const colors = [
            ['#FF6B35', '#FF8E53'],
            ['#4ECDC4', '#44A08D'],
            ['#A8E6CF', '#7FCDCD']
        ];
        return colors[index] || ['#FF6B35', '#FF8E53'];
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

    const loadMenuImages = async (menuItemsList) => {
        const imagePromises = menuItemsList.map(async (item) => {
            try {
                const imageBase64 = await imageService.getMenuItemImageBase64(item.vendorId, item._id);
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

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInitialData();
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

    const handleMenuItemPress = (item) => {
        setSelectedMenuItem(item);
        setModalVisible(true);
    };

    const handleAddToCart = () => {
        if (selectedMenuItem) {
            dispatch(addToCart({
                menuItemId: selectedMenuItem._id,
                name: selectedMenuItem.name,
                price: selectedMenuItem.price,
                vendorId: selectedMenuItem.vendorId,
                vendorName: selectedMenuItem.vendorName,
                image: menuImages[selectedMenuItem._id],
                quantity: 1
            }));
            setModalVisible(false);
            Alert.alert('Added to Cart', `${selectedMenuItem.name} has been added to your cart!`);
        }
    };

    const handleRestaurantsBannerPress = () => {
        navigation.navigate('RestaurantsList');
    };

    const handlePromotionalAdPress = (ad) => {
        navigation.navigate('VendorDetails', { vendor: ad.vendor });
    };



    const renderPromotionalAd = ({ item }) => (
        <TouchableOpacity
            style={styles.adCard}
            onPress={() => handlePromotionalAdPress(item)}
        >
            <LinearGradient
                colors={item.backgroundColor}
                style={styles.adGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.adContent}>
                    <View style={styles.adTextContainer}>
                        <Text style={styles.adTitle} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.adOffer} numberOfLines={2}>
                            {item.offer}
                        </Text>
                    </View>
                    <View style={styles.adImageContainer}>
                        {vendorLogos[item.id] ? (
                            <Image
                                source={{ uri: vendorLogos[item.id] }}
                                style={styles.adImage}
                            />
                        ) : (
                            <View style={styles.adPlaceholder}>
                                <Ionicons name="restaurant" size={20} color="#fff" />
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    if (loading) {
        setLoading(false); // Remove loading since we're using the new design
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Ionicons name="notifications-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>What would you like to eat today?</Text>
                </View>

                {/* Restaurants You Love Banner */}
                <TouchableOpacity style={styles.bannerContainer} onPress={handleRestaurantsBannerPress}>
                    <LinearGradient
                        colors={['#FF6B35', '#FF8E53']}
                        style={styles.bannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerEmoji}>🍽️</Text>
                            <Text style={styles.bannerTitle}>Restaurants You Love</Text>
                            <Text style={styles.bannerSubtitle}>Discover amazing restaurants near you</Text>
                            <Ionicons name="arrow-forward" size={24} color="#fff" style={styles.bannerArrow} />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Menu Items Section - Single Container with 2 Rows */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>🔥 Popular Dishes</Text>
                    {menuItems.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.menuScrollContainer}
                            contentContainerStyle={styles.menuScrollContent}
                            bounces={false}
                            decelerationRate="fast"
                        >
                            <View style={styles.menuGrid}>
                                {/* First Row */}
                                <View style={styles.menuRowContainer}>
                                    {menuItems.slice(0, Math.ceil(menuItems.length / 2)).map((item) => (
                                        <TouchableOpacity
                                            key={`row1-${item.vendorId}-${item._id}`}
                                            style={styles.menuItemCard}
                                            onPress={() => handleMenuItemPress(item)}
                                        >
                                            <View style={styles.menuItemImage}>
                                                {menuImages[item._id] ? (
                                                    <Image
                                                        source={{ uri: menuImages[item._id] }}
                                                        style={styles.menuImage}
                                                    />
                                                ) : (
                                                    <View style={styles.menuPlaceholder}>
                                                        <Ionicons name="fast-food" size={24} color="#ccc" />
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.menuItemName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.menuItemPrice}>${item.price}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {/* Second Row */}
                                <View style={styles.menuRowContainer}>
                                    {menuItems.slice(Math.ceil(menuItems.length / 2)).map((item) => (
                                        <TouchableOpacity
                                            key={`row2-${item.vendorId}-${item._id}`}
                                            style={styles.menuItemCard}
                                            onPress={() => handleMenuItemPress(item)}
                                        >
                                            <View style={styles.menuItemImage}>
                                                {menuImages[item._id] ? (
                                                    <Image
                                                        source={{ uri: menuImages[item._id] }}
                                                        style={styles.menuImage}
                                                    />
                                                ) : (
                                                    <View style={styles.menuPlaceholder}>
                                                        <Ionicons name="fast-food" size={24} color="#ccc" />
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.menuItemName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <Text style={styles.menuItemPrice}>${item.price}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>
                    ) : (
                        <View style={styles.emptySection}>
                            <ActivityIndicator size="small" color="#FF6B35" />
                            <Text style={styles.emptySectionText}>Loading delicious dishes...</Text>
                        </View>
                    )}
                </View>

                {/* Promotional Ads Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>🎉 Special Offers</Text>
                    {promotionalAds.length > 0 ? (
                        <FlatList
                            data={promotionalAds}
                            renderItem={renderPromotionalAd}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.adsList}
                        />
                    ) : (
                        <View style={styles.emptySection}>
                            <ActivityIndicator size="small" color="#FF6B35" />
                            <Text style={styles.emptySectionText}>Loading special offers...</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Menu Item Quick View Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedMenuItem && (
                            <>
                                <View style={styles.modalImageContainer}>
                                    {menuImages[selectedMenuItem._id] ? (
                                        <Image
                                            source={{ uri: menuImages[selectedMenuItem._id] }}
                                            style={styles.modalImage}
                                        />
                                    ) : (
                                        <View style={styles.modalPlaceholder}>
                                            <Ionicons name="fast-food" size={40} color="#ccc" />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.modalItemName}>{selectedMenuItem.name}</Text>
                                <Text style={styles.modalVendorName}>from {selectedMenuItem.vendorName}</Text>
                                <Text style={styles.modalItemPrice}>${selectedMenuItem.price}</Text>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.modalCancelButton}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.modalCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalAddButton}
                                        onPress={handleAddToCart}
                                    >
                                        <Text style={styles.modalAddText}>Add to Cart</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 50,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationButton: {
        padding: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Banner Styles
    bannerContainer: {
        margin: 20,
        marginTop: 10,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    bannerGradient: {
        padding: 24,
        minHeight: 120,
        justifyContent: 'center',
    },
    bannerContent: {
        alignItems: 'center',
        position: 'relative',
    },
    bannerEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        opacity: 0.9,
    },
    bannerArrow: {
        position: 'absolute',
        right: 0,
        top: '50%',
        marginTop: -12,
    },

    // Section Styles
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 20,
        marginBottom: 16,
    },
    emptySection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptySectionText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },

    // Menu Items Styles - Single Container with 2 Rows
    menuScrollContainer: {
        height: 280,
    },
    menuScrollContent: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    menuGrid: {
        flexDirection: 'column',
        height: '100%',
    },
    menuRowContainer: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
        marginBottom: 8,
    },
    menuItemCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginRight: 16,
        padding: 12,
        width: 140,
        height: 130, // Fixed height for consistency
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    menuItemImage: {
        width: '100%',
        height: 70,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },
    menuImage: {
        width: '100%',
        height: '100%',
    },
    menuPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 1,
        lineHeight: 18,
    },
    menuItemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B35',
    },

    // Promotional Ads Styles
    adsList: {
        paddingLeft: 20,
    },
    adCard: {
        marginRight: 16,
        borderRadius: 16,
        overflow: 'hidden',
        width: width * 0.75,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    adGradient: {
        padding: 20,
        minHeight: 100,
    },
    adContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    adTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    adTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    adOffer: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        lineHeight: 20,
    },
    adImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    adImage: {
        width: '100%',
        height: '100%',
    },
    adPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 300,
    },
    modalImageContainer: {
        width: '100%',
        height: 150,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalItemName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalVendorName: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    modalItemPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B35',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 16,
        marginRight: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    modalAddButton: {
        flex: 1,
        paddingVertical: 16,
        marginLeft: 8,
        borderRadius: 12,
        backgroundColor: '#FF6B35',
        alignItems: 'center',
    },
    modalAddText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});
