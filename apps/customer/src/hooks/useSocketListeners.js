import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../services/socketService';
import { updateOrderStatus } from '../store/slices/orderSlice';
import { handleMenuUpdate } from '../store/slices/vendorSlice';

export const useSocketListeners = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('🔌 Setting up Socket.IO listeners in customer app');

    // Only connect if user is authenticated
    if (isAuthenticated && token) {
      console.log('🔌 User is authenticated, connecting to socket...');
      socketService.connect(token);
    } else {
      console.log('🔌 User not authenticated, skipping socket connection');
      return;
    }

    // Order status update listeners
    const handleOrderAccepted = (data) => {
      console.log('🔌 Order accepted:', data);
      dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'Accepted',
        message: data.message
      }));
    };

    const handleOrderPrepared = (data) => {
      console.log('🔌 Order prepared:', data);
      dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'Prepared',
        message: data.message
      }));
    };

    const handleOrderHandedToDelivery = (data) => {
      console.log('🔌 Order handed to delivery:', data);
      dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'Handed to Delivery',
        message: data.message
      }));
    };

    const handleOrderOutForDelivery = (data) => {
      console.log('🔌 Order out for delivery:', data);
      dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'Out for Delivery',
        message: data.message
      }));
    };

    const handleOrderDelivered = (data) => {
      console.log('🔌 Order delivered:', data);
      dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'Delivered',
        message: data.message
      }));
    };

    const handleMenuUpdate = (data) => {
      console.log('🔌 Menu update received:', data);
      dispatch(handleMenuUpdate(data));
    };

    // Set up listeners
    socketService.on('order_accepted', handleOrderAccepted);
    socketService.on('order_prepared', handleOrderPrepared);
    socketService.on('order_handed_to_delivery', handleOrderHandedToDelivery);
    socketService.on('order_out_for_delivery', handleOrderOutForDelivery);
    socketService.on('order_delivered', handleOrderDelivered);
    socketService.on('vendor_menu_updated', handleMenuUpdate);

    // Cleanup listeners on unmount
    return () => {
      console.log('🔌 Cleaning up Socket.IO listeners in customer app');
      socketService.off('order_accepted', handleOrderAccepted);
      socketService.off('order_prepared', handleOrderPrepared);
      socketService.off('order_handed_to_delivery', handleOrderHandedToDelivery);
      socketService.off('order_out_for_delivery', handleOrderOutForDelivery);
      socketService.off('order_delivered', handleOrderDelivered);
      socketService.off('vendor_menu_updated', handleMenuUpdate);
    };
  }, [dispatch, isAuthenticated, token]);
};
