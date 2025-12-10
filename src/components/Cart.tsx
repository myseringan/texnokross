import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import type { CartItem, Product } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: (CartItem & { product: Product })[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  total: number;
}

export function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, total }: CartProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md">
        <div className="h-full backdrop-blur-2xl bg-gradient-to-br from-blue-950/95 via-slate-900/95 to-blue-950/95 border-l border-white/10 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Корзина</h2>
                <p className="text-blue-200/70 text-xs sm:text-sm">{cartItems.length} товаров</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 p-2 rounded-xl transition-all duration-300 hover:rotate-90"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full p-6 sm:p-8 mb-4 sm:mb-6">
                  <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-blue-300/50" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Корзина пуста</h3>
                <p className="text-sm sm:text-base text-blue-200/60">Добавьте товары из каталога</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-3 sm:p-4 shadow-xl hover:bg-white/15 transition-all">
                  <div className="flex gap-3 sm:gap-4">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 line-clamp-2 text-xs sm:text-sm">
                        {item.product.name}
                      </h3>
                      <p className="text-blue-100 font-bold mb-2 sm:mb-3 text-sm sm:text-base">
                        {item.product.price.toLocaleString('ru-RU')} сўм
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 sm:space-x-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </button>
                          <span className="text-white font-semibold px-2 sm:px-3 text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 group-hover:text-red-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t border-white/10 p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-blue-200 text-base sm:text-lg">Итого:</span>
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                  {total.toLocaleString('ru-RU')} сўм
                </span>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base">
                Оформить заказ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
