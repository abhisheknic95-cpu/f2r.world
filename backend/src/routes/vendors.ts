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
import { validateVendorRegistration } from '../middleware/validators';

const router = express.Router();

// Seller routes
router.post('/register', protect as any, validateVendorRegistration as any, registerVendor as any);
router.get('/profile', protect as any, authorize('seller') as any, getVendorProfile as any);
router.put('/profile', protect as any, authorize('seller') as any, updateVendorProfile as any);
router.get('/dashboard', protect as any, authorize('seller') as any, getVendorDashboard as any);
router.get('/finance', protect as any, authorize('seller') as any, getVendorFinance as any);

// Admin routes
router.get('/admin/all', protect as any, authorize('admin') as any, getAllVendors as any);
router.put('/admin/:vendorId/approve', protect as any, authorize('admin') as any, approveVendor as any);
router.put('/admin/:vendorId/commission', protect as any, authorize('admin') as any, updateCommission as any);
router.put('/admin/:vendorId/toggle-status', protect as any, authorize('admin') as any, toggleVendorStatus as any);

export default router;
