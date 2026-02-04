import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Cart can work with or without authentication
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

// Merge cart after login
router.post('/merge', protect, mergeCart);

export default router;
