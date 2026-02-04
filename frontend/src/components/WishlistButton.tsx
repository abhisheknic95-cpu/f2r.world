'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { wishlistAPI } from '@/lib/api';
import useStore from '@/store/useStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function WishlistButton({
  productId,
  className = '',
  size = 'md',
  showLabel = false,
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useStore();
  const router = useRouter();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [productId, user]);

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistAPI.checkWishlist(productId);
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      // Silently fail - user might not be logged in
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to wishlist');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(productId);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.addToWishlist(productId);
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={loading}
      className={`flex items-center gap-2 transition-all ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-all ${
          isInWishlist
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-500'
        }`}
      />
      {showLabel && (
        <span className={`text-sm ${isInWishlist ? 'text-red-500' : 'text-gray-600'}`}>
          {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </button>
  );
}
