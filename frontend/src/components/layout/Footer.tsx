'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
              F2R
            </h3>
            <p className="text-sm mb-4">
              India's leading multi-vendor footwear marketplace. Shop from thousands of sellers
              offering quality footwear at the best prices.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-orange-500 transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-orange-500 transition">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-orange-500 transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-orange-500 transition">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-orange-500 transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=sports_shoes" className="hover:text-orange-500 transition">
                  Sports Shoes
                </Link>
              </li>
              <li>
                <Link href="/products?category=sneaker" className="hover:text-orange-500 transition">
                  Sneakers
                </Link>
              </li>
              <li>
                <Link href="/products?category=sandals" className="hover:text-orange-500 transition">
                  Sandals
                </Link>
              </li>
              <li>
                <Link href="/products?gender=men" className="hover:text-orange-500 transition">
                  Men's Footwear
                </Link>
              </li>
              <li>
                <Link href="/products?gender=women" className="hover:text-orange-500 transition">
                  Women's Footwear
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help/track-order" className="hover:text-orange-500 transition">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/help/returns" className="hover:text-orange-500 transition">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/help/shipping" className="hover:text-orange-500 transition">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/help/faq" className="hover:text-orange-500 transition">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/seller/register" className="hover:text-orange-500 transition">
                  Become a Seller
                </Link>
              </li>
              <li>
                <Link href="/help/contact" className="hover:text-orange-500 transition">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>F2R Marketplace, Mumbai, Maharashtra, India</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>+91 9876543210</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>support@f2r.co.in</span>
              </li>
            </ul>
            <div className="mt-4">
              <h5 className="font-medium text-white mb-2">We Accept</h5>
              <div className="flex space-x-2">
                <div className="bg-white rounded px-2 py-1 text-xs text-gray-800 font-medium">
                  Razorpay
                </div>
                <div className="bg-white rounded px-2 py-1 text-xs text-gray-800 font-medium">
                  UPI
                </div>
                <div className="bg-white rounded px-2 py-1 text-xs text-gray-800 font-medium">
                  COD
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; {currentYear} F2R Marketplace. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <Link href="/privacy" className="hover:text-orange-500 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-orange-500 transition">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
