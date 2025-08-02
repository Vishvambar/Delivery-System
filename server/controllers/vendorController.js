const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
const getVendors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      cuisineType, 
      minRating, 
      search,
      sortBy = 'rating',
      latitude,
      longitude,
      radius = 10, // km
      includeAll = false
    } = req.query;

    // For public queries, only show open vendors
    // For authenticated vendor queries, show all vendors (including their own closed profile)
    const query = {};
    if (!includeAll && !req.user) {
      query.isOpen = true;
    }

    // Apply filters
    if (category) query.category = category;
    if (cuisineType) query.cuisineType = { $in: [cuisineType] };
    if (minRating) query['rating.average'] = { $gte: parseFloat(minRating) };

    // Search functionality
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisineType: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Geolocation filter
    if (latitude && longitude) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Sort options
    let sortOption = {};
    switch (sortBy) {
      case 'rating':
        sortOption = { 'rating.average': -1 };
        break;
      case 'deliveryTime':
        sortOption = { estimatedDeliveryTime: 1 };
        break;
      case 'deliveryFee':
        sortOption = { deliveryFee: 1 };
        break;
      case 'name':
        sortOption = { businessName: 1 };
        break;
      default:
        sortOption = { 'rating.average': -1 };
    }

    const vendors = await Vendor.find(query)
      .populate('userId', 'name email phone')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Vendor.countDocuments(query);

    res.json({
      success: true,
      data: {
        vendors,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors'
    });
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Public
const getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: { vendor }
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor'
    });
  }
};

// @desc    Get vendor menu
// @route   GET /api/vendors/:id/menu
// @access  Public
const getVendorMenu = async (req, res) => {
  try {
    const { category, isVegetarian, minPrice, maxPrice } = req.query;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    let menu = vendor.menu;

    // Apply filters
    if (category) {
      menu = menu.filter(item => item.category === category);
    }
    if (isVegetarian === 'true') {
      menu = menu.filter(item => item.isVegetarian === true);
    }
    if (minPrice) {
      menu = menu.filter(item => item.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      menu = menu.filter(item => item.price <= parseFloat(maxPrice));
    }

    // Only show available items
    menu = menu.filter(item => item.isAvailable);

    res.json({
      success: true,
      data: { menu }
    });
  } catch (error) {
    console.error('Get vendor menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu'
    });
  }
};

// @desc    Add menu item
// @route   POST /api/vendors/:id/menu
// @access  Private (Vendor only)
const addMenuItem = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if user owns this vendor
    if (vendor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this vendor'
      });
    }

    const newMenuItem = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      preparationTime: req.body.preparationTime,
      isVegetarian: req.body.isVegetarian,
      spiceLevel: req.body.spiceLevel
    };

    // Handle image upload if file is provided
    if (req.file) {
      newMenuItem.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
    }

    vendor.menu.push(newMenuItem);
    await vendor.save();

    const addedItem = vendor.menu[vendor.menu.length - 1];

    // Emit socket event for real-time menu updates
    const io = req.app.get('io');
    io.emit('menu_item_added', {
      vendorId: vendor._id,
      menuItem: addedItem
    });

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: { 
        menuItem: addedItem
      }
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add menu item'
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/vendors/:id/menu/:itemId
// @access  Private (Vendor only)
const updateMenuItem = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if user owns this vendor
    if (vendor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this vendor'
      });
    }

    const menuItem = vendor.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        menuItem[key] = req.body[key];
      }
    });

    // Handle image upload if file is provided
    if (req.file) {
      menuItem.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname
      };
    }

    await vendor.save();

    // Emit socket event for real-time menu updates
    const io = req.app.get('io');
    io.emit('menu_item_updated', {
      vendorId: vendor._id,
      menuItem: menuItem
    });

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menuItem }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update menu item'
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/vendors/:id/menu/:itemId
// @access  Private (Vendor only)
const deleteMenuItem = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if user owns this vendor
    if (vendor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this vendor'
      });
    }

    const menuItem = vendor.menu.id(req.params.itemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    vendor.menu.pull(req.params.itemId);
    await vendor.save();

    // Emit socket event for real-time menu updates
    const io = req.app.get('io');
    io.emit('menu_item_deleted', {
      vendorId: vendor._id,
      menuItemId: req.params.itemId
    });

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item'
    });
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (Vendor only)
const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user.id });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const allowedUpdates = [
      'businessName', 'category', 'cuisineType', 'description', 
      'location', 'deliveryFee', 'minimumOrder', 'estimatedDeliveryTime',
      'operatingHours', 'isOpen'
    ];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendor._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: { vendor: updatedVendor }
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update vendor profile'
    });
  }
};

// @desc    Upload vendor logo
// @route   POST /api/vendors/:id/logo
// @access  Private (Vendor only)
const uploadVendorLogo = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if user owns this vendor
    if (vendor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this vendor'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file'
      });
    }

    vendor.logo = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname
    };

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor logo uploaded successfully',
      data: {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload vendor logo error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload vendor logo'
    });
  }
};

// @desc    Create vendor profile for existing user
// @route   POST /api/vendors/create-profile
// @access  Private (Vendor only)
const createVendorProfile = async (req, res) => {
  try {
    console.log(`🔍 Checking for existing vendor profile for user: ${req.user.id}`);
    
    // Check if user already has a vendor profile
    const existingVendor = await Vendor.findOne({ userId: req.user.id });
    if (existingVendor) {
      console.log(`⚠️ Vendor profile already exists for user ${req.user.id}: ${existingVendor._id}`);
      return res.status(400).json({
        success: false,
        message: 'Vendor profile already exists',
        data: {
          vendorId: existingVendor._id,
          businessName: existingVendor.businessName
        }
      });
    }
    
    console.log(`✅ No existing vendor profile found for user: ${req.user.id}`);

    // Check if user is a vendor
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendor users can create vendor profiles'
      });
    }

    // Create vendor profile with default values
    const vendor = await Vendor.create({
      userId: req.user.id,
      businessName: `${req.user.name}'s Restaurant`,
      category: 'restaurant',
      cuisineType: [],
      description: 'Welcome to our restaurant!',
      location: {
        address: req.user.address?.street || 'Address not set',
        city: req.user.address?.city || 'City not set',
        state: req.user.address?.state || 'State not set',
        zipCode: req.user.address?.zipCode || '00000',
        coordinates: {
          latitude: req.user.address?.coordinates?.latitude || 0,
          longitude: req.user.address?.coordinates?.longitude || 0
        }
      },
      operatingHours: {
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '21:00' },
        saturday: { open: '09:00', close: '21:00' },
        sunday: { open: '09:00', close: '21:00' }
      },
      deliveryFee: 2.99,
      minimumOrder: 10,
      estimatedDeliveryTime: 30,
      isOpen: false
    });

    console.log(`✅ Vendor profile created for existing user: ${req.user.id} - ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: 'Vendor profile created successfully',
      data: { vendor }
    });
  } catch (error) {
    console.error('Create vendor profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create vendor profile'
    });
  }
};

module.exports = {
  getVendors,
  getVendor,
  getVendorMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateVendorProfile,
  uploadVendorLogo,
  createVendorProfile
};
