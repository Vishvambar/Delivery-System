const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['appetizer', 'main-course', 'dessert', 'beverage', 'snack']
  },
  image: {
    data: Buffer,
    contentType: String,
    filename: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    default: 'mild'
  }
}, {
  timestamps: true
});

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['restaurant', 'cafe', 'bakery', 'fast-food', 'dessert', 'beverage']
  },
  cuisineType: [{
    type: String,
    enum: ['indian', 'chinese', 'italian', 'mexican', 'american', 'thai', 'japanese']
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
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
    }
  },
  menu: [menuItemSchema],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  deliveryFee: {
    type: Number,
    default: 2.99,
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 10,
    min: 0
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 30
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
  type: Number,
  default: 0
  },
  logo: {
    data: Buffer,
    contentType: String,
    filename: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
vendorSchema.index({ 'location.coordinates': '2dsphere' });
vendorSchema.index({ category: 1 });
vendorSchema.index({ 'rating.average': -1 });
vendorSchema.index({ isOpen: 1 });

// Virtual for menu item count
vendorSchema.virtual('menuItemCount').get(function() {
  return this.menu ? this.menu.length : 0;
});

module.exports = mongoose.model('Vendor', vendorSchema);
