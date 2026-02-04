import HeroBanner from "@/components/home/HeroBanner";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import { Truck, Shield, CreditCard, Headphones } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Features Strip */}
      <section className="py-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3">
              <Truck className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-semibold text-sm dark:text-white">Free Delivery</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">On orders above ₹499</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3">
              <Shield className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-semibold text-sm dark:text-white">100% Authentic</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Genuine products only</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3">
              <CreditCard className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-semibold text-sm dark:text-white">Secure Payment</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">COD & Online options</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3">
              <Headphones className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-semibold text-sm dark:text-white">24/7 Support</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dedicated help center</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <CategorySection />

      {/* Featured Products */}
      <FeaturedProducts
        title="Trending Now"
        subtitle="Most popular picks this week"
        limit={8}
        viewAllLink="/products?sort=popular"
      />

      {/* Promo Banner */}
      <section className="py-12 bg-gradient-to-r from-orange-500 to-pink-500">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Become a Seller on F2R
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join India's fastest growing footwear marketplace and reach millions of customers
          </p>
          <a
            href="/seller/register"
            className="inline-block bg-white text-orange-500 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            Start Selling Today
          </a>
        </div>
      </section>

      {/* Sports Shoes */}
      <FeaturedProducts
        title="Sports Shoes"
        subtitle="For the athlete in you"
        category="sports_shoes"
        limit={4}
        viewAllLink="/products?category=sports_shoes"
      />

      {/* Men's Collection */}
      <div className="bg-gray-50 dark:bg-gray-900">
        <FeaturedProducts
          title="Men's Collection"
          subtitle="Stylish footwear for men"
          gender="men"
          limit={4}
          viewAllLink="/products?gender=men"
        />
      </div>

      {/* Women's Collection */}
      <FeaturedProducts
        title="Women's Collection"
        subtitle="Trendy footwear for women"
        gender="women"
        limit={4}
        viewAllLink="/products?gender=women"
      />

      {/* Newsletter */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-gray-400 mb-6">
            Get updates on new arrivals and exclusive offers
          </p>
          <form className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
