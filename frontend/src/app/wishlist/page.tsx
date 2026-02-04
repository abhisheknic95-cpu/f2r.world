'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { wishlistAPI, cartAPI } from '@/lib/api';
import useStore from '@/store/useStore';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  mrp: number;
  sellingPrice: number;
  vendorDiscount: number;
  websiteDiscount: number;
  rating: number;
  totalReviews: number;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { user } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/wishlist');
      return;
    }
    fetchWishlist();
  }, [user, router]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setProducts(response.data.wishlist.products || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: WishlistProduct) => {
    // Navigate to product page to select size and color
    router.push(`/products/${product.slug}`);
  };

  const calculateFinalPrice = (product: WishlistProduct) => {
    const vendorDiscountAmount = (product.sellingPrice * product.vendorDiscount) / 100;
    const websiteDiscountAmount = (product.sellingPrice * product.websiteDiscount) / 100;
    return product.sellingPrice - vendorDiscountAmount - websiteDiscountAmount;
  };

  const calculateDiscount = (product: WishlistProduct) => {
    const finalPrice = calculateFinalPrice(product);
    return Math.round(((product.mrp - finalPrice) / product.mrp) * 100);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 mt-1">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to clear your wishlist?')) {
                try {
                  await wishlistAPI.clearWishlist();
                  setProducts([]);
                  toast.success('Wishlist cleared');
                } catch (error) {
                  toast.error('Failed to clear wishlist');
                }
              }
            }}
            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save items you love to your wishlist</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const finalPrice = calculateFinalPrice(product);
            const discount = calculateDiscount(product);

            return (
              <div
                key={product._id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square">
                    <Image
                      src={product.images[0] || '/placeholder.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {discount}% OFF
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(product._id);
                      }}
                      disabled={removingId === product._id}
                      className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
                    >
                      {removingId === product._id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      )}
                    </button>
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-orange-500 transition">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{finalPrice.toLocaleString('en-IN')}
                    </span>
                    {discount > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mb-3 text-sm text-gray-500">
                      <span className="text-yellow-400">★</span>
                      {product.rating.toFixed(1)} ({product.totalReviews})
                    </div>
                  )}

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View Product
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
