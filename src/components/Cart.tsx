import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, CheckCircle, ArrowLeft, MapPin, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import * as api from '../lib/api';
import type { CartItem, Product } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: (CartItem & { product: Product })[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  total: number;
}

const getProductName = (product: Product, language: string) => {
  return language === 'ru' && product.name_ru ? product.name_ru : product.name;
};

type CartView = 'cart' | 'checkout' | 'success';

interface City {
  id: string;
  name: string;
  name_ru: string;
  price: number;
}

export function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, total }: CartProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  
  const [view, setView] = useState<CartView>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    comment: '',
  });
  const [error, setError] = useState('');

  // Загружаем города
  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await api.getCities();
        setCities(citiesData);
        // По умолчанию выбираем первый город (Навои)
        if (citiesData.length > 0) {
          setSelectedCity(citiesData[0]);
        }
      } catch (e) {
        console.error('Failed to load cities:', e);
      }
    };
    loadCities();
  }, []);
  
  if (!isOpen) return null;

  const deliveryCost = selectedCity?.price || 0;
  const grandTotal = total + deliveryCost;

  const getCityName = (city: City) => {
    return language === 'ru' ? city.name_ru : city.name;
  };

  const handleCheckout = () => {
    setView('checkout');
    setError('');
  };

  const handleBackToCart = () => {
    setView('cart');
    setError('');
  };

  const handleSubmitOrder = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError(t.order.requiredFields);
      return;
    }

    if (!selectedCity) {
      setError(t.order.selectCity);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const orderItems = cartItems.map(item => ({
        id: item.product.id,
        name: getProductName(item.product, language),
        price: item.product.price * item.quantity,
        quantity: item.quantity,
        image_url: item.product.image_url,
      }));

      await api.createOrder(
        {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || undefined,
          comment: formData.comment.trim() || undefined,
          deliveryType: deliveryCost === 0 ? 'free' : 'paid',
          deliveryCost: deliveryCost,
          city: getCityName(selectedCity),
        },
        orderItems,
        grandTotal
      );

      setView('success');
    } catch (err) {
      console.error('Order error:', err);
      setError('Ошибка при оформлении заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    onClearCart();
    setView('cart');
    if (cities.length > 0) {
      setSelectedCity(cities[0]);
    }
    setFormData({ name: '', phone: '', address: '', comment: '' });
    onClose();
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border transition-all outline-none ${
    isDark 
      ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-blue-400 focus:bg-white/15' 
      : 'bg-white border-blue-200 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:bg-blue-50'
  }`;

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
          
          {/* SUCCESS VIEW */}
          {view === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CheckCircle className={`w-16 h-16 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                {t.order.success}
              </h2>
              <p className={`mb-8 ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                {t.order.successMessage}
              </p>
              <button
                onClick={handleSuccessClose}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                {t.order.backToShopping}
              </button>
            </div>
          )}

          {/* CHECKOUT VIEW */}
          {view === 'checkout' && (
            <>
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${
                isDark ? 'border-white/10' : 'border-blue-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBackToCart}
                    className={`p-2 rounded-xl transition-all ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-blue-100 hover:bg-blue-200'
                    }`}
                  >
                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                  </button>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
                    {t.order.title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className={`backdrop-blur-xl border p-2 rounded-xl transition-all ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                      : 'bg-blue-100 hover:bg-blue-200 border-blue-300'
                  }`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    {t.order.name} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.order.namePlaceholder}
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    {t.order.phone} *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t.order.phonePlaceholder}
                    className={inputClass}
                  />
                </div>

                {/* City Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {t.order.city} *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                      className={`w-full px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isDark 
                          ? 'bg-white/10 border-white/20 text-white hover:bg-white/15' 
                          : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-50'
                      }`}
                    >
                      <span>
                        {selectedCity ? (
                          <span className="flex items-center gap-2">
                            {getCityName(selectedCity)}
                            <span className={`text-sm ${
                              selectedCity.price === 0 
                                ? (isDark ? 'text-green-400' : 'text-green-600')
                                : (isDark ? 'text-blue-300' : 'text-blue-600')
                            }`}>
                              {selectedCity.price === 0 ? t.order.freeDeliveryLabel : `${selectedCity.price.toLocaleString()} сум`}
                            </span>
                          </span>
                        ) : t.order.selectCity}
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {isCityDropdownOpen && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl border shadow-xl overflow-hidden ${
                        isDark 
                          ? 'bg-slate-800 border-white/20' 
                          : 'bg-white border-blue-200'
                      }`}>
                        {cities.map(city => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => {
                              setSelectedCity(city);
                              setIsCityDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all ${
                              selectedCity?.id === city.id
                                ? (isDark ? 'bg-blue-500/30 text-white' : 'bg-blue-100 text-blue-900')
                                : (isDark ? 'text-white hover:bg-white/10' : 'text-blue-900 hover:bg-blue-50')
                            }`}
                          >
                            <span>{getCityName(city)}</span>
                            <span className={`text-sm font-medium ${
                              city.price === 0 
                                ? (isDark ? 'text-green-400' : 'text-green-600')
                                : (isDark ? 'text-blue-300' : 'text-blue-600')
                            }`}>
                              {city.price === 0 ? t.order.freeDeliveryLabel : `${city.price.toLocaleString()} сум`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    {t.order.address}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t.order.addressPlaceholder}
                    className={inputClass}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    {t.order.comment}
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder={t.order.commentPlaceholder}
                    rows={2}
                    className={inputClass}
                  />
                </div>

                {/* Order Summary */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                    {t.cart.cart} ({cartItems.length})
                  </h3>
                  <div className="space-y-2 mb-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>
                          {getProductName(item.product, language)} x{item.quantity}
                        </span>
                        <span className={isDark ? 'text-white' : 'text-blue-900'}>
                          {(item.product.price * item.quantity).toLocaleString()} сум
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-white/20' : 'border-blue-200'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>{t.order.subtotal}</span>
                      <span className={isDark ? 'text-white' : 'text-blue-900'}>{total.toLocaleString()} сум</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>
                        {t.order.delivery} ({selectedCity ? getCityName(selectedCity) : ''})
                      </span>
                      <span className={deliveryCost === 0 
                        ? (isDark ? 'text-green-400' : 'text-green-600') 
                        : (isDark ? 'text-white' : 'text-blue-900')
                      }>
                        {deliveryCost === 0 ? t.order.freeDeliveryLabel : `${deliveryCost.toLocaleString()} сум`}
                      </span>
                    </div>
                    <div className={`pt-2 border-t flex justify-between font-bold ${
                      isDark ? 'border-white/20 text-white' : 'border-blue-200 text-blue-900'
                    }`}>
                      <span>{t.cart.total}</span>
                      <span>{grandTotal.toLocaleString()} сум</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-white/10' : 'border-blue-200'}`}>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                >
                  {isSubmitting ? t.order.submitting : t.order.submit}
                </button>
              </div>
            </>
          )}

          {/* CART VIEW */}
          {view === 'cart' && (
            <>
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
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
                      {total.toLocaleString('uz-UZ')} UZS
                    </span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-bold py-3.5 rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 text-sm"
                  >
                    {t.cart.checkout}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
