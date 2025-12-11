import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import type { CartItem, Product } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: (CartItem & { product: Product })[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  total: number;
}

// Хелпер для получения названия на нужном языке
const getProductName = (product: Product, language: string) => {
  return language === 'ru' && product.name_ru ? product.name_ru : product.name;
};

export function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, total }: CartProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-slate-900/80' : 'bg-slate-900/50'}`}
        onClick={onClose}
      ></div>

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[100vw] sm:max-w-md animate-in slide-in-from-right duration-300">
        <div className={`h-full backdrop-blur-2xl border-l shadow-2xl flex flex-col transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-blue-950/98 via-slate-900/98 to-blue-950/98 border-white/10' 
            : 'bg-gradient-to-br from-white via-blue-50 to-white border-blue-300'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${
            isDark ? 'border-white/10' : 'border-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.cart.cart}</h2>
                <p className={`text-xs ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>{cartItems.length} {t.cart.items}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`backdrop-blur-xl border p-2 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20' 
                  : 'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 border-blue-300'
              }`}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className={`backdrop-blur-xl border rounded-full p-6 mb-4 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-blue-100 border-blue-300'
                }`}>
                  <ShoppingBag className={`w-12 h-12 ${isDark ? 'text-blue-300/50' : 'text-blue-500'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.cart.emptyCart}</h3>
                <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>{t.cart.addFromCatalog}</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div 
                  key={item.id} 
                  className={`backdrop-blur-xl border rounded-xl p-3 shadow-lg ${
                    isDark 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-white border-blue-200 shadow-blue-100'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={item.product.image_url}
                      alt={getProductName(item.product, language)}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shadow-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium mb-1 line-clamp-2 text-sm leading-tight ${
                        isDark ? 'text-white' : 'text-blue-900'
                      }`}>
                        {getProductName(item.product, language)}
                      </h3>
                      <p className={`font-bold text-sm mb-2 ${isDark ? 'text-blue-100' : 'text-blue-700'}`}>
                        {item.product.price.toLocaleString('uz-UZ')} UZS
                      </p>

                      <div className="flex items-center justify-between">
                        <div className={`flex items-center border rounded-lg ${
                          isDark 
                            ? 'bg-white/10 border-white/20' 
                            : 'bg-blue-50 border-blue-300'
                        }`}>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className={`p-2 rounded-l-lg transition-colors ${
                              isDark 
                                ? 'hover:bg-white/20 active:bg-white/30' 
                                : 'hover:bg-blue-200 active:bg-blue-300'
                            }`}
                          >
                            <Minus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                          </button>
                          <span className={`font-bold px-4 text-sm min-w-[40px] text-center ${
                            isDark ? 'text-white' : 'text-blue-900'
                          }`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className={`p-2 rounded-r-lg transition-colors ${
                              isDark 
                                ? 'hover:bg-white/20 active:bg-white/30' 
                                : 'hover:bg-blue-200 active:bg-blue-300'
                            }`}
                          >
                            <Plus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark 
                              ? 'hover:bg-red-500/20 active:bg-red-500/30' 
                              : 'hover:bg-red-100 active:bg-red-200'
                          }`}
                        >
                          <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className={`border-t p-4 space-y-4 flex-shrink-0 ${
              isDark 
                ? 'border-white/10 bg-gradient-to-t from-blue-950/50' 
                : 'border-blue-200 bg-gradient-to-t from-blue-100/80'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`text-base font-medium ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{t.cart.total}</span>
                <span className={`text-2xl font-bold ${
                  isDark 
                    ? 'text-white' 
                    : 'text-blue-900'
                }`}>
                  {total.toLocaleString('uz-UZ')} UZS
                </span>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-bold py-3.5 rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 text-sm">
                {t.cart.checkout}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
