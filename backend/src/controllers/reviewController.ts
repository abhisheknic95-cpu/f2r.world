import { Request, Response } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// @desc    Create a review
// @route   POST /api/reviews
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, orderId, rating, title, comment, images } = req.body;

    // Verify the order belongs to the user and contains the product
    const order = await Order.findOne({ orderId });

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.customer.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to review this order' });
      return;
    }

    // Check if the order contains the product
    const orderItem = order.items.find(
      (item) => item.product.toString() === productId
    );

    if (!orderItem) {
      res.status(400).json({ success: false, message: 'Product not found in this order' });
      return;
    }

    // Check if order item was delivered
    if (orderItem.status !== 'delivered') {
      res.status(400).json({ success: false, message: 'You can only review delivered items' });
      return;
    }

    // Check if review already exists for this product and order
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user?._id,
      order: order._id,
    });

    if (existingReview) {
      res.status(400).json({ success: false, message: 'You have already reviewed this product for this order' });
      return;
    }

    // Create the review
    const review = await Review.create({
      product: productId,
      user: req.user?._id,
      order: order._id,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase: true,
    });

    // Update product average rating
    await updateProductRating(productId);

    // Populate user info for response
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name profilePicture');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
    });
  } catch (error: any) {
    console.error('Create Review Error:', error);
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'You have already reviewed this product for this order' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.productId as string;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    // Sort options
    let sortOption: any = { createdAt: -1 }; // newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1 };

    // Get reviews
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // Get total count
    const total = await Review.countDocuments({ product: productId });

    // Get rating breakdown
    const ratingBreakdown = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Calculate average rating
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // Format rating breakdown
    const breakdown: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdown.forEach((item) => {
      breakdown[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: {
        averageRating: stats[0]?.averageRating || 0,
        totalReviews: stats[0]?.totalReviews || 0,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Get Product Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
export const updateReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    // Check ownership
    if (review.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized to update this review' });
      return;
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;

    await review.save();

    // Update product rating
    await updateProductRating(review.product.toString());

    const updatedReview = await Review.findById(reviewId)
      .populate('user', 'name profilePicture');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Update Review Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    // Check ownership or admin
    if (review.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
      return;
    }

    const productId = review.product.toString();

    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete Review Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:reviewId/helpful
export const markHelpful = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    // Increment helpful count
    review.helpfulCount += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Marked as helpful',
      helpfulCount: review.helpfulCount,
    });
  } catch (error) {
    console.error('Mark Helpful Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({ user: req.user?._id })
      .populate('product', 'name images slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ user: req.user?._id });

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get My Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to update product rating
async function updateProductRating(productId: string): Promise<void> {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats[0]?.averageRating || 0,
    totalReviews: stats[0]?.totalReviews || 0,
  });
}
