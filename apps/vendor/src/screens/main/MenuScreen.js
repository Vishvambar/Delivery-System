import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
    selectFilteredMenuItems,
    selectMenuStats,
    selectMenuFilter,
    toggleMenuItemAvailability,
    setFilter,
    setVendorId,
    deleteMenuItem,
    fetchMenuItems,
    deleteMenuItemAPI
} from '../../store/slices/menuSlice';
import { dataSyncService } from '../../services/dataSync';

export default function MenuScreen({ navigation }) {
    const dispatch = useDispatch();
    const menuItems = useSelector(selectFilteredMenuItems);
    const menuStats = useSelector(selectMenuStats);
    const currentFilter = useSelector(selectMenuFilter);
    const { loading } = useSelector((state) => state.menu);
    const { user } = useSelector((state) => state.auth);

    const [selectedItems, setSelectedItems] = useState([]);

    // State for vendor profile
    const [vendorId, setVendorIdState] = useState(null);

    // Fetch vendor profile and menu items on component mount
    React.useEffect(() => {
        const fetchVendorProfile = async () => {
            try {
                console.log('📱 Vendor: Fetching vendor profile for user:', user?._id);

                if (!user?._id) {
                    console.error('❌ No user ID available');
                    return;
                }

                // Get all vendors and find the one that belongs to this user
                const response = await fetch('http://192.168.5.110:5000/api/vendors?includeAll=true', {
                    headers: {
                        'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('📱 Menu: Vendor API response:', data);

                    // Handle different response formats
                    let vendors = [];
                    if (data.data && data.data.vendors && Array.isArray(data.data.vendors)) {
                        // Nested structure: {data: {vendors: [...]}}
                        vendors = data.data.vendors;
                    } else if (data.data && Array.isArray(data.data)) {
                        // Direct structure: {data: [...]}
                        vendors = data.data;
                    } else if (data.success && Array.isArray(data.vendors)) {
                        // Alternative structure: {success: true, vendors: [...]}
                        vendors = data.vendors;
                    } else if (Array.isArray(data)) {
                        // Direct array
                        vendors = data;
                    } else {
                        console.warn('⚠️ Menu: Unexpected vendor data format:', data);
                        return;
                    }

                    console.log('📱 Menu: Processing vendors array:', vendors.length, 'vendors');

                    // Find vendor profile for this user
                    const userVendor = vendors.find(vendor => {
                        const vendorUserId = vendor.userId?._id || vendor.userId;
                        return vendorUserId === user._id;
                    });

                    if (userVendor) {
                        console.log('✅ Found vendor profile:', userVendor._id);
                        setVendorIdState(userVendor._id);
                        dispatch(setVendorId(userVendor._id));
                        dispatch(fetchMenuItems(userVendor._id));

                        // Save initial menu data to shared storage
                        setTimeout(() => {
                            console.log('📱 Vendor: Force saving current menu to shared storage');
                            const currentMenuItems = menuItems.length > 0 ? JSON.parse(JSON.stringify(menuItems)) : [];
                            dataSyncService.saveMenuItems(userVendor._id, currentMenuItems);
                        }, 2000);
                    } else {
                        console.warn('⚠️ No vendor profile found for user:', user._id);
                        Alert.alert(
                            'Profile Required',
                            'Please complete your vendor profile to manage menu items.',
                            [{ text: 'OK' }]
                        );
                    }
                } else {
                    console.error('❌ Failed to fetch vendors');
                }
            } catch (error) {
                console.error('❌ Error fetching vendor profile:', error);
            }
        };

        if (user?._id) {
            fetchVendorProfile();
        }
    }, [dispatch, user]);

    const handleToggleAvailability = (itemId) => {
        dispatch(toggleMenuItemAvailability(itemId));
    };

    const handleDeleteItem = (item) => {
        Alert.alert(
            'Delete Menu Item',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!vendorId) {
                                Alert.alert('Error', 'Vendor ID not found. Please try again.');
                                return;
                            }
                            await dispatch(deleteMenuItemAPI({
                                vendorId,
                                itemId: item._id
                            })).unwrap();

                            // Emit socket event for real-time updates
                            socketService.emit('menu_item_deleted', {
                                vendorId,
                                menuItemId: item._id
                            });
                        } catch (error) {
                            Alert.alert('Error', error || 'Failed to delete menu item.');
                        }
                    }
                }
            ]
        );
    };

    const renderMenuItem = ({ item }) => (
        <View style={styles.menuItem}>
            <TouchableOpacity
                style={styles.itemContent}
                onPress={() => navigation.navigate('AddEditMenuItem', { isEditing: true, menuItem: item })}
            >
                {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                )}
                <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemBadges}>
                            {item.isVegetarian && (
                                <View style={styles.vegBadge}>
                                    <Text style={styles.vegText}>V</Text>
                                </View>
                            )}
                            <View style={[
                                styles.availabilityBadge,
                                { backgroundColor: item.isAvailable ? '#4CAF50' : '#F44336' }
                            ]}>
                                <Text style={styles.availabilityText}>
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.itemMeta}>
                        <Text style={styles.itemCategory}>{item.category}</Text>
                        <Text style={styles.itemTime}>🕒 {item.preparationTime}min</Text>
                    </View>
                    <Text style={styles.itemPrice}>${(item.price || 0).toFixed(2)}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.itemActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleToggleAvailability(item._id)}
                >
                    <Ionicons
                        name={item.isAvailable ? 'eye-off' : 'eye'}
                        size={18}
                        color={item.isAvailable ? '#F44336' : '#4CAF50'}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AddEditMenuItem', { isEditing: true, menuItem: item })}
                >
                    <Ionicons name="pencil" size={18} color="#FF6B35" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteItem(item)}
                >
                    <Ionicons name="trash" size={18} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const FilterButton = ({ filter, label, count }) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                currentFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => dispatch(setFilter(filter))}
        >
            <Text style={[
                styles.filterText,
                currentFilter === filter && styles.activeFilterText
            ]}>
                {label} ({count})
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Menu Management</Text>
                    <Text style={styles.subtitle}>{menuStats.total} items total</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddEditMenuItem', { isEditing: false })}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{menuStats.available}</Text>
                    <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{menuStats.unavailable}</Text>
                    <Text style={styles.statLabel}>Unavailable</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{menuStats.categories}</Text>
                    <Text style={styles.statLabel}>Categories</Text>
                </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {[
                    { key: 'all', filter: 'all', label: 'All', count: menuStats.total },
                    { key: 'available', filter: 'available', label: 'Available', count: menuStats.available },
                    { key: 'unavailable', filter: 'unavailable', label: 'Unavailable', count: menuStats.unavailable }
                ].map((filterData) => (
                    <FilterButton
                        key={filterData.key}
                        filter={filterData.filter}
                        label={filterData.label}
                        count={filterData.count}
                    />
                ))}
            </View>

            {menuItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>No menu items found</Text>
                    <Text style={styles.emptyText}>
                        {currentFilter === 'all'
                            ? 'Add your first menu item to get started'
                            : `No ${currentFilter} items found`}
                    </Text>
                    {currentFilter === 'all' && (
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => navigation.navigate('AddEditMenuItem', { isEditing: false })}
                        >
                            <Text style={styles.emptyButtonText}>Add Menu Item</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={menuItems}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMenuItem}
                    contentContainerStyle={styles.menuList}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        marginRight: 10,
    },
    activeFilterButton: {
        backgroundColor: '#FF6B35',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeFilterText: {
        color: 'white',
    },
    menuList: {
        padding: 15,
    },
    menuItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemContent: {
        flexDirection: 'row',
        padding: 15,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
    },
    itemDetails: {
        flex: 1,
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
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    vegText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    availabilityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    availabilityText: {
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
        marginBottom: 8,
    },
    itemCategory: {
        fontSize: 12,
        color: '#999',
        textTransform: 'capitalize',
    },
    itemTime: {
        fontSize: 12,
        color: '#999',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    itemActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    actionButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    emptyButton: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
