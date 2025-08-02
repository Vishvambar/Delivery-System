import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  vendorId: null,
  vendorName: null,
  deliveryAddress: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      
      // Set vendor info if it's the first item or if it's empty
      if (!state.vendorId && newItem.vendorId) {
        state.vendorId = newItem.vendorId;
        state.vendorName = newItem.vendorName;
      }
      
      // Check if item from different vendor
      if (state.vendorId && newItem.vendorId !== state.vendorId) {
        // Clear cart and add new item from different vendor
        state.items = [];
        state.vendorId = newItem.vendorId;
        state.vendorName = newItem.vendorName;
      }
      
      const existingItem = state.items.find(item => item.menuItemId === newItem.menuItemId);

      if (existingItem) {
        existingItem.quantity += newItem.quantity || 1;
      } else {
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1
        });
      }

      // Recalculate totals
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    removeFromCart: (state, action) => {
      const menuItemId = action.payload;
      state.items = state.items.filter(item => item.menuItemId !== menuItemId);

      // Clear vendor info if cart is empty
      if (state.items.length === 0) {
        state.vendorId = null;
        state.vendorName = null;
      }

      // Recalculate totals
      state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    updateCartItemQuantity: (state, action) => {
      const { menuItemId, quantity } = action.payload;
      const item = state.items.find(item => item.menuItemId === menuItemId);

      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items = state.items.filter(item => item.menuItemId !== menuItemId);
          
          // Clear vendor info if cart is empty
          if (state.items.length === 0) {
            state.vendorId = null;
            state.vendorName = null;
          }
        } else {
          item.quantity = quantity;
        }

        // Recalculate totals
        state.itemCount = state.items.reduce((total, item) => total + item.quantity, 0);
        state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.vendorId = null;
      state.vendorName = null;
      state.deliveryAddress = null;
    },

    updateDeliveryAddress: (state, action) => {
      state.deliveryAddress = action.payload;
    }
  }
});

export const { 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  clearCart, 
  updateDeliveryAddress 
} = cartSlice.actions;

export default cartSlice.reducer;
