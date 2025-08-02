const express = require('express');
const {
  getVendors,
  getVendor,
  getVendorMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateVendorProfile,
  uploadVendorLogo,
  createVendorProfile
} = require('../controllers/vendorController');
const { auth, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendor);
router.get('/:id/menu', getVendorMenu);

// Protected routes - require authentication
router.use(auth);

// Vendor-only routes
router.post('/create-profile', authorize('vendor'), createVendorProfile);
router.post('/:id/menu', authorize('vendor'), upload.single('image'), handleMulterError, addMenuItem);
router.put('/:id/menu/:itemId', authorize('vendor'), upload.single('image'), handleMulterError, updateMenuItem);
router.delete('/:id/menu/:itemId', authorize('vendor'), deleteMenuItem);
router.put('/profile', authorize('vendor'), updateVendorProfile);
router.post('/:id/logo', authorize('vendor'), upload.single('logo'), handleMulterError, uploadVendorLogo);

module.exports = router;
