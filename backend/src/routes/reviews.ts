import express from 'express';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getMyReviews,
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';
import { validateReview, validatePagination, validateMongoId } from '../middleware/validators';

const router = express.Router();

// Public routes
router.get('/product/:productId', validatePagination, getProductReviews);

// Protected routes
router.post('/', protect, validateReview, createReview);
router.get('/my-reviews', protect, validatePagination, getMyReviews);
router.put('/:reviewId', protect, ...validateMongoId('reviewId'), updateReview);
router.delete('/:reviewId', protect, ...validateMongoId('reviewId'), deleteReview);
router.post('/:reviewId/helpful', protect, ...validateMongoId('reviewId'), markHelpful);

export default router;
