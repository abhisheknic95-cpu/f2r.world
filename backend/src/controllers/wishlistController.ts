import { Response } from 'express';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user?._id })
      .populate({
        path: 'products',
        select: 'name slug images mrp sellingPrice vendorDiscount websiteDiscount rating totalReviews isActive',
      });

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({
        user: req.user?._id,
        products: [],
      });
    }

    // Filter out inactive products
    const activeProducts = wishlist.products.filter(
      (product: any) => product.isActive
    );

    res.status(200).json({
      success: true,
      wishlist: {
        ...wishlist.toObject(),
        products: activeProducts,
      },
      count: activeProducts.length,
    });
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
export const addToWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user?._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user?._id,
        products: [productId],
      });
    } else {
      // Check if product already in wishlist
      if (wishlist.products.includes(productId)) {
        res.status(400).json({ success: false, message: 'Product already in wishlist' });
        return;
      }

      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      count: wishlist.products.length,
    });
  } catch (error) {
    console.error('Add to Wishlist Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/remove/:productId
export const removeFromWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user?._id });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Wishlist not found' });
      return;
    }

    const productIndex = wishlist.products.findIndex(
      (p) => p.toString() === productId
    );

    if (productIndex === -1) {
      res.status(400).json({ success: false, message: 'Product not in wishlist' });
      return;
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      count: wishlist.products.length,
    });
  } catch (error) {
    console.error('Remove from Wishlist Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
export const checkWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user?._id });

    const isInWishlist = wishlist
      ? wishlist.products.some((p) => p.toString() === productId)
      : false;

    res.status(200).json({
      success: true,
      isInWishlist,
    });
  } catch (error) {
    console.error('Check Wishlist Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
export const clearWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user?._id });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Wishlist not found' });
      return;
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
    });
  } catch (error) {
    console.error('Clear Wishlist Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Move all wishlist items to cart
// @route   POST /api/wishlist/move-to-cart
export const moveAllToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user?._id })
      .populate('products');

    if (!wishlist || wishlist.products.length === 0) {
      res.status(400).json({ success: false, message: 'Wishlist is empty' });
      return;
    }

    // Return products info for frontend to add to cart
    res.status(200).json({
      success: true,
      products: wishlist.products,
      message: 'Use the returned products to add to cart',
    });
  } catch (error) {
    console.error('Move to Cart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
