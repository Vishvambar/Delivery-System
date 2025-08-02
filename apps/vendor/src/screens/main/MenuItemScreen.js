import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { permissionsService } from '../../services/permissionsService';
import { 
  createMenuItem, 
  updateMenuItemAPI, 
  deleteMenuItemAPI
} from '../../store/slices/menuSlice';

export default function MenuItemScreen({ route, navigation }) {
  const { item, mode } = route.params || {};
  const isEditMode = mode !== 'add' && item;
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);
  const [menuItemData, setMenuItemData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category: item?.category || 'main-course',
    imageUrl: item?.imageUrl || null,
    isAvailable: item?.isAvailable ?? true,
    preparationTime: item?.preparationTime?.toString() || '15',
    isVegetarian: item?.isVegetarian || false,
    spiceLevel: item?.spiceLevel || 'mild',
    ingredients: item?.ingredients || '',
    allergens: item?.allergens || '',
    nutritionalInfo: item?.nutritionalInfo || {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    }
  });
  
  const [errors, setErrors] = useState({});

  // Initialize permissions when component mounts
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        console.log('🔍 Initializing image picker permissions...');
        await permissionsService.checkAllPermissions();
        setPermissionsReady(true);
        console.log('✅ Permissions initialization complete');
      } catch (error) {
        console.error('❌ Permission initialization failed:', error);
        setPermissionsReady(true); // Still allow the UI to work
      }
    };

    initializePermissions();
  }, []);

  const categories = [
    { value: 'appetizer', label: 'Appetizer', icon: '🥗' },
    { value: 'main-course', label: 'Main Course', icon: '🍽️' },
    { value: 'dessert', label: 'Dessert', icon: '🍰' },
    { value: 'beverage', label: 'Beverage', icon: '🥤' },
    { value: 'snack', label: 'Snack', icon: '🍿' }
  ];

  const spiceLevels = [
    { value: 'mild', label: 'Mild', icon: '🌶️' },
    { value: 'medium', label: 'Medium', icon: '🌶️🌶️' },
    { value: 'hot', label: 'Hot', icon: '🌶️🌶️🌶️' },
    { value: 'extra-hot', label: 'Extra Hot', icon: '🌶️🌶️🌶️🌶️' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!menuItemData.name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (menuItemData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!menuItemData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (menuItemData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!menuItemData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(menuItemData.price)) || parseFloat(menuItemData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!menuItemData.preparationTime.trim()) {
      newErrors.preparationTime = 'Preparation time is required';
    } else if (isNaN(parseInt(menuItemData.preparationTime)) || parseInt(menuItemData.preparationTime) <= 0) {
      newErrors.preparationTime = 'Please enter a valid preparation time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const menuItemPayload = {
        ...menuItemData,
        price: parseFloat(menuItemData.price),
        preparationTime: parseInt(menuItemData.preparationTime)
      };

      // Get the actual vendor ID for the logged-in user
      let vendorId = null;
      try {
        const response = await fetch('http://192.168.5.110:5000/api/vendors', {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
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
            console.warn('⚠️ MenuItem: Unexpected vendor data format:', data);
            throw new Error('Invalid vendor data format');
          }
          
          const userVendor = vendors.find(vendor => {
            const vendorUserId = vendor.userId?._id || vendor.userId;
            return vendorUserId === user._id;
          });
          
          if (userVendor) {
            vendorId = userVendor._id;
          } else {
            throw new Error('No vendor profile found');
          }
        } else {
          throw new Error('Failed to fetch vendor profile');
        }
      } catch (error) {
        console.error('❌ Error getting vendor ID:', error);
        Alert.alert('Error', 'Unable to get vendor information. Please try again.');
        setLoading(false);
        return;
      }
      
      if (isEditMode) {
        await dispatch(updateMenuItemAPI({
          vendorId,
          itemId: item._id,
          menuItem: menuItemPayload
        })).unwrap();
      } else {
        await dispatch(createMenuItem({
          vendorId,
          menuItem: menuItemPayload
        })).unwrap();
      }
      
      const action = isEditMode ? 'updated' : 'added';
      Alert.alert(
        'Success',
        `Menu item ${action} successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error || `Failed to ${isEditMode ? 'update' : 'add'} menu item. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Menu Item',
      'Are you sure you want to delete this menu item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Get the actual vendor ID for the logged-in user
              let vendorId = null;
              try {
                const response = await fetch('http://192.168.5.110:5000/api/vendors', {
                  headers: {
                    'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  
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
                    console.warn('⚠️ MenuItem Delete: Unexpected vendor data format:', data);
                    throw new Error('Invalid vendor data format');
                  }
                  
                  const userVendor = vendors.find(vendor => {
                    const vendorUserId = vendor.userId?._id || vendor.userId;
                    return vendorUserId === user._id;
                  });
                  
                  if (userVendor) {
                    vendorId = userVendor._id;
                  } else {
                    throw new Error('No vendor profile found');
                  }
                } else {
                  throw new Error('Failed to fetch vendor profile');
                }
              } catch (error) {
                console.error('❌ Error getting vendor ID for delete:', error);
                Alert.alert('Error', 'Unable to get vendor information. Please try again.');
                setLoading(false);
                return;
              }
              
              await dispatch(deleteMenuItemAPI({
                vendorId,
                itemId: item._id
              })).unwrap();
              Alert.alert(
                'Deleted',
                'Menu item deleted successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete menu item.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      console.log('📱 Image picker initiated');
      
      // Show image picker options without pre-checking permissions
      // Permissions will be requested when user selects an option
      Alert.alert(
        'Select Image',
        'Choose how you want to add a photo to your menu item',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Take Photo', 
            onPress: () => takePhoto(),
            style: 'default'
          },
          { 
            text: 'Choose from Library', 
            onPress: () => selectFromLibrary(),
            style: 'default'
          }
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('❌ Image picker initialization error:', error);
      Alert.alert('Error', 'Unable to access image picker. Please restart the app and try again.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📸 Taking photo...');
      
      // Request camera permission using the permissions service
      const permissionResult = await permissionsService.requestPermissionWithFallback('camera');
      
      if (!permissionResult.success) {
        console.log('❌ Camera permission denied');
        return;
      }

      console.log('✅ Camera permission granted, launching camera...');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        exif: false, // Don't include EXIF data
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 Photo taken successfully:', imageUri);
        
        setMenuItemData(prev => ({
          ...prev,
          imageUrl: imageUri
        }));
        
        Alert.alert('Success', 'Photo added successfully!');
      } else {
        console.log('📸 Photo capture cancelled');
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      Alert.alert(
        'Camera Error', 
        `Unable to take photo: ${error.message}. Please try again or use photo library instead.`
      );
    }
  };

  const selectFromLibrary = async () => {
    try {
      console.log('📷 Selecting from library...');
      
      // Request media library permission using the permissions service
      const permissionResult = await permissionsService.requestPermissionWithFallback('media_library');
      
      if (!permissionResult.success) {
        console.log('❌ Media library permission denied');
        return;
      }

      console.log('✅ Media library permission granted, launching library...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
        exif: false, // Don't include EXIF data
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📷 Image selected successfully:', imageUri);
        
        setMenuItemData(prev => ({
          ...prev,
          imageUrl: imageUri
        }));
        
        Alert.alert('Success', 'Image added successfully!');
      } else {
        console.log('📷 Image selection cancelled');
      }
    } catch (error) {
      console.error('❌ Image library error:', error);
      Alert.alert(
        'Library Error', 
        `Unable to access photo library: ${error.message}. Please try again or use camera instead.`
      );
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, error, keyboardType, multiline, maxLength }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, error && styles.textInputError, multiline && styles.textInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
      />
      {maxLength && (
        <Text style={styles.characterCount}>{value.length}/{maxLength}</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const CategorySelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryChip,
              menuItemData.category === category.value && styles.selectedCategoryChip
            ]}
            onPress={() => setMenuItemData(prev => ({ ...prev, category: category.value }))}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              menuItemData.category === category.value && styles.selectedCategoryLabel
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const SpiceLevelSelector = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Spice Level</Text>
      <View style={styles.spiceGrid}>
        {spiceLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.spiceChip,
              menuItemData.spiceLevel === level.value && styles.selectedSpiceChip
            ]}
            onPress={() => setMenuItemData(prev => ({ ...prev, spiceLevel: level.value }))}
          >
            <Text style={styles.spiceIcon}>{level.icon}</Text>
            <Text style={[
              styles.spiceLabel,
              menuItemData.spiceLevel === level.value && styles.selectedSpiceLabel
            ]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Menu Item' : 'Add Menu Item'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.sectionTitle}>Item Photo</Text>
            {menuItemData.imageUrl && (
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setMenuItemData(prev => ({ ...prev, imageUrl: null }))}
              >
                <Text style={styles.removeImageText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {menuItemData.imageUrl ? (
              <Image source={{ uri: menuItemData.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>Tap to Add Photo</Text>
                <Text style={styles.imageHintText}>Camera or Photo Library</Text>
              </View>
            )}
            {menuItemData.imageUrl && (
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <FormField
            label="Item Name"
            value={menuItemData.name}
            onChangeText={(text) => setMenuItemData(prev => ({ ...prev, name: text }))}
            placeholder="Enter item name"
            error={errors.name}
            maxLength={50}
          />

          <FormField
            label="Description"
            value={menuItemData.description}
            onChangeText={(text) => setMenuItemData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your dish..."
            error={errors.description}
            multiline
            maxLength={200}
          />

          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <FormField
                label="Price ($)"
                value={menuItemData.price}
                onChangeText={(text) => setMenuItemData(prev => ({ ...prev, price: text }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.price}
              />
            </View>
            <View style={styles.halfField}>
              <FormField
                label="Prep Time (min)"
                value={menuItemData.preparationTime}
                onChangeText={(text) => setMenuItemData(prev => ({ ...prev, preparationTime: text }))}
                placeholder="15"
                keyboardType="number-pad"
                error={errors.preparationTime}
              />
            </View>
          </View>

          <CategorySelector />
          <SpiceLevelSelector />
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          
          <FormField
            label="Ingredients"
            value={menuItemData.ingredients}
            onChangeText={(text) => setMenuItemData(prev => ({ ...prev, ingredients: text }))}
            placeholder="List main ingredients..."
            multiline
            maxLength={300}
          />

          <FormField
            label="Allergens"
            value={menuItemData.allergens}
            onChangeText={(text) => setMenuItemData(prev => ({ ...prev, allergens: text }))}
            placeholder="Contains nuts, dairy, gluten..."
            multiline
            maxLength={200}
          />
        </View>

        {/* Nutritional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutritional Information (Optional)</Text>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionField}>
              <FormField
                label="Calories"
                value={menuItemData.nutritionalInfo.calories}
                onChangeText={(text) => setMenuItemData(prev => ({
                  ...prev,
                  nutritionalInfo: { ...prev.nutritionalInfo, calories: text }
                }))}
                placeholder="350"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.nutritionField}>
              <FormField
                label="Protein (g)"
                value={menuItemData.nutritionalInfo.protein}
                onChangeText={(text) => setMenuItemData(prev => ({
                  ...prev,
                  nutritionalInfo: { ...prev.nutritionalInfo, protein: text }
                }))}
                placeholder="25"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionField}>
              <FormField
                label="Carbs (g)"
                value={menuItemData.nutritionalInfo.carbs}
                onChangeText={(text) => setMenuItemData(prev => ({
                  ...prev,
                  nutritionalInfo: { ...prev.nutritionalInfo, carbs: text }
                }))}
                placeholder="30"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.nutritionField}>
              <FormField
                label="Fat (g)"
                value={menuItemData.nutritionalInfo.fat}
                onChangeText={(text) => setMenuItemData(prev => ({
                  ...prev,
                  nutritionalInfo: { ...prev.nutritionalInfo, fat: text }
                }))}
                placeholder="15"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Available for orders</Text>
              <Text style={styles.settingDescription}>
                Customers can order this item
              </Text>
            </View>
            <Switch
              value={menuItemData.isAvailable}
              onValueChange={(value) => setMenuItemData(prev => ({ ...prev, isAvailable: value }))}
              trackColor={{ false: '#ccc', true: '#FF6B35' }}
              thumbColor={menuItemData.isAvailable ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Vegetarian</Text>
              <Text style={styles.settingDescription}>
                This item is suitable for vegetarians
              </Text>
            </View>
            <Switch
              value={menuItemData.isVegetarian}
              onValueChange={(value) => setMenuItemData(prev => ({ ...prev, isVegetarian: value }))}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor={menuItemData.isVegetarian ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Delete Button (Edit Mode Only) */}
        {isEditMode && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
            <Text style={styles.deleteButtonText}>Delete Menu Item</Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📝 Menu Tips</Text>
          <Text style={styles.tipsText}>
            • Use high-quality photos to make items look appetizing{'\n'}
            • Write detailed descriptions to help customers decide{'\n'}
            • Set accurate preparation times for better delivery estimates{'\n'}
            • Include allergen information to help customers with dietary restrictions{'\n'}
            • Price competitively based on your local market
          </Text>
        </View>
      </ScrollView>
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
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  removeImageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  itemImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  imageHintText: {
    marginTop: 4,
    fontSize: 12,
    color: '#bbb',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 15,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textInputError: {
    borderColor: '#FF3B30',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 5,
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedCategoryLabel: {
    color: 'white',
  },
  spiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  spiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  selectedSpiceChip: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  spiceIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  spiceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedSpiceLabel: {
    color: 'white',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionField: {
    width: '48%',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
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
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F44336',
    marginLeft: 10,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#FFE066',
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
