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
router.post('/coupons/validate', validateCoupon as any);

// Public route for active banners
router.get('/banners/active', getBanners as any);

// Protected admin routes
router.use(protect as any, authorize('admin') as any);

router.get('/dashboard', getAdminDashboard as any);
router.get('/users', getAllUsers as any);

// Banner management
router.get('/banners', getBanners as any);
router.post('/banners', createBanner as any);
router.put('/banners/:id', updateBanner as any);
router.delete('/banners/:id', deleteBanner as any);

// Coupon management
router.get('/coupons', getCoupons as any);
router.post('/coupons', createCoupon as any);
router.put('/coupons/:id', updateCoupon as any);
router.delete('/coupons/:id', deleteCoupon as any);

// Product management
router.get('/products', getAllProducts as any);
router.put('/products/:id', updateProduct as any);
router.put('/products/:id/promote', promoteProduct as any);
router.put('/products/discount', applyWebsiteDiscount as any);

// Analytics
router.get('/analytics', getAnalytics as any);

// Settings
router.get('/settings', getSettings as any);
router.put('/settings', updateSettings as any);

// Data export
router.get('/orders/export', exportOrders as any);

export default router;
