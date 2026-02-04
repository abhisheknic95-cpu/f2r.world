'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: 'New Arrivals',
    subtitle: 'Step into Style',
    description: 'Discover the latest collection of trendy footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&h=600&fit=crop',
    link: '/products?sort=newest',
    bgColor: 'from-orange-500 to-pink-500',
  },
  {
    id: 2,
    title: 'Sports Collection',
    subtitle: 'Run the Extra Mile',
    description: 'Premium sports shoes for peak performance',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1600&h=600&fit=crop',
    link: '/products?category=sports_shoes',
    bgColor: 'from-blue-500 to-purple-500',
  },
  {
    id: 3,
    title: 'Flat 50% Off',
    subtitle: 'Mega Sale',
    description: 'Grab the best deals on top brands',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1600&h=600&fit=crop',
    link: '/products?sort=price_low',
    bgColor: 'from-red-500 to-orange-500',
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full relative">
            <div className={`relative h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-r ${banner.bgColor}`}>
              {/* Background Image */}
              <div className="absolute inset-0 opacity-30">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority={banner.id === 1}
                />
              </div>

              {/* Content */}
              <div className="relative container mx-auto px-4 h-full flex items-center">
                <div className="max-w-xl text-white">
                  <p className="text-sm md:text-base uppercase tracking-widest mb-2 opacity-90">
                    {banner.subtitle}
                  </p>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                    {banner.title}
                  </h2>
                  <p className="text-lg md:text-xl mb-6 opacity-90">
                    {banner.description}
                  </p>
                  <Link
                    href={banner.link}
                    className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'w-8 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
