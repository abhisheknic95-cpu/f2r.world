'use client';

import { useState, useEffect } from 'react';
import { reviewAPI } from '@/lib/api';
import { Star, ThumbsUp, ChevronDown, User, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Review {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  user: {
    name: string;
    profilePicture?: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: { [key: number]: number };
}

interface ReviewListProps {
  productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('newest');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId, page, sort]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getProductReviews(productId, {
        page,
        limit: 5,
        sort,
      });
      setReviews(response.data.reviews);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewAPI.markHelpful(reviewId);
      setReviews(reviews.map(r =>
        r._id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      ));
      toast.success('Marked as helpful');
    } catch (error) {
      toast.error('Please login to mark reviews as helpful');
    }
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-gray-900">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(stats.averageRating), 'w-6 h-6')}
            <p className="text-gray-500 mt-2">
              Based on {stats.totalReviews} reviews
            </p>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.breakdown[rating] || 0;
              const percentage = stats.totalReviews > 0
                ? (count / stats.totalReviews) * 100
                : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-gray-600">{rating} star</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-400 h-2.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm text-gray-500 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {reviews.length} of {stats?.totalReviews || 0} reviews
          </p>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-gray-100 px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border-b pb-6 last:border-b-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {review.user.profilePicture ? (
                    <Image
                      src={review.user.profilePicture}
                      alt={review.user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{review.user.name}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      {review.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {/* Content */}
              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}
              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className="relative w-20 h-20 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={`Review image ${index + 1}`}
                        fill
                        className="object-cover hover:opacity-80 transition"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Helpful Button */}
              <button
                onClick={() => handleMarkHelpful(review._id)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">Be the first to review this product!</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <Image
              src={selectedImage}
              alt="Review image"
              width={800}
              height={800}
              className="object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-white rounded-full p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
