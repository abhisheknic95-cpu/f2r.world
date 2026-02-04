'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Heart,
  Package,
  LogOut,
  Store,
} from 'lucide-react';
import useStore from '@/store/useStore';
import { categories } from '@/lib/utils';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, cartCount, logout } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center py-1 text-sm">
        Free Delivery on orders above ₹499 | COD Available
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              F2R
            </div>
            <span className="hidden sm:block text-xs text-gray-500">Footwear to Retail</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for footwear, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-gray-50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1 text-gray-700 hover:text-orange-500"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block text-sm">
                  {isAuthenticated ? user?.name?.split(' ')[0] : 'Login'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.phone}</p>
                      </div>
                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Package className="w-4 h-4 mr-3" />
                        My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center px-4 py-2 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Wishlist
                      </Link>
                      {user?.role === 'seller' && (
                        <Link
                          href="/seller"
                          className="flex items-center px-4 py-2 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Store className="w-4 h-4 mr-3" />
                          Seller Dashboard
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Store className="w-4 h-4 mr-3" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 hover:bg-gray-50 text-red-500"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="block px-4 py-2 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Login / Sign Up
                      </Link>
                      <div className="border-t my-1" />
                      <Link
                        href="/seller/register"
                        className="flex items-center px-4 py-2 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Store className="w-4 h-4 mr-3" />
                        Become a Seller
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" className="relative flex items-center space-x-1 text-gray-700 hover:text-orange-500">
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:block text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for footwear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 bg-gray-50"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Categories Bar */}
      <nav className="border-t bg-gray-50 hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex items-center space-x-8 h-10 text-sm">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/products?category=${cat.id}`}
                  className="flex items-center space-x-1 text-gray-700 hover:text-orange-500 transition"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4">
            <h3 className="font-semibold mb-2">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.id}`}
                    className="flex items-center space-x-2 py-2 text-gray-700"
                    onClick={() => setShowMenu(false)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
