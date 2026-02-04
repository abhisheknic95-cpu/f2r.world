import express from 'express';
import {
  sendOTP,
  verifyOTP,
  registerSeller,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  logout,
  setupAdmin,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register-seller', registerSeller);
router.post('/login', login);
router.post('/logout', logout);
router.post('/setup-admin', setupAdmin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);

export default router;
