import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import Cart from '../models/Cart';
import Vendor from '../models/Vendor';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../middleware/auth';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay';
import { createShipment } from '../services/shiprocket';

// @desc    Create order
// @route   POST /api/orders
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'No items in order' });
      return;
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
        return;
      }

      const vendor = await Vendor.findById(product.vendor);
      if (!vendor) {
        res.status(400).json({ success: false, message: 'Vendor not found' });
        return;
      }

      // Check stock
      const variant = product.variants.find(
        (v) => v.size === item.size && v.color === item.color
      );
      if (!variant || variant.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
        return;
      }

      // Calculate prices
      const vendorDiscountAmount = (product.sellingPrice * product.vendorDiscount) / 100;
      const websiteDiscountAmount = (product.sellingPrice * product.websiteDiscount) / 100;
      const finalPrice = product.sellingPrice - vendorDiscountAmount - websiteDiscountAmount;
      const itemTotal = finalPrice * item.quantity;

      // Calculate commission and vendor earning
      const commission = (itemTotal * vendor.commission) / 100;
      const vendorEarning = itemTotal - commission;

      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        vendor: vendor._id,
        name: product.name,
        image: product.images[0],
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        vendorDiscount: product.vendorDiscount,
        websiteDiscount: product.websiteDiscount,
        finalPrice,
        commission,
        vendorEarning,
      });

      // Update stock
      variant.stock -= item.quantity;
      await product.save();
    }

    // Calculate shipping (free above 499)
    const shippingCharges = subtotal >= 499 ? 0 : 49;

    // Apply coupon if provided
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });

      if (coupon && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          couponDiscount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          }
        } else {
          couponDiscount = coupon.discountValue;
        }

        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const total = subtotal + shippingCharges - couponDiscount;

    // Create order
    const order = await Order.create({
      customer: req.user?._id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      shippingCharges,
      couponCode: couponCode?.toUpperCase(),
      couponDiscount,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user?._id });

    // If prepaid, create Razorpay order
    if (paymentMethod === 'razorpay') {
      const razorpayOrder = await createRazorpayOrder(total, order.orderId);
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      res.status(201).json({
        success: true,
        order,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      });
      return;
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const isValid = verifyRazorpaySignature(
      order.razorpayOrderId!,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
      return;
    }

    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find({ customer: req.user?._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments({ customer: req.user?._id });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error) {
    console.error('Get My Orders Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images slug');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Check if user is authorized to view this order
    if (
      req.user?.role === 'customer' &&
      order.customer._id.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get vendor orders
// @route   GET /api/orders/vendor/orders
export const getVendorOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const { page = 1, limit = 20, status, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage: any = {
      'items.vendor': vendor._id,
    };

    if (status) {
      matchStage['items.status'] = status;
    }

    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from as string);
      if (to) matchStage.createdAt.$lte = new Date(to as string);
    }

    const orders = await Order.find(matchStage)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter items to only show vendor's items
    const filteredOrders = orders.map((order) => ({
      ...order.toObject(),
      items: order.items.filter(
        (item) => item.vendor.toString() === vendor._id.toString()
      ),
    }));

    const total = await Order.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      orders: filteredOrders,
    });
  } catch (error) {
    console.error('Get Vendor Orders Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update order item status (Vendor)
// @route   PUT /api/orders/:orderId/items/:itemId/status
export const updateItemStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    const vendor = await Vendor.findOne({ user: req.user?._id });
    if (!vendor) {
      res.status(403).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const item = order.items.find(
      (i) => i._id?.toString() === req.params.itemId
    );

    if (!item) {
      res.status(404).json({ success: false, message: 'Order item not found' });
      return;
    }

    if (item.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    item.status = status;

    if (status === 'delivered') {
      item.deliveredAt = new Date();

      // Update vendor stats
      vendor.totalOrders += 1;
      vendor.totalRevenue += item.vendorEarning;
      vendor.pendingPayment += item.vendorEarning;
      await vendor.save();
    }

    await order.save();

    // Update overall order status
    const allDelivered = order.items.every((i) => i.status === 'delivered');
    const anyShipped = order.items.some(
      (i) => ['picked_up', 'in_transit'].includes(i.status)
    );

    if (allDelivered) {
      order.status = 'delivered';
    } else if (anyShipped) {
      order.status = 'shipped';
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Update Item Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Cancel order (Customer)
// @route   PUT /api/orders/:orderId/cancel
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.customer.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Can only cancel if not yet shipped
    if (!['pending', 'confirmed', 'processing'].includes(order.status)) {
      res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
      return;
    }

    order.status = 'cancelled';
    order.items.forEach((item) => {
      item.status = 'cancelled';
    });

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const variant = product.variants.find(
          (v) => v.size === item.size && v.color === item.color
        );
        if (variant) {
          variant.stock += item.quantity;
          await product.save();
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, from, to, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
