'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cartAPI, orderAPI, authAPI } from '@/lib/api';
import { Cart, Address } from '@/types';
import useStore from '@/store/useStore';
import { formatPrice, indianStates } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, MapPin, Plus, CreditCard, Banknote, Check } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, setCartCount } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('razorpay');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
    fetchData();
    loadRazorpay();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [cartRes, userRes] = await Promise.all([
        cartAPI.getCart(),
        authAPI.getMe(),
      ]);
      setCart(cartRes.data.cart);
      setAddresses(userRes.data.user.addresses || []);
      setUser(userRes.data.user);

      // Select default address
      const defaultAddr = userRes.data.user.addresses?.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authAPI.addAddress(newAddress);
      setAddresses(response.data.addresses);
      setSelectedAddress(response.data.addresses[response.data.addresses.length - 1]);
      setShowAddressForm(false);
      setNewAddress({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      });
      toast.success('Address added successfully');
    } catch (error) {
      toast.error('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.product._id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        shippingAddress: selectedAddress,
        paymentMethod,
      };

      const response = await orderAPI.createOrder(orderData);
      const order = response.data.order;

      if (paymentMethod === 'razorpay' && response.data.razorpayOrder) {
        // Open Razorpay checkout
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: response.data.razorpayOrder.amount,
          currency: response.data.razorpayOrder.currency,
          name: 'F2R Marketplace',
          description: `Order ${order.orderId}`,
          order_id: response.data.razorpayOrder.id,
          handler: async function (paymentResponse: any) {
            try {
              await orderAPI.verifyPayment({
                orderId: order.orderId,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              });
              setCartCount(0);
              toast.success('Payment successful!');
              router.push(`/orders/${order.orderId}`);
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: user?.name,
            contact: user?.phone,
            email: user?.email,
          },
          theme: {
            color: '#f97316',
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // COD order placed
        setCartCount(0);
        toast.success('Order placed successfully!');
        router.push(`/orders/${order.orderId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-xl text-gray-500">Your cart is empty</p>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Delivery Address
              </h2>

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                        selectedAddress?._id === addr._id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?._id === addr._id}
                        onChange={() => setSelectedAddress(addr)}
                        className="mt-1 mr-3 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{addr.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Phone: {addr.phone}</p>
                        {addr.isDefault && (
                          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No saved addresses</p>
              )}

              {/* Add New Address Button */}
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="mt-4 flex items-center gap-2 text-orange-500 hover:text-orange-600"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>

              {/* Add Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mt-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newAddress.name}
                      onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                    <textarea
                      placeholder="Address"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      className="md:col-span-2 px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                    <select
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                    paymentMethod === 'razorpay'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <CreditCard className="w-5 h-5 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">Pay Online</p>
                    <p className="text-sm text-gray-500">
                      Credit/Debit Card, UPI, Net Banking
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                    paymentMethod === 'cod'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <Banknote className="w-5 h-5 mr-3 text-gray-500" />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div
                    key={`${item.product._id}-${item.size}-${item.color}`}
                    className="flex gap-3"
                  >
                    <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={item.product.images?.[0] || '/placeholder-shoe.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p className="text-sm">
                        {formatPrice(item.finalPrice)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t mt-4 pt-4 space-y-2 text-sm">
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
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddress}
                className="w-full mt-6 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {placing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
