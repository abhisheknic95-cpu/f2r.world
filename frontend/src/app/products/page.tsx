'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { productAPI } from '@/lib/api';
import { Product } from '@/types';
import { categories, sizes, colors } from '@/lib/utils';
import { Loader2, Filter, X, ChevronDown } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    gender: searchParams.get('gender') || '',
    minPrice: '',
    maxPrice: '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || '',
  });

  useEffect(() => {
    fetchProducts();
  }, [currentPage, filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20,
        ...filters,
      };

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });

      const response = await productAPI.getProducts(params);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      gender: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      search: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {filters.search
                ? `Search results for "${filters.search}"`
                : filters.category
                ? categories.find((c) => c.id === filters.category)?.name || 'Products'
                : 'All Products'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {products.length} products found
            </p>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex items-center gap-2 bg-white dark:bg-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg border dark:border-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold dark:text-white">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-orange-500 hover:underline">
                  Clear All
                </button>
              </div>

              {/* Category */}
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2 dark:text-gray-200">Category</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center dark:text-gray-300">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.id}
                        onChange={() => handleFilterChange('category', cat.id)}
                        className="mr-2 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2 dark:text-gray-200">Gender</h4>
                <div className="space-y-2">
                  {['men', 'women', 'kids', 'unisex'].map((g) => (
                    <label key={g} className="flex items-center dark:text-gray-300">
                      <input
                        type="radio"
                        name="gender"
                        checked={filters.gender === g}
                        onChange={() => handleFilterChange('gender', g)}
                        className="mr-2 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm capitalize">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2 dark:text-gray-200">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filters Overlay */}
          {showFilters && (
            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
              <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg dark:text-white">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="dark:text-gray-300">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Same filters as desktop */}
                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 dark:text-gray-200">Category</h4>
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center dark:text-gray-300">
                          <input
                            type="radio"
                            name="category-mobile"
                            checked={filters.category === cat.id}
                            onChange={() => handleFilterChange('category', cat.id)}
                            className="mr-2"
                          />
                          <span className="text-sm">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 dark:text-gray-200">Gender</h4>
                    <div className="space-y-2">
                      {['men', 'women', 'kids', 'unisex'].map((g) => (
                        <label key={g} className="flex items-center dark:text-gray-300">
                          <input
                            type="radio"
                            name="gender-mobile"
                            checked={filters.gender === g}
                            onChange={() => handleFilterChange('gender', g)}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-6 bg-orange-500 text-white py-3 rounded-lg font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {products.length} products
              </span>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="border dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Best Rating</option>
              </select>
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border dark:border-gray-600 rounded-lg disabled:opacity-50 dark:text-gray-200 dark:bg-gray-800"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 dark:text-gray-200">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border dark:border-gray-600 rounded-lg disabled:opacity-50 dark:text-gray-200 dark:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg">No products found</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-orange-500 hover:underline"
                >
                  Clear filters and try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
