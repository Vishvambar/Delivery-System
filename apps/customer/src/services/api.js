import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API - update this based on your server configuration
// Using the same IP that works for vendor app
export const API_BASE_URL = 'http://192.168.5.110:5000/api';
// Alternative URLs to try if issues persist:
// export const API_BASE_URL = 'http://localhost:5000/api';
// export const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// export const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('🔐 API Request:', config.method?.toUpperCase(), config.url, token ? 'with token' : 'NO TOKEN');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
        // You might want to redirect to login screen here
        console.log('Token expired, user logged out');
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Authentication
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),

  // Vendors
  getVendors: (params) => api.get('/vendors', { params }),
  getVendor: (vendorId) => api.get(`/vendors/${vendorId}`),
  getVendorMenu: (vendorId, params) => api.get(`/vendors/${vendorId}/menu`, { params }),

  // Orders
  createOrder: (orderData) => api.post('/orders', orderData),
  getCustomerOrders: (userId, params) => api.get(`/orders/customer/${userId}`, { params }),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
  assignDeliveryPartner: (orderId, deliveryPartnerId) => 
    api.put(`/orders/${orderId}/assign`, { deliveryPartnerId }),
  
  // Images
  getVendorLogo: (vendorId) => api.get(`/images/vendor-logo/${vendorId}`),
  getMenuItemImage: (vendorId, itemId) => api.get(`/images/menu-item/${vendorId}/${itemId}`),
  getVendorLogoBase64: (vendorId) => api.get(`/images/vendor-logo/${vendorId}/base64`),
  getMenuItemImageBase64: (vendorId, itemId) => api.get(`/images/menu-item/${vendorId}/${itemId}/base64`),
};

export { api };
export default api;
