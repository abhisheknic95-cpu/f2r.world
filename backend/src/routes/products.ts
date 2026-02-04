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
router.get('/', getProducts as any);
router.get('/featured', getFeaturedProducts as any);
router.get('/category/:category', getProductsByCategory as any);
router.get('/:slug', getProduct as any);

// Seller routes
router.get('/vendor/my-products', protect as any, authorize('seller') as any, getVendorProducts as any);
router.post('/', protect as any, authorize('seller') as any, createProduct as any);
router.put('/:id', protect as any, authorize('seller') as any, updateProduct as any);
router.put('/:id/stock', protect as any, authorize('seller') as any, updateStock as any);
router.delete('/:id', protect as any, authorize('seller') as any, deleteProduct as any);

export default router;
