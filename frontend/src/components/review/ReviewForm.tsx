'use client';

import { useState } from 'react';
import { reviewAPI } from '@/lib/api';
import { Star, Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  productId: string;
  orderId: string;
  productName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  productId,
  orderId,
  productName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Convert files to base64 for demo (in production, upload to cloud storage)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    setLoading(true);
    try {
      await reviewAPI.createReview({
        productId,
        orderId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: images.length > 0 ? images : undefined,
      });

      toast.success('Review submitted successfully!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getRatingText = (rating: number) => {
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[rating] || '';
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-2">Write a Review</h3>
      <p className="text-gray-500 mb-6">Share your experience with {productName}</p>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <span className="text-sm font-medium text-gray-700">
              {getRatingText(hoveredRating || rating)}
            </span>
          )}
        </div>
      </div>

      {/* Review Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your review in a few words"
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Review Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike about this product? How was the quality and fit?"
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {comment.length}/1000
        </p>
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (Optional)
        </label>
        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative w-20 h-20">
              <Image
                src={image}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500 transition">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-gray-400" />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Add up to 5 photos (max 5MB each)
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || rating === 0 || !comment.trim()}
          className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  );
}
