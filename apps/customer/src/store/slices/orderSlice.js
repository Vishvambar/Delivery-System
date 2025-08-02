import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { socketService } from '../../services/socketService';

// Mock order data for testing
const mockOrders = [
  {
    _id: 'order_1',
    orderNumber: 'ORD-001',
    customerId: 'customer_1',
    vendorId: '688c90a002ecd124ee7ce6ec',
    items: [
      {
        menuItemId: '1',
        name: 'Margherita Pizza',
        price: 12.99,
        quantity: 1
      }
    ],
    status: 'Pending',
    pricing: {
      subtotal: 12.99,
      deliveryFee: 2.99,
      tax: 1.30,
      total: 17.28
    },
    paymentMethod: 'card',
    paymentStatus: 'paid',
    deliveryAddress: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    createdAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  }
];

// Async thunks
export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('📤 Placing order:', orderData);
      const response = await apiService.post('/orders', orderData);
      
      if (response.data.success) {
        const order = response.data.data;
        
        // Emit real-time event via Socket.IO
        socketService.placeOrder({
          orderId: order._id,
          vendorId: orderData.vendorId
        });
        
        console.log('✅ Order placed successfully:', order._id);
        return order;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.warn('⚠️ Order API failed, using mock order');
      // Fallback to mock order for testing
      const mockOrder = {
        ...mockOrders[0],
        _id: 'mock_' + Date.now(),
        orderNumber: 'ORD-' + Date.now().toString().slice(-6),
        ...orderData,
        createdAt: new Date().toISOString()
      };
      
      // Still emit socket event for testing
      socketService.placeOrder({
        orderId: mockOrder._id,
        vendorId: orderData.vendorId
      });
      
      return mockOrder;
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/orders');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.warn('⚠️ Orders API failed, using mock orders');
      // Fallback to mock orders for testing
      return mockOrders;
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated || !auth.token) {
        console.log('❌ Cannot fetch orders: User not authenticated');
        return rejectWithValue('User not authenticated');
      }

      console.log('📤 Fetching orders for user:', userId);
      console.log('📤 API Request: GET /orders/customer/' + userId);
      const response = await apiService.getCustomerOrders(userId);
      
      if (response.data.success) {
        console.log('✅ User orders fetched:', response.data.data.orders.length);
        return response.data.data.orders;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.error('📥 API Response Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        url: error.config?.url
      });
      console.warn('⚠️ User orders API failed, using mock orders for userId:', userId);
      // Fallback to mock orders for testing
      return mockOrders.filter(order => order.customerId === userId);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiService.put(`/orders/${orderId}/cancel`, { reason });
      
      if (response.data.success) {
        // Emit real-time cancellation
        socketService.cancelOrder({
          orderId,
          reason
        });
        
        return { orderId, reason };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  orderStatus: {}
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    // Real-time order status updates from Socket.IO
    updateOrderStatus: (state, action) => {
      const { orderId, status, message } = action.payload;
      console.log('🔌 Real-time order status update:', orderId, status);
      
      // Update order in orders list
      const orderIndex = state.orders.findIndex(order => order._id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
        state.orders[orderIndex].updatedAt = new Date().toISOString();
      }
      
      // Update current order if it matches
      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder.status = status;
        state.currentOrder.updatedAt = new Date().toISOString();
      }
      
      // Store status in orderStatus for quick lookup
      state.orderStatus[orderId] = {
        status,
        message,
        timestamp: new Date().toISOString()
      };
    },
    
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Place order
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload);
        state.error = null;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch user orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const { orderId } = action.payload;
        
        // Update order status to cancelled
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'Cancelled';
        }
        
        if (state.currentOrder && state.currentOrder._id === orderId) {
          state.currentOrder.status = 'Cancelled';
        }
      });
  }
});

export const {
  clearError,
  updateOrderStatus,
  setCurrentOrder,
  clearCurrentOrder
} = orderSlice.actions;

export default orderSlice.reducer;
