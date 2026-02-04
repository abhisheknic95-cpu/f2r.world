'use client';

import Link from 'next/link';
import { categories } from '@/lib/utils';

export default function CategorySection() {
  const categoryImages: Record<string, string> = {
    sports_shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
    sneaker: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=200&h=200&fit=crop',
    sandals: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=200&h=200&fit=crop',
    slipper: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=200&h=200&fit=crop',
    formal: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=200&h=200&fit=crop',
    casual: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=200&h=200&fit=crop',
    hawaii: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=200&h=200&fit=crop',
  };

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Shop by Category
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="group flex flex-col items-center"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-gray-800 shadow-md overflow-hidden group-hover:shadow-lg transition-all group-hover:scale-105">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${categoryImages[category.id]})` }}
                />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-500 transition">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
