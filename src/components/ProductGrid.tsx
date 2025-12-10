import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import type { Product, Category } from '../types';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (productId: string) => void;
  onViewDetails: (product: Product) => void;
  initialCategory?: string | null;
}

export function ProductGrid({ products, categories, onAddToCart, onViewDetails, initialCategory }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <section id="products" className="py-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-100 via-white to-blue-100 bg-clip-text text-transparent">
            Наш каталог
          </h2>
          <p className="text-blue-200/80 text-lg">
            Выберите идеальную технику для вашего дома
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12 px-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`backdrop-blur-xl border border-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50'
                : 'bg-white/10 text-blue-100 hover:bg-white/20'
            }`}
          >
            Все категории
          </button>

          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`backdrop-blur-xl border border-white/20 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-blue-200/60 text-lg">
              В этой категории пока нет товаров
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
