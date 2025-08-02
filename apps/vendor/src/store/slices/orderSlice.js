import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

// Mock order data for testing
const mockOrders = [
  {
    _id: 'order_1',
    orderNumber: 'ORD-001',
    customerId: 'customer_1',
    vendorId: '688c90a002ecd124ee7ce6ec',
    customerName: 'John Doe',
    items: [
      {
        menuItemId: '1',
        name: 'Margherita Pizza',
        price: 12.99,
        quantity: 1,
        specialInstructions: 'Extra cheese please'
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
      zipCode: '94102',
      instructions: 'Ring doorbell twice'
    },
    createdAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  }
];

// Async thunks
export const fetchVendorOrders = createAsyncThunk(
  'vendorOrders/fetchOrders',
  async (vendorId, { rejectWithValue }) => {
    try {
      console.log('📤 Fetching orders for vendor:', vendorId);
      const response = await apiService.get(`/orders?vendorId=${vendorId}`);
      
      if (response.data.success) {
        console.log('📥 Orders fetched successfully');
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

export const updateOrderStatus = createAsyncThunk(
  'vendorOrders/updateStatus',
  async ({ orderId, status, customerId }, { rejectWithValue }) => {
    try {
      console.log('📤 Updating order status:', orderId, status);
      const response = await apiService.put(`/orders/${orderId}/status`, { status });
      
      if (response.data.success) {
        // Emit real-time status update via Socket.IO
        switch (status) {
          case 'Accepted':
            socketService.acceptOrder({
              orderId,
              customerId,
              estimatedTime: 30 // minutes
            });
            break;
          case 'Prepared':
            socketService.orderPrepared({
              orderId,
              customerId
            });
            break;
          case 'Handed to Delivery':
            socketService.handToDelivery({
              orderId,
              customerId,
              deliveryPartnerId: null // Will be assigned by delivery system
            });
            break;
        }
        
        console.log('✅ Order status updated successfully');
        return { orderId, status };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      console.warn('⚠️ Order status update API failed, emitting socket event anyway');
      // Still emit socket event for testing
      switch (status) {
        case 'Accepted':
          socketService.acceptOrder({
            orderId,
            customerId,
            estimatedTime: 30
          });
          break;
        case 'Prepared':
          socketService.orderPrepared({
            orderId,
            customerId
          });
          break;
        case 'Handed to Delivery':
          socketService.handToDelivery({
            orderId,
            customerId,
            deliveryPartnerId: null
          });
          break;
      }
      
      return { orderId, status }; // Return success for testing
    }
  }
);

const initialState = {
  orders: [],
  loading: false,
  error: null,
  stats: {
    pending: 0,
    accepted: 0,
    prepared: 0,
    completed: 0
  }
};

const vendorOrderSlice = createSlice({
  name: 'vendorOrders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    // Handle new order from Socket.IO
    addNewOrder: (state, action) => {
      const newOrder = action.payload;
      console.log('🔌 New order received via Socket.IO:', newOrder.orderId);
      
      // Add to orders if not already present
      const existingIndex = state.orders.findIndex(order => order._id === newOrder.orderId);
      if (existingIndex === -1) {
        // Create a basic order object - will be filled by API fetch
        const basicOrder = {
          _id: newOrder.orderId,
          customerName: newOrder.customer || 'New Customer',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          isNew: true // Flag to indicate this order needs full data fetch
        };
        state.orders.unshift(basicOrder);
      }
      
      // Update stats
      vendorOrderSlice.caseReducers.updateStats(state);
    },
    
    // Update order status locally
    updateOrderStatusLocal: (state, action) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex(order => order._id === orderId);
      
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
        state.orders[orderIndex].updatedAt = new Date().toISOString();
        
        // Update stats
        vendorOrderSlice.caseReducers.updateStats(state);
      }
    },
    
    // Update order statistics
    updateStats: (state) => {
      state.stats = {
        pending: state.orders.filter(order => order.status === 'Pending').length,
        accepted: state.orders.filter(order => ['Accepted', 'Preparing'].includes(order.status)).length,
        prepared: state.orders.filter(order => ['Prepared', 'Handed to Delivery'].includes(order.status)).length,
        completed: state.orders.filter(order => ['Delivered', 'Completed'].includes(order.status)).length
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchVendorOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.error = null;
        
        // Update stats
        vendorOrderSlice.caseReducers.updateStats(state);
      })
      .addCase(fetchVendorOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, status } = action.payload;
        const orderIndex = state.orders.findIndex(order => order._id === orderId);
        
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = status;
          state.orders[orderIndex].updatedAt = new Date().toISOString();
        }
        
        // Update stats
        vendorOrderSlice.caseReducers.updateStats(state);
      });
  }
});

export const {
  clearError,
  addNewOrder,
  updateOrderStatusLocal,
  updateStats
} = vendorOrderSlice.actions;

export default vendorOrderSlice.reducer;
