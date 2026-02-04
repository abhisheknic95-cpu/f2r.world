import express from 'express';
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
  getVendorOrders,
  updateItemStatus,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  downloadInvoice,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import { validateOrder, validatePaymentVerification, validatePagination } from '../middleware/validators';

const router = express.Router();

// Customer routes
router.post('/', protect, validateOrder, createOrder);
router.post('/verify-payment', protect, validatePaymentVerification, verifyPayment);
router.get('/my-orders', protect, validatePagination, getMyOrders);
router.get('/:orderId', protect, getOrder);
router.get('/:orderId/invoice', protect, downloadInvoice);
router.put('/:orderId/cancel', protect, cancelOrder);

// Vendor routes
router.get('/vendor/orders', protect, authorize('seller'), getVendorOrders);
router.put('/:orderId/items/:itemId/status', protect, authorize('seller'), updateItemStatus);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllOrders);
router.put('/admin/:orderId/status', protect, authorize('admin'), updateOrderStatus);

export default router;
