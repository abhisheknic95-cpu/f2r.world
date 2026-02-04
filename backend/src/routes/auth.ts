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
router.post('/send-otp', validatePhone, sendOTP);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/register-seller', validateSellerRegistration, registerSeller);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/setup-admin', validateAdminSetup, setupAdmin);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login?error=google_auth_failed' }),
  googleCallback
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validateProfileUpdate, updateProfile);
router.post('/address', protect, validateAddress, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);

export default router;
