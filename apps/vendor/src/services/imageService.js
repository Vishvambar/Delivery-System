import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// Base URL for API - should match your server configuration
const API_BASE_URL = 'http://192.168.5.110:5000';

class ImageService {
  async requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access camera roll is required!');
    }
    return true;
  }

  async pickImage(options = {}) {
    await this.requestPermissions();

    const defaultOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false
    };

    const result = await ImagePicker.launchImageLibraryAsync({
      ...defaultOptions,
      ...options
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  }

  async takePhoto(options = {}) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access camera is required!');
    }

    const defaultOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    };

    const result = await ImagePicker.launchCameraAsync({
      ...defaultOptions,
      ...options
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  }

  createFormData(imageUri, fieldName = 'image', additionalData = {}) {
    const formData = new FormData();
    
    // Add image
    formData.append(fieldName, {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${fieldName}_${Date.now()}.jpg`,
    });

    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return formData;
  }

  async uploadMenuItemImage(vendorId, menuItemData, imageUri, token) {
    try {
      const formData = this.createFormData(imageUri, 'image', menuItemData);

      const response = await axios.post(
        `${API_BASE_URL}/api/vendors/${vendorId}/menu`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading menu item with image:', error);
      throw error;
    }
  }

  async updateMenuItemImage(vendorId, itemId, menuItemData, imageUri, token) {
    try {
      const formData = this.createFormData(imageUri, 'image', menuItemData);

      const response = await axios.put(
        `${API_BASE_URL}/api/vendors/${vendorId}/menu/${itemId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating menu item with image:', error);
      throw error;
    }
  }

  async uploadVendorLogo(vendorId, imageUri, token) {
    try {
      const formData = this.createFormData(imageUri, 'logo');

      const response = await axios.post(
        `${API_BASE_URL}/api/vendors/${vendorId}/logo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading vendor logo:', error);
      throw error;
    }
  }

  async getMenuItemImageBase64(vendorId, itemId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/images/menu-item/${vendorId}/${itemId}/base64`
      );
      return response.data.data.image;
    } catch (error) {
      console.error('Error fetching menu item image:', error);
      return null;
    }
  }

  async getVendorLogoBase64(vendorId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/images/vendor-logo/${vendorId}/base64`
      );
      return response.data.data.image;
    } catch (error) {
      console.error('Error fetching vendor logo:', error);
      return null;
    }
  }

  getImageUrl(vendorId, itemId) {
    return `${API_BASE_URL}/api/images/menu-item/${vendorId}/${itemId}`;
  }

  getVendorLogoUrl(vendorId) {
    return `${API_BASE_URL}/api/images/vendor-logo/${vendorId}`;
  }
}

export const imageService = new ImageService();
