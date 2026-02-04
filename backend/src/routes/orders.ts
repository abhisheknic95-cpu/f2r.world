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
router.post('/', protect as any, validateOrder as any, createOrder as any);
router.post('/verify-payment', protect as any, validatePaymentVerification as any, verifyPayment as any);
router.get('/my-orders', protect as any, validatePagination as any, getMyOrders as any);
router.get('/:orderId', protect as any, getOrder as any);
router.get('/:orderId/invoice', protect as any, downloadInvoice as any);
router.put('/:orderId/cancel', protect as any, cancelOrder as any);

// Vendor routes
router.get('/vendor/orders', protect as any, authorize('seller') as any, getVendorOrders as any);
router.put('/:orderId/items/:itemId/status', protect as any, authorize('seller') as any, updateItemStatus as any);

// Admin routes
router.get('/admin/all', protect as any, authorize('admin') as any, getAllOrders as any);
router.put('/admin/:orderId/status', protect as any, authorize('admin') as any, updateOrderStatus as any);

export default router;
