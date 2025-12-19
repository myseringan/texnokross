import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { t } = useLanguage();
  const { isDark } = useTheme();

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <section id="products" className={`py-6 sm:py-12 lg:py-20 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-16">
          <h2 className={`text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4 bg-clip-text text-transparent ${
            isDark 
              ? 'bg-gradient-to-r from-blue-100 via-white to-blue-100' 
              : 'bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700'
          }`}>
            {t.productGrid.ourCatalog}
          </h2>
          <p className={`text-sm sm:text-base lg:text-lg px-4 ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>
            {t.productGrid.chooseIdealTech}
          </p>
        </div>

        {/* Category Filter - Horizontal scroll on mobile */}
        <div className="mb-4 sm:mb-8 lg:mb-12 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 backdrop-blur-xl border px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 shadow-lg whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50 border-blue-400/30'
                  : isDark 
                    ? 'bg-white/10 text-blue-100 hover:bg-white/20 active:bg-white/30 border-white/20' 
                    : 'bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 border-blue-300'
              }`}
            >
              {t.productGrid.allCategories}
            </button>

            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 backdrop-blur-xl border px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 shadow-lg whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/50 border-blue-400/30'
                    : isDark 
                      ? 'bg-white/10 text-blue-100 hover:bg-white/20 active:bg-white/30 border-white/20' 
                      : 'bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 border-blue-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
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
          <div className="text-center py-10 sm:py-16 lg:py-20">
            <p className={`text-sm sm:text-base lg:text-lg ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
              {t.productGrid.noProducts}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
