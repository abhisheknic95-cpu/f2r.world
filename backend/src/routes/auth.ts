import express from 'express';
import passport from 'passport';
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
  googleCallback,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import {
  validatePhone,
  validateOTP,
  validateSellerRegistration,
  validateLogin,
  validateProfileUpdate,
  validateAddress,
  validateAdminSetup,
} from '../middleware/validators';

const router = express.Router();

// Public routes
router.post('/send-otp', validatePhone as any, sendOTP as any);
router.post('/verify-otp', validateOTP as any, verifyOTP as any);
router.post('/register-seller', validateSellerRegistration as any, registerSeller as any);
router.post('/login', validateLogin as any, login as any);
router.post('/logout', logout as any);
router.post('/setup-admin', validateAdminSetup as any, setupAdmin as any);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }) as any);
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login?error=google_auth_failed' }) as any,
  googleCallback as any
);

// Protected routes
router.get('/me', protect as any, getMe as any);
router.put('/profile', protect as any, validateProfileUpdate as any, updateProfile as any);
router.post('/address', protect as any, validateAddress as any, addAddress as any);
router.delete('/address/:addressId', protect as any, deleteAddress as any);

export default router;
