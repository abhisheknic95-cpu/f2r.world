import { Request, Response } from 'express';
import Vendor from '../models/Vendor';
import User from '../models/User';
import Order from '../models/Order';
import VendorPayment from '../models/VendorPayment';
import { AuthRequest } from '../middleware/auth';

// @desc    Register as vendor
// @route   POST /api/vendors/register
export const registerVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      businessName,
      businessEmail,
      businessPhone,
      gstin,
      panNumber,
      bankDetails,
      address,
    } = req.body;

    // Check if user already has a vendor profile
    const existingVendor = await Vendor.findOne({ user: req.user?._id });
    if (existingVendor) {
      res.status(400).json({
        success: false,
        message: 'You already have a vendor profile',
      });
      return;
    }

    const vendor = await Vendor.create({
      user: req.user?._id,
      businessName,
      businessEmail,
      businessPhone,
      gstin,
      panNumber,
      bankDetails,
      address,
    });

    // Update user role to seller
    await User.findByIdAndUpdate(req.user?._id, { role: 'seller' });

    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted for approval',
      vendor,
    });
  } catch (error) {
    console.error('Register Vendor Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
export const getVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id }).populate(
      'user',
      'name email phone'
    );

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor profile not found' });
      return;
    }

    res.status(200).json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error('Get Vendor Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
export const updateVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const allowedFields = [
      'businessName',
      'businessEmail',
      'businessPhone',
      'address',
      'bankDetails',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (vendor as any)[field] = req.body[field];
      }
    });

    await vendor.save();

    res.status(200).json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error('Update Vendor Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get vendor dashboard stats
// @route   GET /api/vendors/dashboard
export const getVendorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    // Get orders stats
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // This month orders
    const thisMonthOrders = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendor._id,
          createdAt: { $gte: startOfMonth },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$items.vendorEarning' },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$items.status', 'delivered'] }, 1, 0] },
          },
          pendingOrders: {
            $sum: {
              $cond: [
                { $in: ['$items.status', ['pending', 'confirmed', 'packaging']] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Last month orders for comparison
    const lastMonthOrders = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendor._id,
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.vendorEarning' },
        },
      },
    ]);

    // Recent orders
    const recentOrders = await Order.find({
      'items.vendor': vendor._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name');

    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
      { $match: { 'items.vendor': vendor._id } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: '$items.status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = thisMonthOrders[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      deliveredOrders: 0,
      pendingOrders: 0,
    };

    const lastMonthRevenue = lastMonthOrders[0]?.totalRevenue || 0;
    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((stats.totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          ...stats,
          revenueGrowth: revenueGrowth.toFixed(2),
          pendingPayment: vendor.pendingPayment,
        },
        recentOrders: recentOrders.map((order: any) => ({
          orderId: order.orderId,
          customerName: order.customer?.name,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        })),
        orderStatusDistribution,
        vendor: {
          businessName: vendor.businessName,
          rating: vendor.rating,
          isApproved: vendor.isApproved,
          isActive: vendor.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Get Vendor Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get vendor finance/payments
// @route   GET /api/vendors/finance
export const getVendorFinance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const { page = 1, limit = 10, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { vendor: vendor._id };
    if (from || to) {
      query['period.from'] = {};
      if (from) query['period.from'].$gte = new Date(from as string);
      if (to) query['period.to'] = { $lte: new Date(to as string) };
    }

    const payments = await VendorPayment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await VendorPayment.countDocuments(query);

    // Summary
    const summary = await VendorPayment.aggregate([
      { $match: { vendor: vendor._id } },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossAmount' },
          totalCommission: { $sum: '$commission' },
          totalNet: { $sum: '$netAmount' },
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netAmount', 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$netAmount', 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      payments,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      summary: summary[0] || {
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        totalPaid: 0,
        totalPending: 0,
      },
    });
  } catch (error) {
    console.error('Get Vendor Finance Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin endpoints

// @desc    Get all vendors (Admin)
// @route   GET /api/vendors/admin/all
export const getAllVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.isApproved = false;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const vendors = await Vendor.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Vendor.countDocuments(query);

    res.status(200).json({
      success: true,
      count: vendors.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      vendors,
    });
  } catch (error) {
    console.error('Get All Vendors Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve/Reject vendor (Admin)
// @route   PUT /api/vendors/admin/:vendorId/approve
export const approveVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { approve } = req.body;

    const vendor = await Vendor.findById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    vendor.isApproved = approve;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: approve ? 'Vendor approved' : 'Vendor rejected',
      vendor,
    });
  } catch (error) {
    console.error('Approve Vendor Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update vendor commission (Admin)
// @route   PUT /api/vendors/admin/:vendorId/commission
export const updateCommission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commission } = req.body;

    if (commission < 0 || commission > 100) {
      res.status(400).json({
        success: false,
        message: 'Commission must be between 0 and 100',
      });
      return;
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.vendorId,
      { commission },
      { new: true }
    );

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Commission updated',
      vendor,
    });
  } catch (error) {
    console.error('Update Commission Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Toggle vendor active status (Admin)
// @route   PUT /api/vendors/admin/:vendorId/toggle-status
export const toggleVendorStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);

    if (!vendor) {
      res.status(404).json({ success: false, message: 'Vendor not found' });
      return;
    }

    vendor.isActive = !vendor.isActive;
    await vendor.save();

    // Also update user status
    await User.findByIdAndUpdate(vendor.user, { isActive: vendor.isActive });

    res.status(200).json({
      success: true,
      message: vendor.isActive ? 'Vendor activated' : 'Vendor deactivated',
      vendor,
    });
  } catch (error) {
    console.error('Toggle Vendor Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
