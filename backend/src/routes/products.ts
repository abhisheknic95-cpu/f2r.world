import express from 'express';
import {
  getProducts,
  getProduct,
  getFeaturedProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  updateStock,
} from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:slug', getProduct);

// Seller routes
router.get('/vendor/my-products', protect, authorize('seller'), getVendorProducts);
router.post('/', protect, authorize('seller'), createProduct);
router.put('/:id', protect, authorize('seller'), updateProduct);
router.put('/:id/stock', protect, authorize('seller'), updateStock);
router.delete('/:id', protect, authorize('seller'), deleteProduct);

export default router;
