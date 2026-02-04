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
router.use(protect);

router.get('/', getWishlist);
router.post('/add', validateWishlistItem, addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlist);
router.delete('/clear', clearWishlist);
router.post('/move-to-cart', moveAllToCart);

export default router;
