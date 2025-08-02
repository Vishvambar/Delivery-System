const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required']
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: 0
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  specialInstructions: {
    type: String,
    maxlength: [100, 'Special instructions cannot exceed 100 characters']
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: false  // Auto-generated in pre-save middleware
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'Pending',
      'Accepted',
      'Prepared',
      'Handed to Delivery',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ],
    default: 'Pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required']
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    },
    instructions: {
      type: String,
      maxlength: [200, 'Instructions cannot exceed 200 characters']
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: 0
    },
    deliveryFee: {
      type: Number,
      required: [true, 'Delivery fee is required'],
      min: 0
    },
    tax: {
      type: Number,
      required: [true, 'Tax is required'],
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: 0
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet', 'upi'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: [300, 'Review cannot exceed 300 characters']
    },
    reviewDate: Date
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ assignedTo: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp}${random}`;
  }

  // Add status to history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.updatedBy || null
    });
  }

  next();
});

// Virtual for delivery time in minutes
orderSchema.virtual('deliveryTimeMinutes').get(function() {
  if (this.actualDeliveryTime && this.createdAt) {
    return Math.round((this.actualDeliveryTime - this.createdAt) / (1000 * 60));
  }
  return null;
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.round((Date.now() - this.createdAt) / (1000 * 60)); // in minutes
});

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status) {
  return this.find({ status })
    .populate('customerId', 'name phone')
    .populate('vendorId', 'businessName location')
    .populate('assignedTo', 'name phone')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema);
