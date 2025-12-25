import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  Home, 
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    city?: string;
    address?: string;
    comment?: string;
    deliveryCost?: number;
  };
  items: OrderItem[];
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

export function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentStatus = searchParams.get('payment_status');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { language } = useLanguage();
  const { isDark } = useTheme();

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
      setError(language === 'ru' ? 'ID заказа не указан' : 'Buyurtma ID ko\'rsatilmagan');
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        setError(language === 'ru' ? 'Заказ не найден' : 'Buyurtma topilmadi');
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка загрузки заказа' : 'Buyurtmani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { 
        key: 'paid', 
        label: language === 'ru' ? 'Оплачено' : 'To\'langan',
        icon: CreditCard,
        time: order?.paid_at
      },
      { 
        key: 'processing', 
        label: language === 'ru' ? 'Обрабатывается' : 'Jarayonda',
        icon: Package,
        time: null
      },
      { 
        key: 'shipped', 
        label: language === 'ru' ? 'Отправлено' : 'Yuborilgan',
        icon: Truck,
        time: order?.shipped_at
      },
      { 
        key: 'delivered', 
        label: language === 'ru' ? 'Доставлено' : 'Yetkazilgan',
        icon: Home,
        time: order?.delivered_at
      },
    ];
    return steps;
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const status = order.status;
    if (status === 'delivered') return 3;
    if (status === 'shipped') return 2;
    if (status === 'processing' || status === 'paid') return 1;
    if (order.payment_status === 'paid') return 0;
    return -1;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('ru-RU', { 
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark 
          ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
      }`}>
        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDark 
          ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
      }`}>
        <div className={`max-w-md w-full p-6 rounded-2xl text-center ${
          isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-blue-200'
        }`}>
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
            {error || (language === 'ru' ? 'Заказ не найден' : 'Buyurtma topilmadi')}
          </h2>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ru' ? 'На главную' : 'Bosh sahifa'}
          </Link>
        </div>
      </div>
    );
  }

  const steps = getStatusSteps();
  const currentStep = getCurrentStepIndex();

  return (
    <div className={`min-h-screen p-4 ${
      isDark 
        ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
    }`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/"
            className={`p-2 rounded-xl transition-all ${
              isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-100 hover:bg-blue-200'
            }`}
          >
            <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-blue-800'}`} />
          </Link>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
            {language === 'ru' ? 'Заказ' : 'Buyurtma'} #{order.id.slice(-6)}
          </h1>
        </div>

        {/* Success Banner */}
        {paymentStatus === 'paid' && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${
            isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200'
          }`}>
            <CheckCircle className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <h3 className={`font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                {language === 'ru' ? 'Оплата прошла успешно!' : 'To\'lov muvaffaqiyatli amalga oshirildi!'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-green-400/70' : 'text-green-600'}`}>
                {language === 'ru' ? 'Мы свяжемся с вами в ближайшее время' : 'Tez orada siz bilan bog\'lanamiz'}
              </p>
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        <div className={`p-6 rounded-2xl mb-6 ${
          isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-blue-200'
        }`}>
          <h2 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-blue-900'}`}>
            {language === 'ru' ? 'Статус заказа' : 'Buyurtma holati'}
          </h2>
          
          <div className="relative">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex items-start gap-4 mb-6 last:mb-0">
                  {/* Icon */}
                  <div className={`relative z-10 p-3 rounded-full ${
                    isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : isDark ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
                    )}
                  </div>
                  
                  {/* Line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute left-[27px] top-[52px] w-0.5 h-12 ${
                      index < currentStep
                        ? 'bg-gradient-to-b from-green-500 to-emerald-500'
                        : isDark ? 'bg-white/10' : 'bg-gray-200'
                    }`} style={{ marginTop: `${index * 72}px` }} />
                  )}
                  
                  {/* Text */}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isCompleted
                        ? isDark ? 'text-white' : 'text-blue-900'
                        : isDark ? 'text-white/50' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                        {formatDate(step.time)}
                      </p>
                    )}
                    {isCurrent && !step.time && (
                      <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        <Clock className="w-4 h-4" />
                        {language === 'ru' ? 'В процессе...' : 'Jarayonda...'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Info */}
        <div className={`p-6 rounded-2xl mb-6 ${
          isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-blue-200'
        }`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-blue-900'}`}>
            {language === 'ru' ? 'Данные получателя' : 'Qabul qiluvchi ma\'lumotlari'}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
                <Phone className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                  {language === 'ru' ? 'Телефон' : 'Telefon'}
                </p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-blue-900'}`}>
                  {order.customer.phone}
                </p>
              </div>
            </div>
            
            {order.customer.city && (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
                  <MapPin className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                    {language === 'ru' ? 'Город' : 'Shahar'}
                  </p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-blue-900'}`}>
                    {order.customer.city}
                    {order.customer.address && `, ${order.customer.address}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className={`p-6 rounded-2xl mb-6 ${
          isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-blue-200'
        }`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-blue-900'}`}>
            {language === 'ru' ? 'Товары' : 'Mahsulotlar'}
          </h2>
          
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-blue-50'
              }`}>
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-blue-900'}`}>
                    {item.name}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-blue-600'}`}>
                    {item.quantity} x {(item.price / item.quantity).toLocaleString()} сум
                  </p>
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
                  {item.price.toLocaleString()} сум
                </p>
              </div>
            ))}
          </div>
          
          {/* Totals */}
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-blue-100'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={isDark ? 'text-blue-200/60' : 'text-blue-600'}>
                {language === 'ru' ? 'Доставка' : 'Yetkazib berish'}
              </span>
              <span className={order.customer.deliveryCost === 0 
                ? (isDark ? 'text-green-400' : 'text-green-600')
                : (isDark ? 'text-white' : 'text-blue-900')
              }>
                {order.customer.deliveryCost === 0 
                  ? (language === 'ru' ? 'Бесплатно' : 'Bepul')
                  : `${order.customer.deliveryCost?.toLocaleString()} сум`
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
                {language === 'ru' ? 'Итого' : 'Jami'}
              </span>
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-blue-900'}`}>
                {order.total.toLocaleString()} сум
              </span>
            </div>
          </div>
        </div>

        {/* Back to Shopping */}
        <Link 
          to="/"
          className="block w-full text-center py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          {language === 'ru' ? 'Продолжить покупки' : 'Xaridni davom ettirish'}
        </Link>
      </div>
    </div>
  );
}
