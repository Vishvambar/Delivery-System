import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API - update this based on your server configuration
export const API_BASE_URL = 'http://192.168.5.110:5000/api';

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
      console.log('🔐 Vendor API Request:', config.method?.toUpperCase(), config.url, token ? 'with token' : 'NO TOKEN');
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
    return response;
  },
  async (error) => {
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
  updateVendorProfile: (data) => api.put('/vendors/profile', data),

  // Menu Items
  addMenuItem: (vendorId, formData) => api.post(`/vendors/${vendorId}/menu`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateMenuItem: (vendorId, itemId, formData) => api.put(`/vendors/${vendorId}/menu/${itemId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteMenuItem: (vendorId, itemId) => api.delete(`/vendors/${vendorId}/menu/${itemId}`),

  // Vendor Logo
  uploadVendorLogo: (vendorId, formData) => api.post(`/vendors/${vendorId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Orders
  getVendorOrders: (vendorId, params) => api.get(`/orders/vendor/${vendorId}`, { params }),
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
