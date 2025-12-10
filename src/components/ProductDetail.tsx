import { X, ShoppingCart, Check } from 'lucide-react';
import type { Product } from '../types';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: string) => void;
}

export function ProductDetail({ product, isOpen, onClose, onAddToCart }: ProductDetailProps) {
  if (!isOpen || !product) return null;

  const specs = product.specifications as Record<string, string>;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="relative w-full max-w-4xl backdrop-blur-2xl bg-gradient-to-br from-blue-950/95 via-slate-900/95 to-blue-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 p-2 sm:p-3 rounded-xl transition-all duration-300 hover:rotate-90"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 p-6 sm:p-8">
            <div className="relative">
              <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>

                {product.in_stock && (
                  <div className="absolute top-4 right-4 backdrop-blur-xl bg-green-500/90 border border-green-400/30 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full flex items-center space-x-1 sm:space-x-2 shadow-xl">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>В наличии</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                {product.name}
              </h2>

              <p className="text-blue-100/80 text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Характеристики</h3>
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b border-white/10 pb-2 text-sm sm:text-base">
                      <span className="text-blue-200/70">{key}</span>
                      <span className="text-blue-100 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <div className="mb-4 sm:mb-6">
                  <div className="text-xs sm:text-sm text-blue-200/60 mb-2">Цена</div>
                  <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                    {product.price.toLocaleString('ru-RU')} сўм
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product.id);
                    onClose();
                  }}
                  disabled={!product.in_stock}
                  className="w-full backdrop-blur-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 sm:py-4 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>{product.in_stock ? 'Добавить в корзину' : 'Нет в наличии'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
