'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cartAPI } from '@/lib/api';
import useStore from '@/store/useStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setCartCount, cartCount } = useStore();

  const discount = calculateDiscount(product.mrp, product.sellingPrice);
  const finalPrice = product.sellingPrice -
    (product.sellingPrice * product.vendorDiscount / 100) -
    (product.sellingPrice * product.websiteDiscount / 100);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.variants.length === 0 || product.variants[0].stock === 0) {
      toast.error('Product out of stock');
      return;
    }

    setIsLoading(true);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        size: product.variants[0].size,
        color: product.variants[0].color,
        quantity: 1,
      });
      setCartCount(cartCount + 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={product.images[0] || '/placeholder-shoe.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium">
              {discount}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
              toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
            }}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>

          {/* Quick Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="absolute bottom-2 right-2 p-2 bg-orange-500 text-white rounded-full shadow-md hover:bg-orange-600 transition opacity-0 group-hover:opacity-100"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-3">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h3 className="font-medium text-gray-800 text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <div className="flex items-center bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">
                <span>{product.rating.toFixed(1)}</span>
                <Star className="w-3 h-3 ml-0.5 fill-current" />
              </div>
              <span className="text-xs text-gray-500">({product.totalReviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(finalPrice)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
              </>
            )}
          </div>

          {/* Additional Discount Tag */}
          {(product.vendorDiscount > 0 || product.websiteDiscount > 0) && (
            <p className="text-xs text-green-600 mt-1">
              Extra {product.vendorDiscount + product.websiteDiscount}% off
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
