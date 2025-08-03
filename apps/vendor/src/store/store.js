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
      serializableCheck: false, // Disable in development
      immutableCheck: false, // Disable in development
    }),
  // Disable development checks that cause performance issues
  devTools: __DEV__ && {
    serialize: {
      options: {
        undefined: true,
        function: true,
      },
    },
  },
});
