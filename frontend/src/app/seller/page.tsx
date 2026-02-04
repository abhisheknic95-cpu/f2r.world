'use client';

import { useEffect, useState } from 'react';
import { vendorAPI } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  IndianRupee,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  pendingOrders: number;
  revenueGrowth: string;
  pendingPayment: number;
}

interface RecentOrder {
  orderId: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function SellerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await vendorAPI.getDashboard();
      const { dashboard } = response.data;
      setStats(dashboard.stats);
      setRecentOrders(dashboard.recentOrders);
      setVendor(dashboard.vendor);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="opacity-90 mt-1">{vendor?.businessName}</p>
        {!vendor?.isApproved && (
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <p className="text-sm">
              ⏳ Your seller account is pending approval. You'll be notified once approved.
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{stats?.totalOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {stats?.pendingOrders || 0} pending
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold mt-1">
                {formatPrice(stats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            {Number(stats?.revenueGrowth) >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">+{stats?.revenueGrowth}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-red-500">{stats?.revenueGrowth}%</span>
              </>
            )}
            <span className="text-gray-500">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivered Orders</p>
              <p className="text-2xl font-bold mt-1">{stats?.deliveredOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">This month</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Payment</p>
              <p className="text-2xl font-bold mt-1">
                {formatPrice(stats?.pendingPayment || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">Will be settled soon</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-lg">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Order ID
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{order.orderId}</td>
                    <td className="px-6 py-4 text-sm">{order.customerName}</td>
                    <td className="px-6 py-4 text-sm">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-500">
              No orders yet. Products you sell will appear here.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/seller/products/new"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium">Add New Product</h3>
            <p className="text-sm text-gray-500">List a new product for sale</p>
          </div>
        </a>

        <a
          href="/seller/orders"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Manage Orders</h3>
            <p className="text-sm text-gray-500">View and update order status</p>
          </div>
        </a>

        <a
          href="/seller/finance"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium">View Finances</h3>
            <p className="text-sm text-gray-500">Check earnings and payments</p>
          </div>
        </a>
      </div>
    </div>
  );
}
