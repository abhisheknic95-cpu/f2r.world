export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'seller' | 'admin';
  addresses?: Address[];
  wallet?: number;
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface Product {
  _id: string;
  vendor: {
    _id: string;
    businessName: string;
    rating?: number;
  };
  name: string;
  slug: string;
  description: string;
  category: string;
  brand?: string;
  images: string[];
  video?: string;
  mrp: number;
  sellingPrice: number;
  vendorDiscount: number;
  websiteDiscount: number;
  finalPrice: number;
  variants: ProductVariant[];
  upperMaterial?: string;
  soleMaterial?: string;
  warranty?: string;
  usp?: string;
  technology?: string;
  gender: 'men' | 'women' | 'kids' | 'unisex';
  tags: string[];
  rating: number;
  totalReviews: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
  finalPrice: number;
  itemTotal: number;
  inStock: boolean;
  availableStock: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingCharges: number;
  total: number;
}

export interface OrderItem {
  product: string;
  vendor: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  finalPrice: number;
  status: string;
  trackingId?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  customer: User;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  shippingCharges: number;
  couponCode?: string;
  couponDiscount: number;
  total: number;
  paymentMethod: 'cod' | 'razorpay' | 'wallet';
  paymentStatus: string;
  status: string;
  estimatedDelivery?: string;
  createdAt: string;
}

export interface Banner {
  _id: string;
  title: string;
  image: string;
  mobileImage?: string;
  link?: string;
  position: 'hero' | 'middle' | 'bottom';
  order: number;
  isActive: boolean;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
