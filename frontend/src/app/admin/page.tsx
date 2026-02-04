'use client';

import { useEffect, useState } from 'react';
import { adminAPI, vendorAPI, orderAPI } from '@/lib/api';
import {
  Users,
  Store,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVendors: number;
  todayOrders: number;
  todayRevenue: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

interface RecentOrder {
  _id: string;
  orderId: string;
  user: { name: string; phone: string };
  total: number;
  status: string;
  createdAt: string;
}

interface PendingVendor {
  _id: string;
  businessName: string;
  user: { name: string; email: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, ordersRes, vendorsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getAllOrders({ limit: 5, sort: '-createdAt' }),
        adminAPI.getVendors({ status: 'pending', limit: 5 }),
      ]);

      setStats(dashboardRes.data);
      setRecentOrders(ordersRes.data.orders || []);
      setPendingVendors(vendorsRes.data.vendors || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome to F2R Management Console</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Today: {formatCurrency(stats?.todayRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Package className="w-4 h-4 mr-1" />
                Today: {stats?.todayOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalVendors || 0}</p>
              <p className="text-sm text-orange-600 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                Pending: {stats?.pendingVendors || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Active customers
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Order Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{stats?.ordersByStatus?.pending || 0}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats?.ordersByStatus?.confirmed || 0}</p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats?.ordersByStatus?.shipped || 0}</p>
            <p className="text-sm text-gray-600">Shipped</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats?.ordersByStatus?.delivered || 0}</p>
            <p className="text-sm text-gray-600">Delivered</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats?.ordersByStatus?.cancelled || 0}</p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-orange-500 hover:underline text-sm">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderId}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Guest'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No orders yet</p>
          )}
        </div>

        {/* Pending Vendors */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Pending Vendor Approvals</h2>
            <Link href="/admin/vendors" className="text-orange-500 hover:underline text-sm">
              View all
            </Link>
          </div>
          {pendingVendors.length > 0 ? (
            <div className="space-y-3">
              {pendingVendors.map((vendor) => (
                <div key={vendor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{vendor.businessName}</p>
                    <p className="text-sm text-gray-500">{vendor.user?.email}</p>
                  </div>
                  <Link
                    href={`/admin/vendors?id=${vendor._id}`}
                    className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No pending approvals</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/vendors"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center"
          >
            <Store className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium">Manage Vendors</p>
          </Link>
          <Link
            href="/admin/coupons"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center"
          >
            <Tag className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium">Create Coupon</p>
          </Link>
          <Link
            href="/admin/banners"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center"
          >
            <Package className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium">Manage Banners</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center"
          >
            <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium">View Analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
