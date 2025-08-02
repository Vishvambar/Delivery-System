import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socketService } from '../services/socketService';
import { addNewOrder } from '../store/slices/orderSlice';

export const useSocketListeners = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('🔌 Setting up Socket.IO listeners in vendor app');

    // New order listener
    const handleNewOrder = (data) => {
      console.log('🔌 New order received:', data);
      dispatch(addNewOrder(data));
      
      // Show notification or alert
      // You can add notification logic here
    };

    const handleOrderCancelled = (data) => {
      console.log('🔌 Order cancelled:', data);
      // Handle order cancellation
      // You can add cancellation logic here
    };

    // Set up listeners
    socketService.on('new_order', handleNewOrder);
    socketService.on('order_cancelled', handleOrderCancelled);

    // Cleanup listeners on unmount
    return () => {
      console.log('🔌 Cleaning up Socket.IO listeners in vendor app');
      socketService.off('new_order', handleNewOrder);
      socketService.off('order_cancelled', handleOrderCancelled);
    };
  }, [dispatch]);
};
