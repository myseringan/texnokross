import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Phone, LogOut, Package, ChevronRight, 
  Clock, CheckCircle, Truck, Home, XCircle, CreditCard,
  ArrowLeft, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, Order } from '../lib/api';

export function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark } = useTheme();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const allOrders = await getOrders();
      
      // Убираем все нецифровые символы и берём последние 9 цифр
      const userPhone = user?.phone?.replace(/\D/g, '').slice(-9) || '';
      
      // Фильтруем заказы по телефону пользователя
      const userOrders = allOrders.filter((order: Order) => {
        const orderPhone = order.customer.phone?.replace(/\D/g, '').slice(-9) || '';
        return orderPhone === userPhone;
      });
      
      // Если нет своих заказов - показываем все оплаченные (для отладки)
      if (userOrders.length === 0) {
        const paidOrders = allOrders.filter((o: Order) => 
          o.payment_status === 'paid' || o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped' || o.status === 'processing'
        );
        setOrders(paidOrders);
      } else {
        setOrders(userOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusInfo = (order: Order) => {
    const status = order.status;
    const paymentStatus = order.payment_status;
    
    if (status === 'delivered') {
      return { 
        icon: Home, 
        label: language === 'ru' ? 'Доставлен' : 'Yetkazildi', 
        color: 'text-green-500',
        bg: isDark ? 'bg-green-500/20' : 'bg-green-100'
      };
    }
    if (status === 'shipped') {
      return { 
        icon: Truck, 
        label: language === 'ru' ? 'В пути' : 'Yo\'lda', 
        color: 'text-blue-500',
        bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100'
      };
    }
    if (status === 'processing' || status === 'paid') {
      return { 
        icon: Package, 
        label: language === 'ru' ? 'Обрабатывается' : 'Jarayonda', 
        color: 'text-yellow-500',
        bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'
      };
    }
    if (status === 'cancelled' || paymentStatus === 'cancelled') {
      return { 
        icon: XCircle, 
        label: language === 'ru' ? 'Отменён' : 'Bekor qilindi', 
        color: 'text-red-500',
        bg: isDark ? 'bg-red-500/20' : 'bg-red-100'
      };
    }
    if (paymentStatus === 'paid') {
      return { 
        icon: CheckCircle, 
        label: language === 'ru' ? 'Оплачен' : 'To\'langan', 
        color: 'text-green-500',
        bg: isDark ? 'bg-green-500/20' : 'bg-green-100'
      };
    }
    return { 
      icon: Clock, 
      label: language === 'ru' ? 'Ожидает оплаты' : 'To\'lov kutilmoqda', 
      color: 'text-orange-500',
      bg: isDark ? 'bg-orange-500/20' : 'bg-orange-100'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`min-h-screen pt-16 sm:pt-20 md:pt-24 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <Link
          to="/"
          className={`inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl transition-all ${
            isDark 
              ? 'text-blue-300 hover:bg-white/10' 
              : 'text-blue-600 hover:bg-blue-100'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          {language === 'ru' ? 'На главную' : 'Bosh sahifa'}
        </Link>

        {/* Profile Card */}
        <div className={`backdrop-blur-xl border rounded-2xl p-6 mb-6 ${
          isDark 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <User className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || (language === 'ru' ? 'Пользователь' : 'Foydalanuvchi')}
                </h1>
                <div className={`flex items-center gap-2 mt-1 ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
                  <Phone className="w-4 h-4" />
                  <span>+998 {user?.phone}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isDark 
                  ? 'text-red-400 hover:bg-red-500/20' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'ru' ? 'Выйти' : 'Chiqish'}</span>
            </button>
          </div>
        </div>

        {/* Orders Section */}
        <div className={`backdrop-blur-xl border rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white border-blue-200'
        }`}>
          <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <ShoppingBag className="w-5 h-5" />
              {language === 'ru' ? 'Мои заказы' : 'Mening buyurtmalarim'}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${
                isDark ? 'border-blue-400' : 'border-blue-600'
              }`}></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'ru' ? 'У вас пока нет заказов' : 'Sizda hali buyurtmalar yo\'q'}
              </p>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl"
              >
                {language === 'ru' ? 'Перейти к покупкам' : 'Xarid qilish'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/10">
              {orders.map(order => {
                const statusInfo = getStatusInfo(order);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Link
                    key={order.id}
                    to={`/order?order_id=${order.id}`}
                    className={`block p-4 transition-all ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {/* Order Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            #{order.id.slice(-6)}
                          </span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </div>
                        </div>
                        
                        {/* Order Items Preview */}
                        <div className={`text-sm mb-2 ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
                          {order.items.slice(0, 2).map((item, idx) => (
                            <span key={idx}>
                              {item.name} x{item.quantity}
                              {idx < Math.min(order.items.length, 2) - 1 && ', '}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span> +{order.items.length - 2} {language === 'ru' ? 'ещё' : 'yana'}</span>
                          )}
                        </div>
                        
                        {/* Order Footer */}
                        <div className="flex items-center gap-4">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {order.total.toLocaleString()} сум
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
