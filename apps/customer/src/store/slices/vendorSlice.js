import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { dataSyncService } from '../../services/dataSync';

// Mock vendor data with menu items for development/demo
const mockVendorsData = [
  {
    _id: '688c90a002ecd124ee7ce6ec', // Match the vendor ID used in vendor app
    businessName: 'Mario\'s Pizza',
    category: 'restaurant',
    cuisineType: ['italian'],
    location: {
      address: '123 Main St',
      city: 'San Francisco',
      coordinates: { latitude: 37.7749, longitude: -122.4194 }
    },
    rating: { average: 4.5, count: 120 },
    deliveryFee: 2.99,
    minimumOrder: 15,
    estimatedDeliveryTime: 30,
    isOpen: true,
    menu: [
      {
        _id: '1',
        name: 'Margherita Pizza',
        price: 12.99,
        description: 'Fresh tomatoes, mozzarella cheese, and basil leaves on a crispy thin crust',
        category: 'main-course',
        isAvailable: true,
        preparationTime: 20,
        isVegetarian: true,
        spiceLevel: 'mild',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'
      },
      {
        _id: '2',
        name: 'Pepperoni Pizza',
        price: 14.99,
        description: 'Classic pepperoni with mozzarella cheese on our signature thin crust',
        category: 'main-course',
        isAvailable: true,
        preparationTime: 22,
        isVegetarian: false,
        spiceLevel: 'mild',
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'
      },
      {
        _id: '3',
        name: 'Caesar Salad',
        price: 8.99,
        description: 'Crispy romaine lettuce with caesar dressing, croutons, and parmesan cheese',
        category: 'appetizer',
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: true,
        spiceLevel: 'mild',
        imageUrl: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400'
      }
    ]
  },
  {
    _id: '2',
    businessName: 'Sushi Master',
    category: 'restaurant',
    cuisineType: ['japanese'],
    location: {
      address: '456 Oak Ave',
      city: 'San Francisco',
      coordinates: { latitude: 37.7849, longitude: -122.4094 }
    },
    rating: { average: 4.8, count: 85 },
    deliveryFee: 3.99,
    minimumOrder: 20,
    estimatedDeliveryTime: 45,
    isOpen: true,
    menu: [
      {
        _id: '4',
        name: 'California Roll',
        price: 8.99,
        description: 'Avocado, cucumber, and crab meat rolled in nori and rice',
        category: 'appetizer',
        isAvailable: true,
        preparationTime: 10,
        isVegetarian: false,
        spiceLevel: 'mild',
        imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'
      },
      {
        _id: '5',
        name: 'Salmon Sashimi',
        price: 16.99,
        description: 'Fresh salmon sliced thin and served without rice',
        category: 'main-course',
        isAvailable: true,
        preparationTime: 5,
        isVegetarian: false,
        spiceLevel: 'mild',
        imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400'
      }
    ]
  }
];

// Async thunks
export const fetchVendors = createAsyncThunk(
  'vendors/fetchVendors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/vendors');
      if (response.data.success) {
        return response.data.data.vendors || response.data.data || [];
      } else {
        // Fallback to mock data if API fails
        console.warn('API failed, using mock data:', response.data.message);
        return mockVendorsData;
      }
    } catch (error) {
      console.warn('API error, using mock data:', error.message);
      // Fallback to mock data if API is not available
      return mockVendorsData;
    }
  }
);

