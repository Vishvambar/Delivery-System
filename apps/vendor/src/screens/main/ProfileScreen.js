import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../../store/slices/authSlice';
import { apiService } from '../../services/apiService';

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(true);
    const [vendorProfile, setVendorProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch vendor profile and restaurant status
    useEffect(() => {
        const fetchVendorProfile = async () => {
            try {
                if (!user?._id) return;

                const response = await fetch('http://192.168.5.110:5000/api/vendors?includeAll=true', {
                    headers: {
                        'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('📱 Vendor profile API response:', data);

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
                        console.warn('⚠️ Unexpected vendor data format:', data);
                        return;
                    }

                    console.log('📱 Processing vendors array:', vendors.length, 'vendors');

                    if (vendors.length === 0) {
                        console.warn('⚠️ No vendors found in response');
                        return;
                    }

                    const userVendor = vendors.find(vendor => {
                        const vendorUserId = vendor.userId?._id || vendor.userId;
                        return vendorUserId === user._id;
                    });

                    if (userVendor) {
                        console.log('✅ Found vendor profile:', userVendor.businessName);
                        setVendorProfile(userVendor);
                        setIsOpen(userVendor.isOpen ?? true);
                    } else {
                        console.warn('⚠️ No vendor profile found for user ID:', user._id);
                    }
                }
            } catch (error) {
                console.error('❌ Error fetching vendor profile:', error);
            }
        };

        fetchVendorProfile();
    }, [user]);

    // Handle restaurant status toggle
    const handleStatusToggle = async (newStatus) => {
        if (!vendorProfile) {
            Alert.alert('Error', 'Unable to update restaurant status. Please try again.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.put('/vendors/profile', {
                isOpen: newStatus
            });

            if (response.data.success) {
                setIsOpen(newStatus);
                setVendorProfile(prev => ({ ...prev, isOpen: newStatus }));

                Alert.alert(
                    'Status Updated',
                    `Your restaurant is now ${newStatus ? 'open' : 'closed'} for orders.`
                );
            } else {
                throw new Error(response.data.message || 'Update failed');
            }
        } catch (error) {
            console.error('❌ Error updating restaurant status:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update restaurant status. Please try again.';
            Alert.alert('Error', errorMessage);
            // Revert the toggle
            setIsOpen(!newStatus);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logoutUser())
                },
            ]
        );
    };

    const ProfileItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
        <TouchableOpacity style={styles.profileItem} onPress={onPress}>
            <View style={styles.profileItemLeft}>
                <Ionicons name={icon} size={24} color="#FF6B35" />
                <View style={styles.profileItemText}>
                    <Text style={styles.profileItemTitle}>{title}</Text>
                    {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {rightComponent || <Ionicons name="chevron-forward" size={20} color="#ccc" />}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            {/* User Info Section */}
            <View style={styles.userSection}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'V'}
                    </Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Vendor'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
                {vendorProfile?.businessName && (
                    <Text style={styles.businessName}>{vendorProfile.businessName}</Text>
                )}
                {vendorProfile?.category && (
                    <Text style={styles.businessCategory}>{vendorProfile.category}</Text>
                )}

                {/* Restaurant Status */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Restaurant Status</Text>
                    <View style={styles.statusToggle}>
                        <Text style={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</Text>
                        <Switch
                            value={isOpen}
                            onValueChange={handleStatusToggle}
                            disabled={loading}
                            trackColor={{ false: '#ccc', true: '#FF6B35' }}
                            thumbColor={isOpen ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>
            </View>

            {/* Business Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business</Text>

                <ProfileItem
                    icon="restaurant-outline"
                    title="Restaurant Details"
                    subtitle="Update business information"
                    onPress={() => navigation.navigate('RestaurantDetails')}
                />

                <ProfileItem
                    icon="time-outline"
                    title="Operating Hours"
                    subtitle="Set your opening hours"
                    onPress={() => navigation.navigate('OperatingHours')}
                />

                <ProfileItem
                    icon="cash-outline"
                    title="Pricing & Fees"
                    subtitle="Delivery fees and minimum order"
                    onPress={() => navigation.navigate('PricingFees')}
                />
            </View>

            {/* Analytics Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Analytics</Text>

                <ProfileItem
                    icon="bar-chart-outline"
                    title="Sales Report"
                    subtitle="View your earnings and trends"
                    onPress={() => navigation.navigate('SalesReport')}
                />

                <ProfileItem
                    icon="star-outline"
                    title="Reviews & Ratings"
                    subtitle="Customer feedback"
                    onPress={() => navigation.navigate('ReviewsRatings')}
                />
            </View>

            {/* Support Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>

                <ProfileItem
                    icon="help-circle-outline"
                    title="Help Center"
                    subtitle="FAQs and support"
                    onPress={() => navigation.navigate('HelpCenter')}
                />

                <ProfileItem
                    icon="chatbubble-outline"
                    title="Contact Support"
                    subtitle="Get help from our team"
                    onPress={() => Alert.alert('Contact Support', 'Email us at vendor-support@fooddelivery.com')}
                />
            </View>

            {/* Legal Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Legal</Text>

                <ProfileItem
                    icon="document-text-outline"
                    title="Vendor Agreement"
                    onPress={() => Alert.alert('Vendor Agreement', 'By using this platform, you agree to our vendor terms and conditions.')}
                />

                <ProfileItem
                    icon="shield-outline"
                    title="Privacy Policy"
                    onPress={() => Alert.alert('Privacy Policy', 'We protect your business data and customer information.')}
                />
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#F44336" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.versionText}>Vendor App v1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    userSection: {
        backgroundColor: 'white',
        alignItems: 'center',
        padding: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    businessName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FF6B35',
        marginBottom: 3,
    },
    businessCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textTransform: 'capitalize',
    },
    statusContainer: {
        width: '100%',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    statusToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 15,
    },
    section: {
        backgroundColor: 'white',
        marginTop: 15,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileItemText: {
        marginLeft: 15,
        flex: 1,
    },
    profileItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    profileItemSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        marginTop: 15,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#F44336',
        marginLeft: 10,
    },
    footer: {
        alignItems: 'center',
        padding: 20,
    },
    versionText: {
        fontSize: 14,
        color: '#999',
    },
});
