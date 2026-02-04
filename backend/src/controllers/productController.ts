import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import Vendor from '../models/Vendor';

// @desc    Get all products (public)
// @route   GET /api/products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      gender,
      minPrice,
      maxPrice,
      brand,
      sort,
      search,
    } = req.query;

    const query: any = { isActive: true };

    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) query.sellingPrice.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    let sortOptions: any = { createdAt: -1 };
    if (sort === 'price_low') sortOptions = { sellingPrice: 1 };
    if (sort === 'price_high') sortOptions = { sellingPrice: -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };
    if (sort === 'popular') sortOptions = { totalSold: -1 };
    if (sort === 'newest') sortOptions = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('vendor', 'businessName rating')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:slug
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('vendor', 'businessName rating totalOrders');

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('vendor', 'businessName')
      .limit(12);

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('Get Featured Products Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({
      category: req.params.category,
      isActive: true,
    })
      .populate('vendor', 'businessName')
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({
      category: req.params.category,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error('Get Products By Category Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create product (Seller)
// @route   POST /api/products
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id, isApproved: true });

    if (!vendor) {
      res.status(403).json({
        success: false,
        message: 'You must be an approved vendor to create products',
      });
      return;
    }

    const productData = {
      ...req.body,
      vendor: vendor._id,
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update product (Seller)
// @route   PUT /api/products/:id
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({ success: false, message: 'Vendor not found' });
      return;
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Check if product belongs to this vendor
    if (product.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to update this product' });
      return;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete product (Seller)
// @route   DELETE /api/products/:id
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (product.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get vendor's products
// @route   GET /api/products/vendor/my-products
export const getVendorProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vendor = await Vendor.findOne({ user: req.user?._id });

    if (!vendor) {
      res.status(403).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { vendor: vendor._id };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error) {
    console.error('Get Vendor Products Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { variants } = req.body;

    const vendor = await Vendor.findOne({ user: req.user?._id });
    if (!vendor) {
      res.status(403).json({ success: false, message: 'Vendor not found' });
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (product.vendor.toString() !== vendor._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    product.variants = variants;
    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Update Stock Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
