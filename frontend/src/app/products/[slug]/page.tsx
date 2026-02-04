'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { productAPI, cartAPI } from '@/lib/api';
import { Product } from '@/types';
import useStore from '@/store/useStore';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Star,
  Heart,
  Share2,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
  Loader2,
  Check,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { cartCount, setCartCount, isAuthenticated } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getProduct(params.slug as string);
      const productData = response.data.product;
      setProduct(productData);

      // Set default selections
      if (productData.variants.length > 0) {
        const firstAvailable = productData.variants.find((v: any) => v.stock > 0);
        if (firstAvailable) {
          setSelectedSize(firstAvailable.size);
          setSelectedColor(firstAvailable.color);
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-500">Product not found</p>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 text-orange-500 hover:underline"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const discount = calculateDiscount(product.mrp, product.sellingPrice);
  const finalPrice =
    product.sellingPrice -
    (product.sellingPrice * product.vendorDiscount) / 100 -
    (product.sellingPrice * product.websiteDiscount) / 100;

  // Get unique sizes and colors
  const availableSizes = [...new Set(product.variants.map((v) => v.size))];
  const availableColors = [...new Set(product.variants.map((v) => v.color))];

  // Check stock for selected variant
  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const inStock = selectedVariant && selectedVariant.stock > 0;

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    if (!inStock) {
      toast.error('Selected variant is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      await cartAPI.addToCart({
        productId: product._id,
        size: selectedSize,
        color: selectedColor,
        quantity,
      });
      setCartCount(cartCount + quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      router.push('/auth/login');
      return;
    }

    await handleAddToCart();
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm text-gray-500">
            <button onClick={() => router.push('/')}>Home</button>
            <ChevronRight className="w-4 h-4 mx-1" />
            <button onClick={() => router.push('/products')}>Products</button>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={product.images[selectedImage] || '/placeholder-shoe.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {discount}% OFF
                </div>
              )}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-orange-500' : 'border-transparent'
                  }`}
                >
                  <Image src={image} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              {product.brand && (
                <p className="text-gray-500 uppercase tracking-wide text-sm mb-1">
                  {product.brand}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center bg-green-600 text-white px-2 py-1 rounded text-sm">
                    <span className="font-medium">{product.rating.toFixed(1)}</span>
                    <Star className="w-4 h-4 ml-1 fill-current" />
                  </div>
                  <span className="text-gray-500 text-sm">
                    ({product.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(finalPrice)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-green-600 font-medium">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="font-medium mb-3">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const hasStock = product.variants.some(
                    (v) => v.size === size && v.stock > 0
                  );
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={!hasStock}
                      className={`w-12 h-12 rounded-lg border-2 font-medium transition ${
                        selectedSize === size
                          ? 'border-orange-500 bg-orange-50 text-orange-500'
                          : hasStock
                          ? 'border-gray-200 hover:border-gray-400'
                          : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="font-medium mb-3">Select Color: {selectedColor}</h3>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const hasStock = product.variants.some(
                    (v) => v.color === color && v.size === selectedSize && v.stock > 0
                  );
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      disabled={!hasStock}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition ${
                        selectedColor === color
                          ? 'border-orange-500 bg-orange-50 text-orange-500'
                          : hasStock
                          ? 'border-gray-200 hover:border-gray-400'
                          : 'border-gray-100 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">In Stock</span>
                  <span className="text-gray-500 text-sm">
                    ({selectedVariant?.stock} available)
                  </span>
                </>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !inStock}
                className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-orange-500 text-orange-500 py-3 rounded-lg font-semibold hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t">
              <div className="flex flex-col items-center text-center">
                <Truck className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Secure Payment</span>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Product Details</h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">{product.description}</p>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {product.upperMaterial && (
                    <div>
                      <span className="text-gray-500">Upper Material:</span>
                      <span className="ml-2 text-gray-900">{product.upperMaterial}</span>
                    </div>
                  )}
                  {product.soleMaterial && (
                    <div>
                      <span className="text-gray-500">Sole Material:</span>
                      <span className="ml-2 text-gray-900">{product.soleMaterial}</span>
                    </div>
                  )}
                  {product.warranty && (
                    <div>
                      <span className="text-gray-500">Warranty:</span>
                      <span className="ml-2 text-gray-900">{product.warranty}</span>
                    </div>
                  )}
                  {product.technology && (
                    <div>
                      <span className="text-gray-500">Technology:</span>
                      <span className="ml-2 text-gray-900">{product.technology}</span>
                    </div>
                  )}
                </div>

                {product.usp && (
                  <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-600 font-medium">USP:</span>
                    <span className="ml-2 text-gray-700">{product.usp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">Sold By</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.vendor?.businessName}</p>
                  {product.vendor?.rating && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      {product.vendor.rating.toFixed(1)} rating
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
