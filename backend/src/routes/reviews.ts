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
router.get('/product/:productId', validatePagination as any, getProductReviews as any);

// Protected routes
router.post('/', protect as any, validateReview as any, createReview as any);
router.get('/my-reviews', protect as any, validatePagination as any, getMyReviews as any);
router.put('/:reviewId', protect as any, ...(validateMongoId('reviewId') as any[]), updateReview as any);
router.delete('/:reviewId', protect as any, ...(validateMongoId('reviewId') as any[]), deleteReview as any);
router.post('/:reviewId/helpful', protect as any, ...(validateMongoId('reviewId') as any[]), markHelpful as any);

export default router;
