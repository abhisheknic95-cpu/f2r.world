'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useStore from '@/store/useStore';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  Tag,
  Image,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  TrendingUp,
  Package,
} from 'lucide-react';

const sidebarItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/vendors', label: 'Vendors', icon: Store },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin');
    } else if (user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Admin Access Required</h2>
          <p className="text-gray-500 mt-2">Please login with an admin account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-orange-500">Admin Panel</h1>
        <Shield className="w-6 h-6 text-gray-400" />
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-6 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">F2R Admin</h1>
                <p className="text-xs text-gray-400">Management Console</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="px-4 py-2 mb-2">
              <p className="font-medium text-white">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500 text-white text-xs rounded">
                Admin
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-gray-900">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h1 className="font-bold text-orange-500">Admin Panel</h1>
                <button onClick={() => setSidebarOpen(false)} className="text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4">
                <ul className="space-y-1">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                            isActive
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
