import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    Switch
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { imageService } from '../../services/imageService';
import { createMenuItem, updateMenuItem } from '../../store/slices/menuSlice';
import { socketService } from '../../services/socketService';

const CATEGORIES = [
    { label: 'Appetizer', value: 'appetizer' },
    { label: 'Main Course', value: 'main-course' },
    { label: 'Dessert', value: 'dessert' },
    { label: 'Beverage', value: 'beverage' },
    { label: 'Snack', value: 'snack' }
];

const SPICE_LEVELS = [
    { label: 'Mild', value: 'mild' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hot', value: 'hot' },
    { label: 'Extra Hot', value: 'extra-hot' }
];

export default function AddEditMenuItemScreen({ navigation, route }) {
    const dispatch = useDispatch();
    const { token, user } = useSelector((state) => state.auth);
    const { vendorId } = useSelector((state) => state.menu);

    const isEditing = route.params?.isEditing || false;
    const existingItem = route.params?.menuItem || null;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'main-course',
        preparationTime: '15',
        isVegetarian: false,
        spiceLevel: 'mild',
        isAvailable: true
    });

    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEditing && existingItem) {
            setFormData({
                name: existingItem.name || '',
                description: existingItem.description || '',
                price: existingItem.price?.toString() || '',
                category: existingItem.category || 'main-course',
                preparationTime: existingItem.preparationTime?.toString() || '15',
                isVegetarian: existingItem.isVegetarian || false,
                spiceLevel: existingItem.spiceLevel || 'mild',
                isAvailable: existingItem.isAvailable !== undefined ? existingItem.isAvailable : true
            });

            // Load existing image if available
            if (existingItem._id && vendorId) {
                loadExistingImage();
            }
        }
    }, [existingItem, vendorId]);

    const loadExistingImage = async () => {
        try {
            const base64Image = await imageService.getMenuItemImageBase64(vendorId, existingItem._id);
            if (base64Image) {
                setImageUri(base64Image);
            }
        } catch (error) {
            console.log('No existing image found or error loading image');
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const showImagePicker = () => {
        Alert.alert(
            'Select Image',
            'Choose how you want to add an image',
            [
                { text: 'Camera', onPress: takePhoto },
                { text: 'Gallery', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const takePhoto = async () => {
        try {
            const result = await imageService.takePhoto();
            if (result) {
                setImageUri(result.uri);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const pickImage = async () => {
        try {
            const result = await imageService.pickImage();
            if (result) {
                setImageUri(result.uri);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter item name');
            return false;
        }
        if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
            Alert.alert('Error', 'Please enter a valid price');
            return false;
        }
        if (!formData.preparationTime || isNaN(parseInt(formData.preparationTime)) || parseInt(formData.preparationTime) <= 0) {
            Alert.alert('Error', 'Please enter valid preparation time');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setUploading(true);

        try {
            const menuItemData = {
                ...formData,
                price: parseFloat(formData.price),
                preparationTime: parseInt(formData.preparationTime)
            };

            let result;

            if (isEditing) {
                if (imageUri && !imageUri.startsWith('data:')) {
                    // New image selected
                    result = await imageService.updateMenuItemImage(
                        vendorId,
                        existingItem._id,
                        menuItemData,
                        imageUri,
                        token
                    );
                } else {
                    // No new image, update text data only
                    result = await dispatch(updateMenuItem({
                        vendorId,
                        itemId: existingItem._id,
                        menuItemData
                    })).unwrap();
                }

                // Emit socket event for real-time updates
                socketService.emit('menu_item_updated', {
                    vendorId,
                    menuItem: result.data?.menuItem || result.data
                });

                Alert.alert('Success', 'Menu item updated successfully!');
            } else {
                if (imageUri) {
                    result = await imageService.uploadMenuItemImage(
                        vendorId,
                        menuItemData,
                        imageUri,
                        token
                    );
                } else {
                    result = await dispatch(createMenuItem({
                        vendorId,
                        menuItem: menuItemData
                    })).unwrap();
                }

                // Emit socket event for real-time updates
                socketService.emit('menu_item_added', {
                    vendorId,
                    menuItem: result.data?.menuItem || result.data
                });

                Alert.alert('Success', 'Menu item added successfully!');
            }

            navigation.goBack();
        } catch (error) {
            console.error('Error saving menu item:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save menu item');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Menu Item' : 'Add Menu Item'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Image Section */}
                <TouchableOpacity style={styles.imageContainer} onPress={showImagePicker}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera" size={32} color="#666" />
                            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.form}>
                    <Text style={styles.label}>Item Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(value) => updateFormData('name', value)}
                        placeholder="Enter item name"
                        maxLength={50}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(value) => updateFormData('description', value)}
                        placeholder="Enter item description"
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                    />

                    <Text style={styles.label}>Price ($) *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.price}
                        onChangeText={(value) => updateFormData('price', value)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />

                    <Text style={styles.label}>Category *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.category}
                            onValueChange={(value) => updateFormData('category', value)}
                            style={styles.picker}
                        >
                            {CATEGORIES.map((category) => (
                                <Picker.Item
                                    key={category.value}
                                    label={category.label}
                                    value={category.value}
                                />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Preparation Time (minutes) *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.preparationTime}
                        onChangeText={(value) => updateFormData('preparationTime', value)}
                        placeholder="15"
                        keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Spice Level</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.spiceLevel}
                            onValueChange={(value) => updateFormData('spiceLevel', value)}
                            style={styles.picker}
                        >
                            {SPICE_LEVELS.map((level) => (
                                <Picker.Item
                                    key={level.value}
                                    label={level.label}
                                    value={level.value}
                                />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Vegetarian</Text>
                        <Switch
                            value={formData.isVegetarian}
                            onValueChange={(value) => updateFormData('isVegetarian', value)}
                            trackColor={{ false: '#767577', true: '#4CAF50' }}
                            thumbColor={formData.isVegetarian ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Available</Text>
                        <Switch
                            value={formData.isAvailable}
                            onValueChange={(value) => updateFormData('isAvailable', value)}
                            trackColor={{ false: '#767577', true: '#4CAF50' }}
                            thumbColor={formData.isAvailable ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>
                        {isEditing ? 'Update Item' : 'Add Item'}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    imageContainer: {
        height: 200,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        marginTop: 8,
        fontSize: 16,
        color: '#666',
    },
    form: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    picker: {
        height: 50,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    submitButton: {
        backgroundColor: '#FF6B35',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
