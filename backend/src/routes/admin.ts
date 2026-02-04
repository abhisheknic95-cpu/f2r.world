import express from 'express';
import {
  getAdminDashboard,
  getAllUsers,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  promoteProduct,
  applyWebsiteDiscount,
  exportOrders,
  getAllProducts,
  updateProduct,
  getAnalytics,
  getSettings,
  updateSettings,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public route for coupon validation
router.post('/coupons/validate', validateCoupon);

// Public route for active banners
router.get('/banners/active', getBanners);

// Protected admin routes
router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAllUsers);

// Banner management
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

// Coupon management
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Product management
router.get('/products', getAllProducts);
router.put('/products/:id', updateProduct);
router.put('/products/:id/promote', promoteProduct);
router.put('/products/discount', applyWebsiteDiscount);

// Analytics
router.get('/analytics', getAnalytics);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Data export
router.get('/orders/export', exportOrders);

export default router;
