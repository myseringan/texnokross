import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, CheckCircle, ArrowLeft, MapPin, ChevronDown, Phone, User, Lock, CreditCard, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
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

type CartView = 'cart' | 'login' | 'checkout' | 'processing' | 'success' | 'error';

interface City {
  id: string;
  name: string;
  name_ru: string;
  price: number;
}

export function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart, total }: CartProps) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const { user, isAuthenticated, login } = useAuth();
  
  const [view, setView] = useState<CartView>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    comment: '',
  });
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await api.getCities();
        setCities(citiesData);
        if (citiesData.length > 0) setSelectedCity(citiesData[0]);
      } catch (e) {
        console.error('Failed to load cities:', e);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user, isAuthenticated]);
  
  if (!isOpen) return null;

  const deliveryCost = selectedCity?.price || 0;
  const grandTotal = total + deliveryCost;

  const getCityName = (city: City) => language === 'ru' ? city.name_ru : city.name;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setView('login');
      setLoginError('');
    } else {
      setView('checkout');
      setError('');
    }
  };

  const handleLogin = async () => {
    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError(language === 'ru' ? 'Введите телефон и пароль' : 'Telefon va parolni kiriting');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await login(loginPhone, loginPassword);
      if (result.success) {
        setView('checkout');
        setLoginPhone('');
        setLoginPassword('');
      } else {
        setLoginError(result.error || 'Ошибка входа');
      }
    } catch (err) {
      setLoginError(language === 'ru' ? 'Ошибка входа' : 'Kirish xatosi');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBackToCart = () => {
    setView('cart');
    setError('');
    setLoginError('');
    setPaymentUrl('');
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

      const orderResponse = await api.createOrder(
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

      setOrderId(orderResponse.order.id);
      setView('processing');
      
      // Очищаем корзину сразу после создания заказа
      onClearCart();

      // ИСПРАВЛЕНО: Редирект на страницу отслеживания заказа вместо главной
      const returnUrl = `${window.location.origin}/order?order_id=${orderResponse.order.id}&payment_status=paid`;
      const paymentResponse = await api.createPayment(orderResponse.order.id, grandTotal, returnUrl);
      
      if (paymentResponse.payment_url) {
        setPaymentUrl(paymentResponse.payment_url);
        
        // Автоматический редирект через 2 секунды
        setTimeout(() => {
          window.location.href = paymentResponse.payment_url;
        }, 2000);
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.message || (language === 'ru' ? 'Ошибка при создании платежа' : 'Tolov yaratishda xatolik'));
      setView('checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRedirect = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  };

  const handleSuccessClose = () => {
    onClearCart();
    setView('cart');
    if (cities.length > 0) setSelectedCity(cities[0]);
    setFormData({ name: '', phone: '', address: '', comment: '' });
    setPaymentUrl('');
    setOrderId('');
    onClose();
  };

  const handleErrorRetry = () => {
    setView('checkout');
    setError('');
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border transition-all outline-none ${
    isDark 
      ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-blue-400 focus:bg-white/15' 
      : 'bg-white border-blue-200 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:bg-blue-50'
  }`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-slate-900/80' : 'bg-slate-900/50'}`} onClick={onClose}></div>

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[100vw] sm:max-w-md animate-in slide-in-from-right duration-300">
        <div className={`h-full backdrop-blur-2xl border-l shadow-2xl flex flex-col transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-blue-950/98 via-slate-900/98 to-blue-950/98 border-white/10' 
            : 'bg-gradient-to-br from-white via-blue-50 to-white border-blue-300'
        }`}>
          
          {/* PROCESSING VIEW */}
          {view === 'processing' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Loader2 className={`w-16 h-16 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                {language === 'ru' ? 'Переход к оплате...' : 'Tolovga otish...'}
              </h2>
              <p className={`mb-4 ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                {language === 'ru' ? 'Вы будете перенаправлены на страницу оплаты Payme' : 'Siz Payme tolov sahifasiga yonaltirilasiz'}
              </p>
              
              <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-white/10' : 'bg-cyan-50'}`}>
                <img src="https://cdn.payme.uz/logo/payme_color.svg" alt="Payme" className="h-10" />
              </div>
              
              {paymentUrl && (
                <button
                  onClick={handleManualRedirect}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  {language === 'ru' ? 'Перейти к оплате' : 'Tolovga otish'}
                </button>
              )}
              
              <p className={`mt-4 text-sm ${isDark ? 'text-blue-200/50' : 'text-blue-500'}`}>
                {language === 'ru' ? 'Заказ' : 'Buyurtma'}: #{orderId.slice(-6)}
              </p>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {view === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <CheckCircle className={`w-16 h-16 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                {language === 'ru' ? 'Оплата прошла успешно!' : 'Tolov muvaffaqiyatli amalga oshirildi!'}
              </h2>
              <p className={`mb-4 ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                {language === 'ru' ? 'Ваш заказ оформлен. Мы свяжемся с вами в ближайшее время.' : 'Buyurtmangiz qabul qilindi. Tez orada siz bilan boglanamiz.'}
              </p>
              {orderId && (
                <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-white/10' : 'bg-green-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    {language === 'ru' ? 'Номер заказа' : 'Buyurtma raqami'}: <span className="font-bold">#{orderId.slice(-6)}</span>
                  </p>
                </div>
              )}
              <button 
                onClick={handleSuccessClose} 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                {t.order.backToShopping}
              </button>
            </div>
          )}

          {/* ERROR VIEW */}
          {view === 'error' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <AlertCircle className={`w-16 h-16 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                {language === 'ru' ? 'Оплата не прошла' : 'Tolov amalga oshirilmadi'}
              </h2>
              <p className={`mb-6 ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                {language === 'ru' 
                  ? 'Произошла ошибка при оплате. Попробуйте ещё раз или выберите другой способ.' 
                  : 'Tolovda xatolik yuz berdi. Qaytadan urinib koring.'}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleSuccessClose} 
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {language === 'ru' ? 'Закрыть' : 'Yopish'}
                </button>
                <button 
                  onClick={handleErrorRetry} 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  {language === 'ru' ? 'Повторить' : 'Qaytadan'}
                </button>
              </div>
            </div>
          )}

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <>
              <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-blue-200'}`}>
                <div className="flex items-center space-x-3">
                  <button onClick={handleBackToCart} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-100 hover:bg-blue-200'}`}>
                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                  </button>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
                    {language === 'ru' ? 'Вход в аккаунт' : 'Hisobga kirish'}
                  </h2>
                </div>
                <button onClick={onClose} className={`backdrop-blur-xl border p-2 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-blue-100 hover:bg-blue-200 border-blue-300'}`}>
                  <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <User className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                    {language === 'ru' ? 'Войдите или зарегистрируйтесь для оформления заказа' : 'Buyurtma berish uchun kiring'}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    <Phone className="w-4 h-4 inline mr-1" />
                    {language === 'ru' ? 'Номер телефона' : 'Telefon raqam'}
                  </label>
                  <input type="tel" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="+998 90 123 45 67" className={inputClass} />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    <Lock className="w-4 h-4 inline mr-1" />
                    {language === 'ru' ? 'Пароль' : 'Parol'}
                  </label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••" className={inputClass} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                  <p className={`mt-2 text-xs ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                    {language === 'ru' ? 'Если вы новый пользователь, аккаунт создастся автоматически' : 'Yangi foydalanuvchi bolsangiz, hisob avtomatik yaratiladi'}
                  </p>
                </div>

                {loginError && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">{loginError}</div>}
              </div>

              <div className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-white/10' : 'border-blue-200'}`}>
                <button onClick={handleLogin} disabled={loginLoading} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">
                  {loginLoading ? (language === 'ru' ? 'Вход...' : 'Kirish...') : (language === 'ru' ? 'Войти и продолжить' : 'Kirish va davom etish')}
                </button>
              </div>
            </>
          )}

          {/* CHECKOUT VIEW */}
          {view === 'checkout' && (
            <>
              <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-blue-200'}`}>
                <div className="flex items-center space-x-3">
                  <button onClick={handleBackToCart} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-100 hover:bg-blue-200'}`}>
                    <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                  </button>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.order.title}</h2>
                </div>
                <button onClick={onClose} className={`backdrop-blur-xl border p-2 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-blue-100 hover:bg-blue-200 border-blue-300'}`}>
                  <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{t.order.name} *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t.order.namePlaceholder} className={inputClass} />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{t.order.phone} *</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder={t.order.phonePlaceholder} className={inputClass} />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                    <MapPin className="w-4 h-4 inline mr-1" />{t.order.city} *
                  </label>
                  <div className="relative">
                    <button type="button" onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)} className={`w-full px-4 py-3 rounded-xl border text-left transition-all flex items-center justify-between ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/15' : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-50'}`}>
                      <span>
                        {selectedCity ? (
                          <span className="flex items-center gap-2">
                            {getCityName(selectedCity)}
                            <span className={`text-sm ${selectedCity.price === 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-blue-300' : 'text-blue-600')}`}>
                              {selectedCity.price === 0 ? t.order.freeDeliveryLabel : `${selectedCity.price.toLocaleString()} сум`}
                            </span>
                          </span>
                        ) : t.order.selectCity}
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCityDropdownOpen && (
                      <div className={`absolute z-10 w-full mt-2 rounded-xl border shadow-xl overflow-hidden ${isDark ? 'bg-slate-800 border-white/20' : 'bg-white border-blue-200'}`}>
                        {cities.map(city => (
                          <button key={city.id} type="button" onClick={() => { setSelectedCity(city); setIsCityDropdownOpen(false); }}
                            className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all ${selectedCity?.id === city.id ? (isDark ? 'bg-blue-500/30 text-white' : 'bg-blue-100 text-blue-900') : (isDark ? 'text-white hover:bg-white/10' : 'text-blue-900 hover:bg-blue-50')}`}>
                            <span>{getCityName(city)}</span>
                            <span className={`text-sm font-medium ${city.price === 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-blue-300' : 'text-blue-600')}`}>
                              {city.price === 0 ? t.order.freeDeliveryLabel : `${city.price.toLocaleString()} сум`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{t.order.address}</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder={t.order.addressPlaceholder} className={inputClass} />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{t.order.comment}</label>
                  <textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} placeholder={t.order.commentPlaceholder} rows={2} className={inputClass} />
                </div>

                {/* Order Summary */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.cart.cart} ({cartItems.length})</h3>
                  <div className="space-y-2 mb-3">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>{getProductName(item.product, language)} x{item.quantity}</span>
                        <span className={isDark ? 'text-white' : 'text-blue-900'}>{(item.product.price * item.quantity).toLocaleString()} сум</span>
                      </div>
                    ))}
                  </div>
                  <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-white/20' : 'border-blue-200'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>{t.order.subtotal}</span>
                      <span className={isDark ? 'text-white' : 'text-blue-900'}>{total.toLocaleString()} сум</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-blue-200' : 'text-blue-700'}>{t.order.delivery}</span>
                      <span className={deliveryCost === 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-white' : 'text-blue-900')}>
                        {deliveryCost === 0 ? t.order.freeDeliveryLabel : `${deliveryCost.toLocaleString()} сум`}
                      </span>
                    </div>
                    <div className={`pt-2 border-t flex justify-between font-bold ${isDark ? 'border-white/20 text-white' : 'border-blue-200 text-blue-900'}`}>
                      <span>{t.cart.total}</span>
                      <span>{grandTotal.toLocaleString()} сум</span>
                    </div>
                  </div>
                </div>

                {/* Payme Info */}
                <div className={`p-4 rounded-xl flex items-center gap-3 ${isDark ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'}`}>
                  <CreditCard className={`w-6 h-6 flex-shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      {language === 'ru' ? 'Безопасная онлайн-оплата' : 'Xavfsiz onlayn tolov'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-cyan-400/70' : 'text-cyan-600'}`}>
                      Uzcard • HUMO • Visa • MasterCard
                    </p>
                  </div>
                  <img src="https://cdn.payme.uz/logo/payme_color.svg" alt="Payme" className="h-6" />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <div className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-white/10' : 'border-blue-200'}`}>
                <button onClick={handleSubmitOrder} disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {isSubmitting 
                    ? (language === 'ru' ? 'Обработка...' : 'Jarayonda...') 
                    : (language === 'ru' ? `Оплатить ${grandTotal.toLocaleString()} сум` : `${grandTotal.toLocaleString()} som tolash`)}
                </button>
              </div>
            </>
          )}

          {/* CART VIEW */}
          {view === 'cart' && (
            <>
              <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-blue-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-lg">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.cart.cart}</h2>
                    <p className={`text-xs ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>{cartItems.length} {t.cart.items}</p>
                  </div>
                </div>
                <button onClick={onClose} className={`backdrop-blur-xl border p-2 rounded-xl transition-all duration-200 ${isDark ? 'bg-white/10 hover:bg-white/20 active:bg-white/30 border-white/20' : 'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 border-blue-300'}`}>
                  <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className={`backdrop-blur-xl border rounded-full p-6 mb-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-blue-100 border-blue-300'}`}>
                      <ShoppingBag className={`w-12 h-12 ${isDark ? 'text-blue-300/50' : 'text-blue-500'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.cart.emptyCart}</h3>
                    <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>{t.cart.addFromCatalog}</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className={`backdrop-blur-xl border rounded-xl p-3 shadow-lg ${isDark ? 'bg-white/10 border-white/20' : 'bg-white border-blue-200 shadow-blue-100'}`}>
                      <div className="flex gap-3">
                        <img src={item.product.image_url} alt={getProductName(item.product, language)} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shadow-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium mb-1 line-clamp-2 text-sm leading-tight ${isDark ? 'text-white' : 'text-blue-900'}`}>{getProductName(item.product, language)}</h3>
                          <p className={`font-bold text-sm mb-2 ${isDark ? 'text-blue-100' : 'text-blue-700'}`}>{item.product.price.toLocaleString('uz-UZ')} UZS</p>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center border rounded-lg ${isDark ? 'bg-white/10 border-white/20' : 'bg-blue-50 border-blue-300'}`}>
                              <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className={`p-2 rounded-l-lg transition-colors ${isDark ? 'hover:bg-white/20 active:bg-white/30' : 'hover:bg-blue-200 active:bg-blue-300'}`}>
                                <Minus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                              </button>
                              <span className={`font-bold px-4 text-sm min-w-[40px] text-center ${isDark ? 'text-white' : 'text-blue-900'}`}>{item.quantity}</span>
                              <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className={`p-2 rounded-r-lg transition-colors ${isDark ? 'hover:bg-white/20 active:bg-white/30' : 'hover:bg-blue-200 active:bg-blue-300'}`}>
                                <Plus className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-800'}`} />
                              </button>
                            </div>
                            <button onClick={() => onRemoveItem(item.id)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 active:bg-red-500/30' : 'hover:bg-red-100 active:bg-red-200'}`}>
                              <Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className={`border-t p-4 space-y-3 flex-shrink-0 ${isDark ? 'border-white/10 bg-gradient-to-t from-blue-950/50' : 'border-blue-200 bg-gradient-to-t from-blue-100/80'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-base font-medium ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{t.cart.total}</span>
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>{total.toLocaleString('uz-UZ')} UZS</span>
                  </div>
                  <button onClick={handleCheckout} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-2xl transition-all duration-200 text-sm flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t.cart.checkout}
                  </button>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs ${isDark ? 'text-blue-300/60' : 'text-blue-600'}`}>{language === 'ru' ? 'Оплата через' : 'Tolov'}</span>
                    <img src="https://cdn.payme.uz/logo/payme_color.svg" alt="Payme" className="h-4" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
