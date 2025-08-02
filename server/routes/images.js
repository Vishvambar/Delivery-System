const express = require('express');
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');

const router = express.Router();

// @desc    Get vendor logo
// @route   GET /api/images/vendor-logo/:vendorId
// @access  Public
const getVendorLogo = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    
    if (!vendor || !vendor.logo || !vendor.logo.data) {
      return res.status(404).json({
        success: false,
        message: 'Vendor logo not found'
      });
    }

    res.set({
      'Content-Type': vendor.logo.contentType,
      'Content-Length': vendor.logo.data.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    res.send(vendor.logo.data);
  } catch (error) {
    console.error('Get vendor logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor logo'
    });
  }
};

// @desc    Get menu item image
// @route   GET /api/images/menu-item/:vendorId/:itemId
// @access  Public
const getMenuItemImage = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const menuItem = vendor.menu.id(req.params.itemId);
    
    if (!menuItem || !menuItem.image || !menuItem.image.data) {
      return res.status(404).json({
        success: false,
        message: 'Menu item image not found'
      });
    }

    res.set({
      'Content-Type': menuItem.image.contentType,
      'Content-Length': menuItem.image.data.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    res.send(menuItem.image.data);
  } catch (error) {
    console.error('Get menu item image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item image'
    });
  }
};

// @desc    Get base64 encoded vendor logo
// @route   GET /api/images/vendor-logo/:vendorId/base64
// @access  Public
const getVendorLogoBase64 = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    
    if (!vendor || !vendor.logo || !vendor.logo.data) {
      return res.status(404).json({
        success: false,
        message: 'Vendor logo not found'
      });
    }

    const base64Image = `data:${vendor.logo.contentType};base64,${vendor.logo.data.toString('base64')}`;

    res.json({
      success: true,
      data: {
        image: base64Image,
        contentType: vendor.logo.contentType,
        filename: vendor.logo.filename
      }
    });
  } catch (error) {
    console.error('Get vendor logo base64 error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor logo'
    });
  }
};

// @desc    Get base64 encoded menu item image
// @route   GET /api/images/menu-item/:vendorId/:itemId/base64
// @access  Public
const getMenuItemImageBase64 = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const menuItem = vendor.menu.id(req.params.itemId);
    
    if (!menuItem || !menuItem.image || !menuItem.image.data) {
      return res.status(404).json({
        success: false,
        message: 'Menu item image not found'
      });
    }

    const base64Image = `data:${menuItem.image.contentType};base64,${menuItem.image.data.toString('base64')}`;

    res.json({
      success: true,
      data: {
        image: base64Image,
        contentType: menuItem.image.contentType,
        filename: menuItem.image.filename
      }
    });
  } catch (error) {
    console.error('Get menu item image base64 error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item image'
    });
  }
};

router.get('/vendor-logo/:vendorId', getVendorLogo);
router.get('/menu-item/:vendorId/:itemId', getMenuItemImage);
router.get('/vendor-logo/:vendorId/base64', getVendorLogoBase64);
router.get('/menu-item/:vendorId/:itemId/base64', getMenuItemImageBase64);

module.exports = router;
