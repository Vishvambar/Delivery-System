import { configureStore, createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  user: null,
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    setOrders(state, action) {
      state.orders = action.payload;
    },
    acceptOrder(state, action) {
      const orderId = action.payload;
      const acceptedOrder = state.orders.find(order => order.id === orderId);

      if (acceptedOrder) {
        state.acceptedOrders.push(acceptedOrder);
        state.orders = state.orders.filter(order => order.id !== orderId);
      }
    },
    completeOrder(state, action) {
      // Logic to remove a completed order
      const orderId = action.payload;
      state.acceptedOrders = state.acceptedOrders.filter(order => order.id !== orderId);
    },
    // Add other reducers for user info, etc.
  },
});

export const { setOrders, acceptOrder, completeOrder } = deliverySlice.actions;

export const store = configureStore({
  reducer: {
    delivery: deliverySlice.reducer,
  },
});