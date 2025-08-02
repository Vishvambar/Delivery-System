const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer only)
const createOrder = async (req, res) => {
  try {
    const {
      vendorId,
      items,
      deliveryAddress,
      paymentMethod,
      specialInstructions
    } = req.body;

    // Validate vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.isOpen) {
      return res.status(400).json({
        success: false,
        message: 'Vendor not found or currently closed'
      });
    }

    // Calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = vendor.menu.id(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.name || item.menuItemId} is not available`
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      });
    }

    // Check minimum order
    if (subtotal < vendor.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is $${vendor.minimumOrder}`
      });
    }

    const deliveryFee = vendor.deliveryFee;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(
      estimatedDeliveryTime.getMinutes() + vendor.estimatedDeliveryTime
    );

    // Create order
    const order = await Order.create({
      customerId: req.user.id,
      vendorId,
      items: orderItems,
      deliveryAddress,
      pricing: {
        subtotal,
        deliveryFee,
        tax,
        total
      },
      paymentMethod,
      estimatedDeliveryTime,
      statusHistory: [{
        status: 'Pending',
        timestamp: new Date(),
        updatedBy: req.user.id
      }]
    });

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name phone')
      .populate('vendorId', 'businessName location phone');

    // Update vendor stats
    vendor.totalOrders += 1;
    vendor.totalRevenue += total;
    await vendor.save();

    // Emit socket event to vendor
    req.app.get('io').to(`user:${vendor.userId}`).emit('order_placed', {
      order: populatedOrder,
      message: 'New order received!'
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: populatedOrder }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer/:userId
// @access  Private (Customer only)
const getCustomerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const customerId = req.params.userId;

    // Check if user can access these orders
    if (customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these orders'
      });
    }

    const query = { customerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('vendorId', 'businessName location')
      .populate('assignedTo', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// @desc    Get vendor orders
// @route   GET /api/orders/vendor/:vendorId
// @access  Private (Vendor only)
const getVendorOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const vendorId = req.params.vendorId;

    // Check if user owns this vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || vendor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these orders'
      });
    }

    const query = { vendorId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customerId', 'name phone address')
      .populate('assignedTo', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:orderId/status
// @access  Private (Vendor/Delivery only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId)
      .populate('customerId', 'name fcmToken')
      .populate('vendorId', 'businessName userId')
      .populate('assignedTo', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization check
    const isVendor = req.user.role === 'vendor' && 
                    order.vendorId.userId.toString() === req.user.id;
    const isDeliveryPartner = req.user.role === 'delivery' && 
                             order.assignedTo && 
                             order.assignedTo._id.toString() === req.user.id;

    if (!isVendor && !isDeliveryPartner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Validate status transitions
    const validTransitions = {
      'Pending': ['Accepted', 'Cancelled'],
      'Accepted': ['Prepared', 'Cancelled'],
      'Prepared': ['Handed to Delivery'],
      'Handed to Delivery': ['Out for Delivery'],
      'Out for Delivery': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Update order
    order.status = status;
    order.updatedBy = req.user.id;

    if (status === 'Delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Emit real-time updates
    const io = req.app.get('io');

    // Notify customer
    io.to(`user:${order.customerId._id}`).emit('order_status_updated', {
      orderId: order._id,
      status,
      message: `Your order is now ${status.toLowerCase()}`
    });

    // If handed to delivery, notify available delivery partners
    if (status === 'Handed to Delivery') {
      io.emit('new_delivery_available', {
        orderId: order._id,
        vendor: order.vendorId.businessName,
        deliveryAddress: order.deliveryAddress
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { 
        order: await Order.findById(orderId)
          .populate('customerId', 'name phone')
          .populate('vendorId', 'businessName')
          .populate('assignedTo', 'name phone')
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
};

// @desc    Assign delivery partner
// @route   PUT /api/orders/:orderId/assign
// @access  Private (Vendor/Delivery only)
const assignDeliveryPartner = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is ready for assignment
    if (order.status !== 'Handed to Delivery') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for delivery assignment'
      });
    }

    // For self-assignment by delivery partner
    if (req.user.role === 'delivery') {
      order.assignedTo = req.user.id;
    } else {
      // For vendor assignment
      const vendor = await Vendor.findOne({ userId: req.user.id });
      if (!vendor || order.vendorId.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to assign delivery for this order'
        });
      }

      order.assignedTo = deliveryPartnerId;
    }

    await order.save();

    // Notify delivery partner
    const io = req.app.get('io');
    io.to(`user:${order.assignedTo}`).emit('order_assigned', {
      orderId: order._id,
      message: 'New delivery assigned to you!'
    });

    res.json({
      success: true,
      message: 'Delivery partner assigned successfully',
      data: { 
        order: await Order.findById(orderId)
          .populate('assignedTo', 'name phone')
      }
    });
  } catch (error) {
    console.error('Assign delivery partner error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to assign delivery partner'
    });
  }
};

// @desc    Get available delivery orders
// @route   GET /api/orders/delivery/available
// @access  Private (Delivery only)
const getAvailableDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: 'Handed to Delivery',
      assignedTo: null
    })
    .populate('vendorId', 'businessName location')
    .populate('customerId', 'name phone')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get available delivery orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available orders'
    });
  }
};

// @desc    Get delivery partner orders
// @route   GET /api/orders/delivery/:userId
// @access  Private (Delivery only)
const getDeliveryPartnerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const deliveryPartnerId = req.params.userId;

    // Check authorization
    if (deliveryPartnerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these orders'
      });
    }

    const query = { assignedTo: deliveryPartnerId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('vendorId', 'businessName location')
      .populate('customerId', 'name phone address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Calculate earnings
    const completedOrders = await Order.find({
      assignedTo: deliveryPartnerId,
      status: 'Delivered'
    });

    const totalEarnings = completedOrders.reduce((sum, order) => {
      return sum + (order.pricing.deliveryFee * 0.8); // 80% of delivery fee goes to delivery partner
    }, 0);

    res.json({
      success: true,
      data: {
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        totalEarnings: totalEarnings.toFixed(2),
        completedDeliveries: completedOrders.length
      }
    });
  } catch (error) {
    console.error('Get delivery partner orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getVendorOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  getAvailableDeliveryOrders,
  getDeliveryPartnerOrders
};
