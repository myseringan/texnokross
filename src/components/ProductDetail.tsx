import { useState } from 'react';
import { X, ShoppingCart, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { Product } from '../types';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string) => void;
}

export function ProductDetail({ product, isOpen, onClose, onAddToCart }: ProductDetailProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  if (!isOpen || !product) return null;

  // Получаем название и описание на нужном языке
  const displayName = language === 'ru' && product.name_ru ? product.name_ru : product.name;
  const displayDescription = language === 'ru' && product.description_ru ? product.description_ru : product.description;
  
  // Получаем характеристики - объединяем оба языка
  const specsRu = product.specifications_ru as Record<string, string> || {};
  const specsUz = product.specifications as Record<string, string> || {};
  
  // Выбираем нужные характеристики по языку
  let specs: Record<string, string> = {};
  if (language === 'ru') {
    // Для русского: если есть specifications_ru - используем, иначе specifications
    specs = Object.keys(specsRu).length > 0 ? specsRu : specsUz;
  } else {
    // Для узбекского: если есть specifications - используем, иначе specifications_ru
    specs = Object.keys(specsUz).length > 0 ? specsUz : specsRu;
  }
  
  // Получаем массив изображений
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image_url];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div className="flex items-start sm:items-center justify-center min-h-screen p-0 sm:p-4">
        <div
          className={`fixed inset-0 backdrop-blur-sm ${isDark ? 'bg-slate-900/90' : 'bg-slate-900/50'}`}
          onClick={onClose}
        ></div>

        <div className={`relative w-full sm:max-w-4xl backdrop-blur-2xl sm:border sm:rounded-3xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 transition-colors ${
          isDark 
            ? 'bg-gradient-to-br from-blue-950/98 via-slate-900/98 to-blue-950/98 border-white/10' 
            : 'bg-gradient-to-br from-white via-blue-50 to-white border-blue-200'
        }`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-3 right-3 sm:top-6 sm:right-6 z-10 backdrop-blur-xl border p-2 rounded-xl transition-all duration-200 ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20' 
                : 'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 border-blue-300'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
          </button>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-8 p-4 sm:p-8">
            {/* Image Gallery */}
            <div className="relative pt-10 sm:pt-0">
              {/* Main Image */}
              <div className="relative h-56 sm:h-96 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className={`absolute inset-0 ${
                  isDark 
                    ? 'bg-gradient-to-t from-slate-900/50 via-transparent to-transparent' 
                    : 'bg-gradient-to-t from-white/20 via-transparent to-transparent'
                }`}></div>

                {product.in_stock && (
                  <div className="absolute top-3 right-3 backdrop-blur-xl bg-green-500/90 border border-green-400/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-xl">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.productDetail.inStock}</span>
                  </div>
                )}

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-xl transition-all ${
                        isDark 
                          ? 'bg-white/20 hover:bg-white/30 text-white' 
                          : 'bg-black/20 hover:bg-black/30 text-white'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-xl transition-all ${
                        isDark 
                          ? 'bg-white/20 hover:bg-white/30 text-white' 
                          : 'bg-black/20 hover:bg-black/30 text-white'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl ${
                    isDark ? 'bg-white/20 text-white' : 'bg-black/30 text-white'
                  }`}>
                    {activeImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === activeImageIndex
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : isDark 
                            ? 'border-white/20 hover:border-white/40' 
                            : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${displayName} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <h2 className={`text-xl sm:text-3xl font-bold mb-2 sm:mb-4 leading-tight pr-8 sm:pr-0 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {displayName}
              </h2>

              <p className={`text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed ${
                isDark ? 'text-blue-100/80' : 'text-gray-700'
              }`}>
                {displayDescription}
              </p>

              {/* Specifications */}
              {specs && Object.keys(specs).length > 0 && (
                <div className={`backdrop-blur-xl border rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl ${
                  isDark 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white border-blue-200'
                }`}>
                  <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t.productDetail.specifications}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className={`flex justify-between border-b pb-2 text-sm ${
                        isDark ? 'border-white/10' : 'border-gray-200'
                      }`}>
                        <span className={isDark ? 'text-blue-200/70' : 'text-gray-600'}>{key}</span>
                        <span className={`font-medium ${isDark ? 'text-blue-100' : 'text-gray-900'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price and Button */}
              <div className="mt-auto">
                <div className="mb-4">
                  <div className={`text-xs mb-1 ${isDark ? 'text-blue-200/60' : 'text-gray-500'}`}>{t.productDetail.price}</div>
                  <div className={`text-3xl sm:text-4xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {product.price.toLocaleString('ru-RU')} сўм
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product.id);
                    onClose();
                  }}
                  disabled={!product.in_stock}
                  className="w-full backdrop-blur-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{product.in_stock ? t.productDetail.addToCart : t.productDetail.outOfStock}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
