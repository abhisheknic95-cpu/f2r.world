import { Request, Response } from 'express';
import User from '../models/User';
import Vendor from '../models/Vendor';
import Order from '../models/Order';
import Product from '../models/Product';
import Banner from '../models/Banner';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../middleware/auth';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Basic counts
    const [totalUsers, totalVendors, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Vendor.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
    ]);

    // This month stats
    const thisMonthStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Last month stats for comparison
    const lastMonthStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // Daily revenue for chart (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.finalPrice', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          image: { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId customer total status paymentMethod createdAt');

    // Pending vendor approvals
    const pendingVendors = await Vendor.find({ isApproved: false })
      .populate('user', 'name email')
      .limit(5);

    const thisMonth = thisMonthStats[0] || { totalRevenue: 0, totalOrders: 0 };
    const lastMonth = lastMonthStats[0] || { totalRevenue: 0, totalOrders: 0 };

    const revenueGrowth =
      lastMonth.totalRevenue > 0
        ? ((thisMonth.totalRevenue - lastMonth.totalRevenue) / lastMonth.totalRevenue) * 100
        : 0;

    const orderGrowth =
      lastMonth.totalOrders > 0
        ? ((thisMonth.totalOrders - lastMonth.totalOrders) / lastMonth.totalOrders) * 100
        : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          totalUsers,
          totalVendors,
          totalProducts,
          totalOrders,
          monthlyRevenue: thisMonth.totalRevenue,
          monthlyOrders: thisMonth.totalOrders,
          revenueGrowth: revenueGrowth.toFixed(2),
          orderGrowth: orderGrowth.toFixed(2),
        },
        dailyRevenue,
        orderStatusDistribution,
        topProducts,
        recentOrders,
        pendingVendors,
      },
    });
  } catch (error) {
    console.error('Get Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Banner Management

// @desc    Get all banners
// @route   GET /api/admin/banners
export const getBanners = async (req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find().sort({ position: 1, order: 1 });
    res.status(200).json({ success: true, banners });
  } catch (error) {
    console.error('Get Banners Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create banner
// @route   POST /api/admin/banners
export const createBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, banner });
  } catch (error) {
    console.error('Create Banner Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update banner
// @route   PUT /api/admin/banners/:id
export const updateBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner not found' });
      return;
    }

    res.status(200).json({ success: true, banner });
  } catch (error) {
    console.error('Update Banner Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete banner
// @route   DELETE /api/admin/banners/:id
export const deleteBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    console.error('Delete Banner Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Coupon Management

// @desc    Get all coupons
// @route   GET /api/admin/coupons
export const getCoupons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Get Coupons Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
export const updateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('Update Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
export const deleteCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Validate coupon (public)
// @route   POST /api/admin/coupons/validate
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, cartTotal } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
      return;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      return;
    }

    if (cartTotal < coupon.minOrderValue) {
      res.status(400).json({
        success: false,
        message: `Minimum order value is ₹${coupon.minOrderValue}`,
      });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
      },
    });
  } catch (error) {
    console.error('Validate Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update product visibility/promotion (Admin)
// @route   PUT /api/admin/products/:id/promote
export const promoteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isFeatured } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: isFeatured ? 'Product promoted' : 'Product unpromoted',
      product,
    });
  } catch (error) {
    console.error('Promote Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Apply website discount to products (Admin)
// @route   PUT /api/admin/products/discount
export const applyWebsiteDiscount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productIds, discount } = req.body;

    await Product.updateMany(
      { _id: { $in: productIds } },
      { websiteDiscount: discount }
    );

    res.status(200).json({
      success: true,
      message: `Discount of ${discount}% applied to ${productIds.length} products`,
    });
  } catch (error) {
    console.error('Apply Website Discount Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Export orders data
// @route   GET /api/admin/orders/export
export const exportOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, status } = req.query;

    const query: any = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.vendor', 'businessName')
      .sort({ createdAt: -1 });

    // Format data for export
    const exportData = orders.map((order: any) => ({
      'Order ID': order.orderId,
      Status: order.status,
      'Order Amount': order.total,
      'Payment Option': order.paymentMethod,
      'Payment Status': order.paymentStatus,
      'Order Date': order.createdAt.toISOString().split('T')[0],
      'Customer Name': order.customer?.name,
      'Customer Phone': order.customer?.phone,
      'Shipping City': order.shippingAddress.city,
      'Shipping Pincode': order.shippingAddress.pincode,
    }));

    res.status(200).json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Export Orders Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
