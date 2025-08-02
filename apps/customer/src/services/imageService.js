import axios from 'axios';

// Base URL for API - should match your server configuration
const API_BASE_URL = 'http://192.168.5.110:5000';

class ImageService {
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
