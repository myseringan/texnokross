import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { BannerSlider } from '../components/BannerSlider';
import type { Category, Product } from '../types';

interface CategoriesPageProps {
  categories: Category[];
  products: Product[];
  onAddToCart: (productId: string) => void;
  onViewDetails: (product: Product) => void;
}

// Хелперы для получения названий на нужном языке
const getCategoryName = (category: Category, language: string) => {
  return language === 'ru' && category.name_ru ? category.name_ru : category.name;
};

const getProductName = (product: Product, language: string) => {
  return language === 'ru' && product.name_ru ? product.name_ru : product.name;
};

const getProductDescription = (product: Product, language: string) => {
  return language === 'ru' && product.description_ru ? product.description_ru : product.description;
};

export function CategoriesPage({ categories, products, onAddToCart, onViewDetails }: CategoriesPageProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Фильтруем товары по выбранной категории
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category_id === selectedCategory.id)
    : [];

  // Если выбрана категория - показываем товары
  if (selectedCategory) {
    return (
      <div className={`min-h-screen pt-16 sm:pt-20 md:pt-24 transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
          : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Back Button & Title */}
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex items-center gap-2 backdrop-blur-xl border font-medium px-4 py-2.5 rounded-xl transition-all duration-200 mb-4 sm:mb-6 text-sm ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20 text-white' 
                  : 'bg-white hover:bg-blue-50 active:bg-blue-100 border-blue-300 text-blue-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t.categoriesPage.backToCategories || "Kategoriyalarga qaytish"}
            </button>
            
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent ${
              isDark 
                ? 'bg-gradient-to-r from-blue-100 via-white to-blue-100' 
                : 'bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700'
            }`}>
              {getCategoryName(selectedCategory, language)}
            </h1>
            <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
              {filteredProducts.length} {t.categoriesPage.productsCount || "ta mahsulot"}
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="group relative">
                  <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                    isDark ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-400/40 to-blue-500/30'
                  }`}></div>

                  <div className={`relative backdrop-blur-xl border rounded-2xl overflow-hidden shadow-xl transition-all duration-500 sm:transform sm:hover:-translate-y-2 ${
                    isDark 
                      ? 'bg-white/10 border-white/20 hover:shadow-blue-500/20' 
                      : 'bg-white border-blue-200 hover:shadow-blue-300/50 shadow-blue-100'
                  }`}>
                    {/* Image */}
                    <div className={`relative h-36 sm:h-44 lg:h-56 overflow-hidden ${
                      isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-white'
                    }`}>
                      <img
                        src={product.images?.[0] || product.image_url}
                        alt={getProductName(product, language)}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {product.in_stock && (
                        <div className="absolute top-2 right-2 backdrop-blur-xl bg-green-500/90 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span className="hidden sm:inline">{t.productCard.inStock}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 lg:p-5">
                      <h3 className={`text-sm sm:text-base lg:text-lg font-bold mb-1 line-clamp-2 transition-colors ${
                        isDark 
                          ? 'text-white group-hover:text-blue-300' 
                          : 'text-blue-900 group-hover:text-blue-600'
                      }`}>
                        {getProductName(product, language)}
                      </h3>

                      <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 ${
                        isDark ? 'text-blue-100/70' : 'text-blue-700'
                      }`}>
                        {getProductDescription(product, language)}
                      </p>

                      {/* Price */}
                      <div className={`text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 ${
                        isDark ? 'text-white' : 'text-blue-900'
                      }`}>
                        {product.price.toLocaleString('ru-RU')} сўм
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewDetails(product)}
                          className={`flex-1 border font-medium py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                            isDark 
                              ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/30 text-white' 
                              : 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-blue-300 text-blue-700'
                          }`}
                        >
                          {t.productCard.details}
                        </button>

                        <button
                          onClick={() => onAddToCart(product.id)}
                          disabled={!product.in_stock}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
                        >
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 sm:py-16 backdrop-blur-xl border rounded-2xl ${
              isDark 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white/80 border-blue-200'
            }`}>
              <p className={`text-base sm:text-lg mb-4 ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                {t.productGrid.noProducts}
              </p>
              <p className={`text-sm ${isDark ? 'text-blue-200/40' : 'text-blue-500'}`}>
                {language === 'ru' 
                  ? `Всего товаров на сайте: ${products.length}` 
                  : `Saytdagi barcha mahsulotlar: ${products.length}`
                }
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`mt-4 px-4 py-2 rounded-lg transition-all ${
                  isDark 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
              >
                {language === 'ru' ? '← Все категории' : '← Barcha kategoriyalar'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Показываем категории
  return (
    <div className={`min-h-screen pt-16 sm:pt-20 md:pt-24 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Banner Slider */}
        <BannerSlider isDark={isDark} />

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 bg-clip-text text-transparent ${
            isDark 
              ? 'bg-gradient-to-r from-blue-100 via-white to-blue-100' 
              : 'bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700'
          }`}>
            {t.categoriesPage.title}
          </h1>
          <p className={`text-sm sm:text-base lg:text-lg px-4 ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>
            {t.categoriesPage.subtitle}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className="group relative text-left"
            >
              <div className={`absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isDark ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-400/40 to-blue-500/30'
              }`}></div>
              
              <div className={`relative backdrop-blur-xl border rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl transition-all duration-500 sm:transform sm:hover:-translate-y-2 ${
                isDark 
                  ? 'bg-white/10 border-white/20 hover:shadow-blue-500/20 active:bg-white/15' 
                  : 'bg-white border-blue-200 hover:shadow-blue-300/50 active:bg-blue-50 shadow-blue-100'
              }`}>
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  
                  {/* Name */}
                  <h2 className={`text-sm sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 transition-colors line-clamp-2 ${
                    isDark 
                      ? 'text-white group-hover:text-blue-300' 
                      : 'text-blue-900 group-hover:text-blue-600'
                  }`}>
                    {getCategoryName(category, language)}
                  </h2>
                  
                  {/* Product count */}
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                    {products.filter(p => p.category_id === category.id).length} {t.categoriesPage.productsCount || "ta mahsulot"}
                  </p>
                  
                  {/* Arrow */}
                  <div className={`mt-2 sm:mt-3 lg:mt-4 inline-flex items-center text-xs sm:text-sm font-medium ${
                    isDark ? 'text-blue-300' : 'text-blue-600'
                  }`}>
                    <span className="hidden sm:inline">{t.categoriesPage.viewProducts}</span>
                    <svg className="w-4 h-4 sm:ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
          <Link
            to="/"
            className={`inline-flex items-center backdrop-blur-xl border font-semibold px-5 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-xl transition-all duration-200 shadow-lg text-sm sm:text-base ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20 text-white' 
                : 'bg-white hover:bg-blue-50 active:bg-blue-100 border-blue-300 text-blue-700'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.categoriesPage.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
