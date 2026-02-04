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
router.get('/', getCart as any);
router.post('/add', addToCart as any);
router.put('/update', updateCartItem as any);
router.delete('/remove', removeFromCart as any);
router.delete('/clear', clearCart as any);

// Merge cart after login
router.post('/merge', protect as any, mergeCart as any);

export default router;
