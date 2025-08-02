import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import cartSlice from './slices/cartSlice';
import vendorSlice from './slices/vendorSlice';
import orderSlice from './slices/orderSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    vendors: vendorSlice,
    orders: orderSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
