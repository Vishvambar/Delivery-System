const express = require('express');
const {
  createOrder,
  getCustomerOrders,
  getVendorOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  getAvailableDeliveryOrders,
  getDeliveryPartnerOrders
} = require('../controllers/orderController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Customer routes
router.post('/', authorize('customer'), createOrder);
router.get('/customer/:userId', authorize('customer'), getCustomerOrders);

// Vendor routes
router.get('/vendor/:vendorId', authorize('vendor'), getVendorOrders);
router.put('/:orderId/status', authorize('vendor', 'delivery'), updateOrderStatus);
router.put('/:orderId/assign', authorize('vendor', 'delivery'), assignDeliveryPartner);

// Delivery partner routes
router.get('/delivery/available', authorize('delivery'), getAvailableDeliveryOrders);
router.get('/delivery/:userId', authorize('delivery'), getDeliveryPartnerOrders);

module.exports = router;