export const fetchVendorDetails = createAsyncThunk(
  'vendors/fetchVendorDetails',
  async (vendorId, { rejectWithValue }) => {
    try {
      console.log('📱 Customer: Fetching vendor details for ID:', vendorId);
      // First try to get vendor details
      const vendorResponse = await apiService.get(`/vendors/${vendorId}`);
      let vendorData;
      
      if (vendorResponse.data.success) {
        // Handle different response structures
        let rawData = vendorResponse.data.data;
        console.log('📱 Customer: Raw vendor API response:', vendorResponse.data);
        console.log('📱 Customer: Raw data type:', typeof rawData);
        console.log('📱 Customer: Raw data keys:', Object.keys(rawData || {}));
        
        if (rawData && rawData.vendor) {
          vendorData = rawData.vendor;
        } else if (rawData) {
          vendorData = rawData;
        } else {
          console.warn('📱 Customer: No vendor data in API response');
          const vendor = mockVendorsData.find(v => v._id === vendorId);
          vendorData = vendor || {};
        }
        
        console.log('📱 Customer: Final vendor data:', vendorData);
        console.log('📱 Customer: Got vendor data from API:', vendorData?.businessName);
      } else {
        console.warn('📱 Customer: Vendor API unsuccessful, using mock data');
        // Fallback to mock data
        const vendor = mockVendorsData.find(v => v._id === vendorId);
        if (!vendor) {
          console.error('📱 Customer: Vendor not found in mock data either');
          return rejectWithValue('Vendor not found');
        }
        vendorData = vendor;
      }
      
      // Then try to get the menu
      try {
        const menuResponse = await apiService.get(`/vendors/${vendorId}/menu`);
        console.log('📥 Menu API Response:', menuResponse.data);
        if (menuResponse.data.success) {
          // Handle different response structures
          let menuData = menuResponse.data.data;
          
          // Check if it's nested under 'menu' property
          if (menuData && menuData.menu && Array.isArray(menuData.menu)) {
            vendorData.menu = menuData.menu;
          } else if (Array.isArray(menuData)) {
            vendorData.menu = menuData;
          } else {
            console.warn('📥 Unexpected menu data structure:', menuData);
            vendorData.menu = [];
          }
          
          console.log('📱 Menu items count:', vendorData.menu.length);
          console.log('📱 Menu items preview:', vendorData.menu.slice(0, 2));
        } else {
          console.warn('Menu API returned unsuccessful response');
          vendorData.menu = [];
        }
      } catch (menuError) {
        console.warn('📱 Customer: Menu API failed, checking shared storage:', menuError.message);
        // Try to get menu from shared storage (updated by vendor app)
        try {
          const sharedMenu = await dataSyncService.getMenuItems(vendorId);
          console.log('📱 Customer: Shared storage check result:', sharedMenu);
          if (sharedMenu && sharedMenu.length > 0) {
            console.log('📱 Customer: Using shared menu data from vendor app:', sharedMenu.length, 'items');
            vendorData.menu = sharedMenu;
          } else {
            console.warn('📱 Customer: No shared menu data available, using mock menu data if available');
            const mockVendor = mockVendorsData.find(v => v._id === vendorId);
            vendorData.menu = mockVendor?.menu || [];
          }
        } catch (sharedStorageError) {
          console.error('📱 Customer: Shared storage error:', sharedStorageError);
          const mockVendor = mockVendorsData.find(v => v._id === vendorId);
          vendorData.menu = mockVendor?.menu || [];
        }
      }
      
      // Ensure vendor has a menu array
      if (!vendorData.menu || !Array.isArray(vendorData.menu)) {
        vendorData.menu = [];
        console.log('📱 Customer: Initialized empty menu array for vendor');
      }
      
      console.log('📱 Customer: Returning vendor data with menu:', vendorData.menu.length, 'items');
      return vendorData;
    } catch (error) {
      console.warn('📱 Customer: Vendor API failed, using mock data:', error.message);
      // Fallback to mock data
      const vendor = mockVendorsData.find(v => v._id === vendorId);
      if (!vendor) {
        console.error('📱 Customer: Vendor not found in mock data either');
        return rejectWithValue('Vendor not found');
      }
      console.log('📱 Customer: Using mock vendor:', vendor.businessName);
      return vendor;
    }
  }
);

export const fetchVendorMenu = createAsyncThunk(
  'vendors/fetchVendorMenu',
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`/vendors/${vendorId}/menu`);
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch menu');
    }
  }
);

export const searchVendors = createAsyncThunk(
  'vendors/searchVendors',
  async ({ query, category, location }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (category) params.append('category', category);
      if (location) {
        params.append('latitude', location.latitude);
        params.append('longitude', location.longitude);
      }

      const response = await apiService.get(`/vendors/search?${params.toString()}`);
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search vendors');
    }
  }
);

