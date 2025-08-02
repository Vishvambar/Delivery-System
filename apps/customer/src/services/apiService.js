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
      (config) => {
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
        console.error('📥 API Response Error:', error.response?.status, error.response?.data);

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
          await this.handleUnauthorized();
        }

        return Promise.reject(error);
      }
    );
  }

  async handleUnauthorized() {
    // Clear stored auth data
    await AsyncStorage.multiRemove(['token', 'user']);

    // Redirect to login - this would be handled by your navigation logic
    // You might want to emit an event or use a navigation service here
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
