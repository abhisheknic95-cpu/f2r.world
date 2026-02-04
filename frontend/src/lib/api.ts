import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add session ID for guest cart
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  registerSeller: (data: any) => api.post('/auth/register-seller', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  addAddress: (data: any) => api.post('/auth/address', data),
  deleteAddress: (addressId: string) => api.delete(`/auth/address/${addressId}`),
  logout: () => api.post('/auth/logout'),
};

// Product APIs
export const productAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getProduct: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getByCategory: (category: string, params?: any) =>
    api.get(`/products/category/${category}`, { params }),
  // Seller APIs
  getVendorProducts: (params?: any) => api.get('/products/vendor/my-products', { params }),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  updateStock: (id: string, variants: any) => api.put(`/products/${id}/stock`, { variants }),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

// Cart APIs
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data: { productId: string; size: string; color: string; quantity?: number }) =>
    api.post('/cart/add', data),
  updateCartItem: (data: { productId: string; size: string; color: string; quantity: number }) =>
    api.put('/cart/update', data),
  removeFromCart: (data: { productId: string; size: string; color: string }) =>
    api.delete('/cart/remove', { data }),
  clearCart: () => api.delete('/cart/clear'),
  mergeCart: (sessionId: string) => api.post('/cart/merge', { sessionId }),
};

// Order APIs
export const orderAPI = {
  createOrder: (data: any) => api.post('/orders', data),
  verifyPayment: (data: any) => api.post('/orders/verify-payment', data),
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  getOrder: (orderId: string) => api.get(`/orders/${orderId}`),
  cancelOrder: (orderId: string) => api.put(`/orders/${orderId}/cancel`),
  // Vendor APIs
  getVendorOrders: (params?: any) => api.get('/orders/vendor/orders', { params }),
  updateItemStatus: (orderId: string, itemId: string, status: string) =>
    api.put(`/orders/${orderId}/items/${itemId}/status`, { status }),
};

// Vendor APIs
export const vendorAPI = {
  register: (data: any) => api.post('/vendors/register', data),
  getProfile: () => api.get('/vendors/profile'),
  updateProfile: (data: any) => api.put('/vendors/profile', data),
  getDashboard: () => api.get('/vendors/dashboard'),
  getFinance: (params?: any) => api.get('/vendors/finance', { params }),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getVendors: (params?: any) => api.get('/vendors/admin/all', { params }),
  approveVendor: (vendorId: string, approve: boolean) =>
    api.put(`/vendors/admin/${vendorId}/approve`, { approve }),
  updateCommission: (vendorId: string, commission: number) =>
    api.put(`/vendors/admin/${vendorId}/commission`, { commission }),
  toggleVendorStatus: (vendorId: string) =>
    api.put(`/vendors/admin/${vendorId}/toggle-status`),
  getBanners: () => api.get('/admin/banners'),
  createBanner: (data: any) => api.post('/admin/banners', data),
  updateBanner: (id: string, data: any) => api.put(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`/admin/banners/${id}`),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: any) => api.post('/admin/coupons', data),
  updateCoupon: (id: string, data: any) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}`),
  validateCoupon: (code: string, cartTotal: number) =>
    api.post('/admin/coupons/validate', { code, cartTotal }),
  promoteProduct: (id: string, isFeatured: boolean) =>
    api.put(`/admin/products/${id}/promote`, { isFeatured }),
  applyDiscount: (productIds: string[], discount: number) =>
    api.put('/admin/products/discount', { productIds, discount }),
  exportOrders: (params?: any) => api.get('/admin/orders/export', { params }),
  getAllOrders: (params?: any) => api.get('/orders/admin/all', { params }),
};

export default api;
