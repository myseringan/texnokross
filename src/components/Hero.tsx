import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export function Hero() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  return (
    <div className={`relative min-h-[85vh] sm:min-h-[600px] flex items-center justify-center overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
    }`}>
      <div className="absolute inset-0">
        <div className={`absolute top-5 left-5 sm:top-20 sm:left-20 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl animate-pulse ${
          isDark ? 'bg-blue-500/30' : 'bg-blue-400/20'
        }`}></div>
        <div className={`absolute bottom-5 right-5 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl animate-pulse delay-1000 ${
          isDark ? 'bg-blue-600/20' : 'bg-blue-300/20'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[600px] sm:h-[600px] rounded-full blur-3xl ${
          isDark ? 'bg-blue-400/10' : 'bg-blue-200/30'
        }`}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-24 text-center">
        <div className={`backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-5 sm:p-12 shadow-2xl transition-colors duration-300 ${
          isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white/70 border-blue-200/50'
        }`}>
          <div className={`inline-flex items-center space-x-2 backdrop-blur-xl border rounded-full px-3 sm:px-6 py-1.5 sm:py-2 mb-4 sm:mb-8 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-400/30' 
              : 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300/50'
          }`}>
            <Sparkles className={`w-3 h-3 sm:w-5 sm:h-5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
            <span className={`text-[10px] sm:text-sm font-medium tracking-wide ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{t.hero.premiumQuality}</span>
          </div>

          <h2 className={`text-2xl sm:text-6xl md:text-7xl font-bold mb-3 sm:mb-6 bg-clip-text text-transparent leading-tight ${
            isDark 
              ? 'bg-gradient-to-r from-blue-100 via-white to-blue-100' 
              : 'bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700'
          }`}>
            {t.hero.modernTech}
          </h2>

          <p className={`text-sm sm:text-xl mb-6 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2 ${
            isDark ? 'text-blue-100/90' : 'text-blue-800/80'
          }`}>
            {t.hero.description}
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-6 mb-6 sm:mb-12">
            <div className={`backdrop-blur-xl border rounded-xl sm:rounded-2xl px-3 sm:px-8 py-2.5 sm:py-4 transition-all duration-300 shadow-xl flex-1 min-w-[90px] max-w-[140px] sm:max-w-none sm:flex-none ${
              isDark 
                ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                : 'bg-white/80 border-blue-200 hover:bg-blue-50'
            }`}>
              <TrendingUp className={`w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
              <div className={`text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 ${isDark ? 'text-white' : 'text-blue-900'}`}>5000+</div>
              <div className={`text-[10px] sm:text-sm leading-tight ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>{t.hero.happyClients}</div>
            </div>

            <div className={`backdrop-blur-xl border rounded-xl sm:rounded-2xl px-3 sm:px-8 py-2.5 sm:py-4 transition-all duration-300 shadow-xl flex-1 min-w-[90px] max-w-[140px] sm:max-w-none sm:flex-none ${
              isDark 
                ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                : 'bg-white/80 border-blue-200 hover:bg-blue-50'
            }`}>
              <Award className={`w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
              <div className={`text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 ${isDark ? 'text-white' : 'text-blue-900'}`}>100%</div>
              <div className={`text-[10px] sm:text-sm leading-tight ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>{t.hero.qualityGuarantee}</div>
            </div>

            <div className={`backdrop-blur-xl border rounded-xl sm:rounded-2xl px-3 sm:px-8 py-2.5 sm:py-4 transition-all duration-300 shadow-xl flex-1 min-w-[90px] max-w-[140px] sm:max-w-none sm:flex-none ${
              isDark 
                ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                : 'bg-white/80 border-blue-200 hover:bg-blue-50'
            }`}>
              <Sparkles className={`w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
              <div className={`text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 ${isDark ? 'text-white' : 'text-blue-900'}`}>24/7</div>
              <div className={`text-[10px] sm:text-sm leading-tight ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>{t.hero.support}</div>
            </div>
          </div>

          <Link
            to="/categories"
            className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-semibold px-6 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            {t.hero.viewCatalog}
          </Link>
        </div>
      </div>
    </div>
  );
}
