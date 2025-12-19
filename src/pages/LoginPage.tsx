import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function LoginPage() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 9) {
      setPhone(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(phone, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setError('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-16 sm:pt-20 md:pt-24 flex items-center justify-center p-4 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
    }`}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className={`mb-4 sm:mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            isDark 
              ? 'text-blue-300 hover:bg-white/10' 
              : 'text-blue-600 hover:bg-blue-100'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.auth?.backToHome || "Bosh sahifaga"}</span>
        </button>

        {/* Card */}
        <div className={`backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl ${
          isDark 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white border-blue-200'
        }`}>
          {/* Logo */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.auth?.userLogin || "Kirish / Ro'yxatdan o'tish"}
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
              {t.auth?.userSubtitle || "Telefon raqamingiz orqali"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                {t.auth?.phone || "Telefon raqam"}
              </label>
              <div className="relative">
                <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 ${
                  isDark ? 'text-blue-300' : 'text-gray-500'
                }`}>
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium">+998</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="90 123 45 67"
                  className={`w-full pl-24 sm:pl-28 pr-4 py-3 sm:py-3.5 rounded-xl border text-sm sm:text-base transition-all duration-200 ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50 focus:border-blue-400 focus:bg-white/15'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                {t.auth?.password || "Parol"}
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  isDark ? 'text-blue-300' : 'text-gray-500'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-xl border text-sm sm:text-base transition-all duration-200 ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50 focus:border-blue-400 focus:bg-white/15'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-blue-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              <p className={`mt-2 text-xs ${isDark ? 'text-blue-200/60' : 'text-gray-500'}`}>
                {t.auth?.passwordHint || "Yangi bo'lsangiz, parol yaratiladi"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-semibold py-3 sm:py-3.5 rounded-xl shadow-xl hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading 
                ? (t.auth?.loading || "Yuklanmoqda...")
                : (t.auth?.continueButton || "Davom etish")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
