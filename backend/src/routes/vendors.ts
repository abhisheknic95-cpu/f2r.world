import express from 'express';
import {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  getVendorDashboard,
  getVendorFinance,
  getAllVendors,
  approveVendor,
  updateCommission,
  toggleVendorStatus,
} from '../controllers/vendorController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Seller routes
router.post('/register', protect, registerVendor);
router.get('/profile', protect, authorize('seller'), getVendorProfile);
router.put('/profile', protect, authorize('seller'), updateVendorProfile);
router.get('/dashboard', protect, authorize('seller'), getVendorDashboard);
router.get('/finance', protect, authorize('seller'), getVendorFinance);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllVendors);
router.put('/admin/:vendorId/approve', protect, authorize('admin'), approveVendor);
router.put('/admin/:vendorId/commission', protect, authorize('admin'), updateCommission);
router.put('/admin/:vendorId/toggle-status', protect, authorize('admin'), toggleVendorStatus);

export default router;
