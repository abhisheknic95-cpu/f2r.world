import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  moveAllToCart,
} from '../controllers/wishlistController';
import { protect } from '../middleware/auth';
import { validateWishlistItem } from '../middleware/validators';

const router = express.Router();

// All routes are protected
router.use(protect as any);

router.get('/', getWishlist as any);
router.post('/add', validateWishlistItem as any, addToWishlist as any);
router.delete('/remove/:productId', removeFromWishlist as any);
router.get('/check/:productId', checkWishlist as any);
router.delete('/clear', clearWishlist as any);
router.post('/move-to-cart', moveAllToCart as any);

export default router;
