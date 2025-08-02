import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Switch,
    ActivityIndicator,
    Image
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/apiService';

export default function RestaurantDetailsScreen({ navigation }) {
    const { user } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        businessName: '',
        category: 'restaurant',
        cuisineType: [],
        description: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        isActive: true
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [vendorId, setVendorId] = useState(null);
    const [logoUri, setLogoUri] = useState(null);
    const [logoUploading, setLogoUploading] = useState(false);

    // Request permissions on component mount
    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload your restaurant logo!');
            }
        })();
    }, []);

    // Load vendor data on component mount
    useEffect(() => {
        const fetchVendorData = async () => {
            try {
                const response = await apiService.get('/vendors?includeAll=true');
                const data = response.data;

                // Handle different response formats
                let vendors = [];
                if (data.data && data.data.vendors && Array.isArray(data.data.vendors)) {
                    vendors = data.data.vendors;
                } else if (data.data && Array.isArray(data.data)) {
                    vendors = data.data;
                } else if (data.success && Array.isArray(data.vendors)) {
                    vendors = data.vendors;
                } else if (Array.isArray(data)) {
                    vendors = data;
                }

                const userVendor = vendors.find(vendor => {
                    const vendorUserId = vendor.userId?._id || vendor.userId;
                    return vendorUserId === user._id;
                });

                if (userVendor) {
                    console.log('✅ Found vendor data:', userVendor.businessName);
                    setVendorId(userVendor._id);

                    // Populate form with vendor data
                    setFormData({
                        businessName: userVendor.businessName || '',
                        category: userVendor.category || 'restaurant',
                        cuisineType: userVendor.cuisineType || [],
                        description: userVendor.description || '',
                        address: userVendor.location?.address || '',
                        city: userVendor.location?.city || '',
                        state: userVendor.location?.state || '',
                        zipCode: userVendor.location?.zipCode || '',
                        phone: user.phone || '',
                        isActive: userVendor.isOpen ?? true
                    });

                    // Load logo if it exists
                    if (userVendor.logo && userVendor.logo.data) {
                        const logoUrl = `http://192.168.5.110:5000/api/images/vendor-logo/${userVendor._id}`;
                        setLogoUri(logoUrl);
                    }
                } else {
                    console.warn('⚠️ No vendor profile found for user');
                    Alert.alert('Error', 'Vendor profile not found. Please contact support.');
                }
            } catch (error) {
                console.error('❌ Error fetching vendor data:', error);
                Alert.alert('Error', 'Failed to load restaurant details');
            } finally {
                setInitialLoading(false);
            }
        };

        if (user?._id) {
            fetchVendorData();
        }
    }, [user]);

    const categories = [
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'cafe', label: 'Cafe' },
        { value: 'bakery', label: 'Bakery' },
        { value: 'fast-food', label: 'Fast Food' },
        { value: 'dessert', label: 'Dessert' },
        { value: 'beverage', label: 'Beverage' }
    ];

    const cuisineTypes = [
        'american', 'chinese', 'italian', 'mexican', 'indian',
        'thai', 'japanese', 'french', 'mediterranean', 'pizza', 'burger', 'seafood'
    ];

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleCuisineType = (cuisine) => {
        setFormData(prev => ({
            ...prev,
            cuisineType: prev.cuisineType.includes(cuisine)
                ? prev.cuisineType.filter(c => c !== cuisine)
                : [...prev.cuisineType, cuisine]
        }));
    };

    const handleSave = async () => {
        // Basic validation
        if (!formData.businessName.trim()) {
            Alert.alert('Error', 'Business name is required');
            return;
        }
        if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
            Alert.alert('Error', 'Complete address is required');
            return;
        }
        if (formData.cuisineType.length === 0) {
            Alert.alert('Error', 'Please select at least one cuisine type');
            return;
        }

        if (!vendorId) {
            Alert.alert('Error', 'Vendor profile not found. Cannot save changes.');
            return;
        }

        setLoading(true);

        try {
            // Prepare data for backend
            const updateData = {
                businessName: formData.businessName.trim(),
                category: formData.category,
                cuisineType: formData.cuisineType,
                description: formData.description.trim(),
                location: {
                    address: formData.address.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    zipCode: formData.zipCode.trim(),
                    coordinates: {
                        latitude: 0, // You might want to add geocoding here
                        longitude: 0
                    }
                },
                isOpen: formData.isActive
            };

            // Also update user phone if it changed
            if (formData.phone !== user.phone) {
                try {
                    await apiService.put('/auth/profile', {
                        phone: formData.phone
                    });
                } catch (phoneError) {
                    console.warn('⚠️ Failed to update phone number:', phoneError);
                }
            }

            const response = await apiService.put('/vendors/profile', updateData);

            if (response.data.success) {
                Alert.alert('Success', 'Restaurant details updated successfully!');
                navigation.goBack();
            } else {
                throw new Error(response.data.message || 'Update failed');
            }
        } catch (error) {
            console.error('❌ Error saving restaurant details:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save restaurant details';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Square aspect ratio for logo
            quality: 0.8,
            base64: false,
        });

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setLogoUri(imageUri);
            await uploadLogo(imageUri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: false,
        });

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setLogoUri(imageUri);
            await uploadLogo(imageUri);
        }
    };

    const showImageOptions = () => {
        Alert.alert(
            'Restaurant Logo',
            'Choose an option to upload your restaurant logo',
            [
                { text: 'Camera', onPress: takePhoto },
                { text: 'Photo Library', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const uploadLogo = async (imageUri) => {
        if (!vendorId) {
            Alert.alert('Error', 'Vendor profile not found. Cannot upload logo.');
            return;
        }

        setLogoUploading(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('logo', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'logo.jpg',
            });

            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`http://192.168.5.110:5000/api/vendors/${vendorId}/logo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                Alert.alert('Success', 'Restaurant logo uploaded successfully!');
                // Update the logo URL to force refresh with timestamp
                const logoUrl = `http://192.168.5.110:5000/api/images/vendor-logo/${vendorId}?t=${Date.now()}`;
                setLogoUri(logoUrl);
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Error uploading logo:', error);
            Alert.alert('Error', 'Failed to upload logo. Please try again.');
            setLogoUri(null); // Reset on error
        } finally {
            setLogoUploading(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, multiline = false, ...props }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                multiline={multiline}
                {...props}
            />
        </View>
    );

    const CategorySelector = () => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.value}
                        style={[
                            styles.categoryChip,
                            formData.category === category.value && styles.categoryChipActive
                        ]}
                        onPress={() => updateField('category', category.value)}
                    >
                        <Text style={[
                            styles.categoryChipText,
                            formData.category === category.value && styles.categoryChipTextActive
                        ]}>
                            {category.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const CuisineTypeSelector = () => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>Cuisine Types</Text>
            <View style={styles.cuisineContainer}>
                {cuisineTypes.map((cuisine) => (
                    <TouchableOpacity
                        key={cuisine}
                        style={[
                            styles.cuisineChip,
                            formData.cuisineType.includes(cuisine) && styles.cuisineChipActive
                        ]}
                        onPress={() => toggleCuisineType(cuisine)}
                    >
                        <Text style={[
                            styles.cuisineChipText,
                            formData.cuisineType.includes(cuisine) && styles.cuisineChipTextActive
                        ]}>
                            {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (initialLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>Loading restaurant details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Restaurant Logo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Restaurant Logo</Text>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoDisplay}>
                            {logoUri ? (
                                <Image source={{ uri: logoUri }} style={styles.logoImage} />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Ionicons name="restaurant-outline" size={40} color="#ccc" />
                                    <Text style={styles.logoPlaceholderText}>No Logo</Text>
                                </View>
                            )}
                            {logoUploading && (
                                <View style={styles.logoOverlay}>
                                    <ActivityIndicator size="small" color="#FF6B35" />
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.logoButton}
                            onPress={showImageOptions}
                            disabled={logoUploading}
                        >
                            <Ionicons name="camera-outline" size={20} color="#FF6B35" />
                            <Text style={styles.logoButtonText}>
                                {logoUri ? 'Change Logo' : 'Add Logo'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <InputField
                        label="Business Name *"
                        value={formData.businessName}
                        onChangeText={(value) => updateField('businessName', value)}
                        placeholder="Enter your business name"
                    />

                    <CategorySelector />

                    <InputField
                        label="Description"
                        value={formData.description}
                        onChangeText={(value) => updateField('description', value)}
                        placeholder="Describe your restaurant..."
                        multiline={true}
                        numberOfLines={4}
                    />

                    <CuisineTypeSelector />
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    <InputField
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(value) => updateField('phone', value)}
                        placeholder="(555) 123-4567"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Location */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>

                    <InputField
                        label="Street Address *"
                        value={formData.address}
                        onChangeText={(value) => updateField('address', value)}
                        placeholder="123 Main Street"
                    />

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <InputField
                                label="City *"
                                value={formData.city}
                                onChangeText={(value) => updateField('city', value)}
                                placeholder="New York"
                            />
                        </View>
                        <View style={styles.halfWidth}>
                            <InputField
                                label="State *"
                                value={formData.state}
                                onChangeText={(value) => updateField('state', value)}
                                placeholder="NY"
                            />
                        </View>
                    </View>

                    <InputField
                        label="ZIP Code"
                        value={formData.zipCode}
                        onChangeText={(value) => updateField('zipCode', value)}
                        placeholder="10001"
                        keyboardType="numeric"
                    />
                </View>

                {/* Status */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Restaurant Status</Text>

                    <View style={styles.statusContainer}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusLabel}>Active Status</Text>
                            <Text style={styles.statusDescription}>
                                Toggle your restaurant's active status
                            </Text>
                        </View>
                        <Switch
                            value={formData.isActive}
                            onValueChange={(value) => updateField('isActive', value)}
                            trackColor={{ false: '#ccc', true: '#FF6B35' }}
                            thumbColor={formData.isActive ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <Text style={styles.saveButtonText}>Saving...</Text>
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={20} color="white" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    section: {
        backgroundColor: 'white',
        marginBottom: 15,
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    categoryChipActive: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#666',
    },
    categoryChipTextActive: {
        color: 'white',
        fontWeight: '500',
    },
    cuisineContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    cuisineChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        marginBottom: 5,
    },
    cuisineChipActive: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
    },
    cuisineChipText: {
        fontSize: 13,
        color: '#666',
    },
    cuisineChipTextActive: {
        color: 'white',
        fontWeight: '500',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    statusDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    footer: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    saveButton: {
        backgroundColor: '#FF6B35',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logoDisplay: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
        position: 'relative',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#e9ecef',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoPlaceholderText: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 5,
    },
    logoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 60,
    },
    logoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#FF6B35',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    logoButtonText: {
        color: '#FF6B35',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
});
