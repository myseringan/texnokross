import { ShoppingCart, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();

  // Получаем название и описание на нужном языке
  const displayName = language === 'ru' && product.name_ru ? product.name_ru : product.name;
  const displayDescription = language === 'ru' && product.description_ru ? product.description_ru : product.description;
  const specs = language === 'ru' && product.specifications_ru 
    ? product.specifications_ru as Record<string, string>
    : product.specifications as Record<string, string>;
  const specEntries = Object.entries(specs).slice(0, 3);

  return (
    <div className="group relative">
      <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        isDark ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10' : 'bg-gradient-to-br from-blue-400/40 to-blue-500/30'
      }`}></div>

      <div className={`relative backdrop-blur-xl border rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl transition-all duration-500 sm:transform sm:hover:-translate-y-2 ${
        isDark 
          ? 'bg-white/10 border-white/20 hover:shadow-blue-500/20' 
          : 'bg-white border-blue-200 hover:shadow-blue-300/50 shadow-blue-100'
      }`}>
        {/* Image */}
        <div className={`relative h-48 sm:h-64 overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 to-white'
        }`}>
          <img
            src={product.images?.[0] || product.image_url}
            alt={displayName}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          <div className={`absolute inset-0 ${
            isDark ? 'bg-gradient-to-t from-slate-900/80 via-transparent to-transparent' : 'bg-gradient-to-t from-white/40 via-transparent to-transparent'
          }`}></div>

          {/* Image count indicator */}
          {product.images && product.images.length > 1 && (
            <div className={`absolute top-3 left-3 backdrop-blur-xl px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 ${
              isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-700'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {product.images.length}
            </div>
          )}

          {product.in_stock && (
            <div className="absolute top-3 right-3 backdrop-blur-xl bg-green-500/90 border border-green-400/30 text-white text-[10px] sm:text-xs font-semibold px-2.5 sm:px-4 py-1 sm:py-2 rounded-full flex items-center space-x-1 shadow-xl">
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t.productCard.inStock}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <h3 className={`text-base sm:text-xl font-bold mb-1.5 sm:mb-2 line-clamp-2 transition-colors ${
            isDark 
              ? 'text-white group-hover:text-blue-300' 
              : 'text-blue-900 group-hover:text-blue-600'
          }`}>
            {displayName}
          </h3>

          <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 ${
            isDark ? 'text-blue-100/70' : 'text-blue-700'
          }`}>
            {displayDescription}
          </p>

          {/* Specs - Hidden on very small screens */}
          <div className="hidden xs:block space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            {specEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs sm:text-sm">
                <span className={isDark ? 'text-blue-200/60' : 'text-blue-600'}>{key}:</span>
                <span className={`font-medium ${isDark ? 'text-blue-100' : 'text-blue-800'}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <div className={`text-xl sm:text-3xl font-bold ${
                isDark 
                  ? 'text-white' 
                  : 'text-blue-900'
              }`}>
                {product.price.toLocaleString('ru-RU')} сўм
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => onViewDetails(product)}
              className={`flex-1 backdrop-blur-xl border font-semibold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-base ${
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
              className="backdrop-blur-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
