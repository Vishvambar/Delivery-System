import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { dataSyncService } from '../../services/dataSync';
import { socketService } from '../../services/socketService';

const initialState = {
  menuItems: [], // Start with empty array, will be populated from API
  loading: false,
  error: null,
  filter: 'all', // all, available, unavailable
  vendorId: null // Current vendor's ID
};

// Async thunks for API integration
export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await apiService.getVendorMenu(vendorId);
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

export const createMenuItem = createAsyncThunk(
  'menu/createMenuItem',
  async ({ vendorId, menuItem }, { rejectWithValue }) => {
    try {
      const response = await apiService.addMenuItem(vendorId, menuItem);
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create menu item');
    }
  }
);

export const updateMenuItemAPI = createAsyncThunk(
  'menu/updateMenuItem',
  async ({ vendorId, itemId, menuItem }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateMenuItem(vendorId, itemId, menuItem);
      if (response.data.success) {
        return { itemId, ...response.data.data };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update menu item');
    }
  }
);

export const deleteMenuItemAPI = createAsyncThunk(
  'menu/deleteMenuItem',
  async ({ vendorId, itemId }, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteMenuItem(vendorId, itemId);
      if (response.data.success) {
        return itemId;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete menu item');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    addMenuItem: (state, action) => {
      const newItem = {
        ...action.payload,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.menuItems.unshift(newItem);
    },
    updateMenuItem: (state, action) => {
      const index = state.menuItems.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.menuItems[index] = {
          ...state.menuItems[index],
          ...action.payload,
          updatedAt: new Date().toISOString()
        };
        
        // Throttle data sync to avoid performance issues
        const vendorId = state.vendorId || '688c90a002ecd124ee7ce6ec';
        setTimeout(() => {
          const cleanMenuItems = state.menuItems.map(item => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            isAvailable: item.isAvailable
          }));
          dataSyncService.saveMenuItems(vendorId, cleanMenuItems);
        }, 500);

        socketService.menuItemUpdated(vendorId, action.payload);
      }
    },
    deleteMenuItem: (state, action) => {
      state.menuItems = state.menuItems.filter(item => item._id !== action.payload);
    },
    toggleMenuItemAvailability: (state, action) => {
      const index = state.menuItems.findIndex(item => item._id === action.payload);
      if (index !== -1) {
        state.menuItems[index].isAvailable = !state.menuItems[index].isAvailable;
        state.menuItems[index].updatedAt = new Date().toISOString();
        
        const vendorId = state.vendorId || '688c90a002ecd124ee7ce6ec';
        const itemId = action.payload;
        const isAvailable = state.menuItems[index].isAvailable;
        
        // Throttle shared storage sync to avoid performance issues
        setTimeout(() => {
          const cleanMenuItems = state.menuItems.map(item => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            isAvailable: item.isAvailable
          }));
          dataSyncService.saveMenuItems(vendorId, cleanMenuItems);
        }, 100);
        
        socketService.menuItemAvailabilityChanged(vendorId, itemId, isAvailable);
      }
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    reorderMenuItems: (state, action) => {
      state.menuItems = action.payload;
    },
    setVendorId: (state, action) => {
      state.vendorId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        console.log('📥 Menu API payload:', action.payload);
        const menuData = action.payload;
        if (Array.isArray(menuData)) {
          state.menuItems = menuData;
        } else if (menuData && Array.isArray(menuData.menu)) {
          state.menuItems = menuData.menu;
        } else {
          console.warn('📥 Unexpected menu data structure, using empty array');
          state.menuItems = [];
        }
        state.error = null;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.warn('📥 Failed to fetch menu items:', action.payload);
      })

      .addCase(createMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems.unshift(action.payload);
        state.error = null;
        
        // Throttle data sync
        const vendorId = state.vendorId || '688c90a002ecd124ee7ce6ec';
        setTimeout(() => {
          const cleanMenuItems = state.menuItems.map(item => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            isAvailable: item.isAvailable
          }));
          dataSyncService.saveMenuItems(vendorId, cleanMenuItems);
        }, 500);
        
        socketService.menuItemAdded(vendorId, action.payload);
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateMenuItemAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMenuItemAPI.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.menuItems.findIndex(item => item._id === action.payload.itemId);
        if (index !== -1) {
          state.menuItems[index] = { ...state.menuItems[index], ...action.payload };
          
          // Throttle data sync
          const vendorId = state.vendorId || '688c90a002ecd124ee7ce6ec';
          setTimeout(() => {
            const cleanMenuItems = state.menuItems.map(item => ({
              _id: item._id,
              name: item.name,
              price: item.price,
              isAvailable: item.isAvailable
            }));
            dataSyncService.saveMenuItems(vendorId, cleanMenuItems);
          }, 500);
          
          socketService.menuItemUpdated(vendorId, state.menuItems[index]);
        }
        state.error = null;
      })
      .addCase(updateMenuItemAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteMenuItemAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMenuItemAPI.fulfilled, (state, action) => {
        state.loading = false;
        const deletedItemId = action.payload;
        state.menuItems = state.menuItems.filter(item => item._id !== deletedItemId);
        state.error = null;
        
        // Throttle data sync
        const vendorId = state.vendorId || '688c90a002ecd124ee7ce6ec';
        setTimeout(() => {
          const cleanMenuItems = state.menuItems.map(item => ({
            _id: item._id,
            name: item.name,
            price: item.price,
            isAvailable: item.isAvailable
          }));
          dataSyncService.saveMenuItems(vendorId, cleanMenuItems);
        }, 500);
        
        socketService.menuItemDeleted(vendorId, deletedItemId);
      })
      .addCase(deleteMenuItemAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Selectors
export const selectAllMenuItems = (state) => state.menu.menuItems;
export const selectMenuLoading = (state) => state.menu.loading;
export const selectMenuError = (state) => state.menu.error;
export const selectMenuFilter = (state) => state.menu.filter;
export const selectVendorId = (state) => state.menu.vendorId;

export const selectFilteredMenuItems = createSelector(
  [selectAllMenuItems, selectMenuFilter],
  (menuItems, filter) => {
    switch (filter) {
      case 'available':
        return menuItems.filter(item => item.isAvailable);
      case 'unavailable':
        return menuItems.filter(item => !item.isAvailable);
      default:
        return menuItems;
    }
  }
);

export const selectMenuStats = createSelector(
  [selectAllMenuItems],
  (menuItems) => ({
    total: menuItems.length,
    available: menuItems.filter(item => item.isAvailable).length,
    unavailable: menuItems.filter(item => !item.isAvailable).length,
    categories: [...new Set(menuItems.map(item => item.category))].length
  })
);

export const selectMenuItemsByCategory = createSelector(
  [selectAllMenuItems],
  (menuItems) => {
    return menuItems.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }
);

export const {
  setLoading,
  setError,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  setFilter,
  reorderMenuItems,
  setVendorId
} = menuSlice.actions;

export default menuSlice.reducer;
