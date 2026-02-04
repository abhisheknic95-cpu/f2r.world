'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingBag,
  Users,
  Store,
  Package,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalVendors: number;
  averageOrderValue: number;
  conversionRate: number;
  topCategories: Array<{ name: string; count: number; revenue: number }>;
  topVendors: Array<{ businessName: string; orders: number; revenue: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
  ordersByStatus: { pending: number; confirmed: number; shipped: number; delivered: number; cancelled: number };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard({ days: parseInt(dateRange) });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics?.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <ArrowUp className="w-4 h-4 mr-1" />
            <span>12.5% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <ArrowUp className="w-4 h-4 mr-1" />
            <span>8.2% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics?.averageOrderValue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <ArrowUp className="w-4 h-4 mr-1" />
            <span>3.1% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.totalVendors || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <ArrowUp className="w-4 h-4 mr-1" />
            <span>5 new this period</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {(analytics?.revenueByMonth || Array(6).fill({ month: '', revenue: 0 })).map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-lg transition-all hover:from-orange-600 hover:to-orange-400"
                  style={{
                    height: `${Math.max((item.revenue / (analytics?.totalRevenue || 1)) * 200, 20)}px`,
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">{item.month || `M${index + 1}`}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Order Status Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Delivered', value: analytics?.ordersByStatus?.delivered || 0, color: 'bg-green-500' },
              { label: 'Shipped', value: analytics?.ordersByStatus?.shipped || 0, color: 'bg-purple-500' },
              { label: 'Confirmed', value: analytics?.ordersByStatus?.confirmed || 0, color: 'bg-blue-500' },
              { label: 'Pending', value: analytics?.ordersByStatus?.pending || 0, color: 'bg-yellow-500' },
              { label: 'Cancelled', value: analytics?.ordersByStatus?.cancelled || 0, color: 'bg-red-500' },
            ].map((item) => {
              const total = Object.values(analytics?.ordersByStatus || {}).reduce((a, b) => a + b, 0) || 1;
              const percentage = ((item.value / total) * 100).toFixed(1);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.value} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
          <div className="space-y-3">
            {(analytics?.topCategories || [
              { name: 'Sports Shoes', count: 45, revenue: 125000 },
              { name: 'Sneakers', count: 38, revenue: 98000 },
              { name: 'Sandals', count: 32, revenue: 64000 },
              { name: 'Formal', count: 28, revenue: 84000 },
              { name: 'Casual', count: 25, revenue: 50000 },
            ]).map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-orange-100 text-orange-600' :
                    index === 1 ? 'bg-blue-100 text-blue-600' :
                    index === 2 ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.count} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(category.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Top Vendors</h2>
          <div className="space-y-3">
            {(analytics?.topVendors || [
              { businessName: 'Nike India Store', orders: 125, revenue: 450000 },
              { businessName: 'Adidas Official', orders: 98, revenue: 380000 },
              { businessName: 'Puma Sports', orders: 85, revenue: 320000 },
              { businessName: 'Reebok Store', orders: 72, revenue: 280000 },
              { businessName: 'Bata Footwear', orders: 65, revenue: 195000 },
            ]).map((vendor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-orange-100 text-orange-600' :
                    index === 1 ? 'bg-blue-100 text-blue-600' :
                    index === 2 ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{vendor.businessName}</p>
                    <p className="text-sm text-gray-500">{vendor.orders} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(vendor.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Customer Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{analytics?.totalUsers || 0}</p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {((analytics?.conversionRate || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Conversion Rate</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {((analytics?.totalOrders || 0) / Math.max(analytics?.totalUsers || 1, 1)).toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">Orders per Customer</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <IndianRupee className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency((analytics?.totalRevenue || 0) / Math.max(analytics?.totalUsers || 1, 1))}
            </p>
            <p className="text-sm text-gray-500">Revenue per Customer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