const initialState = {
  vendors: [],
  selectedVendor: null,
  categories: [],
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false
};

const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedVendor: (state) => {
      state.selectedVendor = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    updateVendorMenu: (state, action) => {
      const { vendorId, menu } = action.payload;
      console.log('📱 Updating vendor menu in Redux:', vendorId, menu?.length || 0, 'items');
      
      // Ensure menu is always an array
      const safeMenu = Array.isArray(menu) ? menu : [];
      
      // Update vendor in vendors list
      const vendorIndex = state.vendors.findIndex(v => v._id === vendorId);
      if (vendorIndex !== -1) {
        state.vendors[vendorIndex].menu = safeMenu;
        console.log('📱 Updated vendor in vendors list');
      }
      
      // Update selected vendor if it matches
      if (state.selectedVendor && state.selectedVendor._id === vendorId) {
        state.selectedVendor.menu = safeMenu;
        console.log('📱 Updated selected vendor menu');
      }
    },
    
    // Handle real-time menu updates from Socket.IO
    handleMenuUpdate: (state, action) => {
      const { vendorId, action: updateAction, menuItem, menuItemId, isAvailable } = action.payload;
      console.log('🔌 Real-time menu update:', updateAction, 'for vendor:', vendorId);
      
      // Helper function to update menu in both vendors list and selectedVendor
      const updateMenuInState = (menuUpdateFn) => {
        // Update in vendors list
        const vendorIndex = state.vendors.findIndex(v => v._id === vendorId);
        if (vendorIndex !== -1 && state.vendors[vendorIndex].menu) {
          menuUpdateFn(state.vendors[vendorIndex].menu);
        }
        
        // Update selected vendor if it matches
        if (state.selectedVendor && state.selectedVendor._id === vendorId && state.selectedVendor.menu) {
          menuUpdateFn(state.selectedVendor.menu);
        }
      };
      
      switch (updateAction) {
        case 'added':
          if (menuItem) {
            updateMenuInState((menu) => menu.unshift(menuItem));
          }
          break;
          
        case 'updated':
          if (menuItem) {
            updateMenuInState((menu) => {
              const index = menu.findIndex(item => item._id === menuItem._id);
              if (index !== -1) {
                menu[index] = { ...menu[index], ...menuItem };
              }
            });
          }
          break;
          
        case 'deleted':
          if (menuItemId) {
            updateMenuInState((menu) => {
              const index = menu.findIndex(item => item._id === menuItemId);
              if (index !== -1) {
                menu.splice(index, 1);
              }
            });
          }
          break;
          
        case 'availability_changed':
          if (menuItemId && typeof isAvailable === 'boolean') {
            updateMenuInState((menu) => {
              const index = menu.findIndex(item => item._id === menuItemId);
              if (index !== -1) {
                menu[index].isAvailable = isAvailable;
                menu[index].updatedAt = new Date().toISOString();
              }
            });
          }
          break;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch vendors
      .addCase(fetchVendors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload;
        state.error = null;
        
        // Extract unique categories
        const categories = [...new Set(action.payload.map(vendor => vendor.category))];
        state.categories = categories;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch vendor details
      .addCase(fetchVendorDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorDetails.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure selectedVendor always has a menu array
        const vendor = action.payload;
        if (!vendor.menu || !Array.isArray(vendor.menu)) {
          vendor.menu = [];
        }
        state.selectedVendor = vendor;
        state.error = null;
      })
      .addCase(fetchVendorDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch vendor menu
      .addCase(fetchVendorMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorMenu.fulfilled, (state, action) => {
        state.loading = false;
        if (state.selectedVendor) {
          state.selectedVendor.menu = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchVendorMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search vendors
      .addCase(searchVendors.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchVendors.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchVendors.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  clearSelectedVendor, 
  clearSearchResults, 
  setCategories,
  updateVendorMenu,
  handleMenuUpdate
} = vendorSlice.actions;

export default vendorSlice.reducer;
