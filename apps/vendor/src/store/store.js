import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import menuSlice from './slices/menuSlice';
import orderSlice from './slices/orderSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    menu: menuSlice,
    orders: orderSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
