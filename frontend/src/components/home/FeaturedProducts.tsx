'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { productAPI } from '@/lib/api';
import { Product } from '@/types';
import { ChevronRight, Loader2 } from 'lucide-react';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  category?: string;
  gender?: string;
  limit?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
}

export default function FeaturedProducts({
  title,
  subtitle,
  category,
  gender,
  limit = 8,
  showViewAll = true,
  viewAllLink,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params: any = { limit };
        if (category) params.category = category;
        if (gender) params.gender = gender;

        const response = await productAPI.getProducts(params);
        setProducts(response.data.products || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, gender, limit]);

  const link = viewAllLink || `/products${category ? `?category=${category}` : ''}${gender ? `?gender=${gender}` : ''}`;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {showViewAll && (
            <Link
              href={link}
              className="flex items-center text-orange-500 hover:text-orange-600 font-medium"
            >
              View All
              <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        )}
      </div>
    </section>
  );
}
