'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cartAPI, adminAPI } from '@/lib/api';
import { Cart, Coupon } from '@/types';
import useStore from '@/store/useStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Trash2, Plus, Minus, ShoppingBag, Tag, Loader2, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, setCartCount } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data.cart);
      setCartCount(response.data.cart?.items?.length || 0);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    size: string,
    color: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    setUpdating(`${productId}-${size}-${color}`);
    try {
      await cartAPI.updateCartItem({ productId, size, color, quantity: newQuantity });
      await fetchCart();
      toast.success('Cart updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: string, size: string, color: string) => {
    setUpdating(`${productId}-${size}-${color}`);
    try {
      await cartAPI.removeFromCart({ productId, size, color });
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await adminAPI.validateCoupon(couponCode, cart?.subtotal || 0);
      setAppliedCoupon(response.data.coupon);
      toast.success('Coupon applied successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      router.push('/auth/login?redirect=/cart');
      return;
    }
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-24 h-24 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
        <Link
          href="/products"
          className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const totalDiscount = appliedCoupon?.discount || 0;
  const finalTotal = cart.total - totalDiscount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart ({cart.items.length} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={`${item.product._id}-${item.size}-${item.color}`}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.product.images?.[0] || '/placeholder-shoe.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-medium text-gray-900 hover:text-orange-500">
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      Size: {item.size} | Color: {item.color}
                    </p>

                    {!item.inStock && (
                      <p className="text-sm text-red-500 mt-1">Out of stock</p>
                    )}

                    {/* Price */}
                    <div className="mt-2">
                      <span className="font-bold text-lg">
                        {formatPrice(item.finalPrice)}
                      </span>
                      {item.product.mrp > item.finalPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {formatPrice(item.product.mrp)}
                        </span>
                      )}
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product._id,
                              item.size,
                              item.color,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            item.quantity <= 1 ||
                            updating === `${item.product._id}-${item.size}-${item.color}`
                          }
                          className="p-2 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product._id,
                              item.size,
                              item.color,
                              item.quantity + 1
                            )
                          }
                          disabled={
                            item.quantity >= item.availableStock ||
                            updating === `${item.product._id}-${item.size}-${item.color}`
                          }
                          className="p-2 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveItem(item.product._id, item.size, item.color)
                        }
                        disabled={
                          updating === `${item.product._id}-${item.size}-${item.color}`
                        }
                        className="text-red-500 hover:text-red-600 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                  >
                    {applyingCoupon ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg text-green-600 text-sm flex items-center justify-between">
                    <span>
                      {appliedCoupon.code} applied - You save {formatPrice(appliedCoupon.discount)}
                    </span>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }}
                      className="text-green-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={cart.shippingCharges === 0 ? 'text-green-600' : ''}>
                    {cart.shippingCharges === 0 ? 'FREE' : formatPrice(cart.shippingCharges)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {cart.shippingCharges > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Add {formatPrice(499 - cart.subtotal)} more for free delivery
                </p>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Continue Shopping */}
              <Link
                href="/products"
                className="block text-center mt-4 text-orange-500 hover:underline text-sm"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
