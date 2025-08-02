import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - update this to your backend URL
const BASE_URL = __DEV__ 
  ? 'http://192.168.5.110:5000/api'  // Development - Use computer's IP
  : 'https://your-backend-url.com/api';  // Production

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Automatically add auth token if available
        if (!config.headers.Authorization) {
          try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
              console.log('🔐 Added auth token to request');
            } else {
              console.warn('⚠️ No auth token found in storage');
            }
          } catch (error) {
            console.error('❌ Error retrieving auth token:', error);
          }
        }
        
        return config;
      },
      (error) => {
        console.error('📤 API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log(`📥 API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const status = error.response?.status;
        const data = error.response?.data;
        console.error('📥 API Response Error:', status, data);

        // Handle 401 errors (unauthorized)
        if (status === 401) {
          console.warn('🔒 Authentication failed - token may be expired or invalid');
          await this.handleUnauthorized();
        }

        return Promise.reject(error);
      }
    );
  }

  async handleUnauthorized() {
    // Clear stored auth data
    await AsyncStorage.multiRemove(['userToken', 'user']);
    this.clearAuthToken();

    // Redirect to login - this would be handled by your navigation logic
    // You might want to emit an event or use a navigation service here
    console.log('🔒 User logged out due to invalid token');
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // HTTP methods
  get(url, config = {}) {
    return this.api.get(url, config);
  }

  post(url, data = {}, config = {}) {
    return this.api.post(url, data, config);
  }

  put(url, data = {}, config = {}) {
    return this.api.put(url, data, config);
  }

  delete(url, config = {}) {
    return this.api.delete(url, config);
  }

  patch(url, data = {}, config = {}) {
    return this.api.patch(url, data, config);
  }
}

export const apiService = new ApiService();
