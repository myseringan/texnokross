import { ShoppingCart, ArrowRight, Globe, Menu, X, Sun, Moon, User, LogOut, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// SVG Logo Component - Большой квадратный логотип
const Logo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 2834.65 2834.65" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M1714.6,822.47h-594.54c-164.3,0-297.74,133.13-297.74,297.74v594.54c0,164.3,133.44,297.43,297.74,297.43h594.54c164.3,0,297.74-133.13,297.74-297.43v-594.54c0-164.61-133.44-297.74-297.74-297.74ZM1417.17,1880.3c-255.65,0-462.67-207.32-462.67-462.97s207.01-462.66,462.67-462.66,462.97,207.01,462.97,462.66-207.33,462.97-462.97,462.97Z"/>
    <path fill="currentColor" d="M1419.06,1126.67c-36.5,0-66.09,29.59-66.09,66.09v207.62c0,36.5,29.59,66.09,66.09,66.09s66.09-29.59,66.09-66.09v-207.62c0-36.5-29.59-66.09-66.09-66.09Z"/>
  </svg>
);

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export function Header({ cartItemCount, onCartClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b shadow-2xl transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-blue-950/90 border-white/10' 
        : 'bg-gradient-to-r from-white/95 via-blue-50/90 to-white/95 border-blue-200/50'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="relative">
              <div className={`absolute inset-0 blur-xl opacity-40 group-hover:opacity-60 transition-opacity ${
                isDark ? 'bg-blue-400' : 'bg-blue-500'
              }`}></div>
              <Logo className={`relative w-9 h-9 sm:w-12 sm:h-12 transform group-hover:scale-110 transition-transform ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h1 className={`text-lg sm:text-3xl font-bold bg-clip-text text-transparent drop-shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-100 via-white to-blue-100' 
                  : 'bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700'
              }`}>
                Texnokross
              </h1>
              <p className={`hidden sm:block text-xs tracking-wider ${
                isDark ? 'text-blue-200/80' : 'text-blue-600/80'
              }`}>{t.header.subtitle}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300 shadow-xl hover:scale-105 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                  : 'bg-blue-100/50 hover:bg-blue-200/50 border-blue-200'
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-300" strokeWidth={2} />
              ) : (
                <Moon className="w-5 h-5 text-blue-700" strokeWidth={2} />
              )}
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`relative backdrop-blur-xl border rounded-2xl px-4 py-3 transition-all duration-300 shadow-xl hover:scale-105 ${
                      isDark 
                        ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border-purple-400/30' 
                        : 'bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 border-purple-300'
                    }`}
                  >
                    <span className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                      {t.header?.adminPanel || "Admin"}
                    </span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className={`relative backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300 shadow-xl hover:scale-105 ${
                    isDark 
                      ? 'bg-white/10 hover:bg-red-500/20 border-white/20' 
                      : 'bg-blue-100/50 hover:bg-red-100 border-blue-200'
                  }`}
                  title={t.header?.logout || "Chiqish"}
                >
                  <LogOut className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`relative backdrop-blur-xl border rounded-2xl p-3 transition-all duration-300 shadow-xl hover:scale-105 ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                    : 'bg-blue-100/50 hover:bg-blue-200/50 border-blue-200'
                }`}
              >
                <User className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
              </Link>
            )}

            {/* Language Switcher */}
            <div className="relative group">
              <div className={`relative backdrop-blur-xl border rounded-2xl px-4 py-3 transition-all duration-300 shadow-xl ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                  : 'bg-blue-100/50 hover:bg-blue-200/50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <Globe className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
                  <button
                    onClick={() => setLanguage('uz')}
                    className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                      language === 'uz'
                        ? isDark ? 'text-blue-300 bg-blue-500/20' : 'text-blue-700 bg-blue-200'
                        : isDark ? 'text-white/70 hover:text-white' : 'text-blue-600/70 hover:text-blue-700'
                    }`}
                  >
                    UZ
                  </button>
                  <span className={isDark ? 'text-white/30' : 'text-blue-300'}>/</span>
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                      language === 'ru'
                        ? isDark ? 'text-blue-300 bg-blue-500/20' : 'text-blue-700 bg-blue-200'
                        : isDark ? 'text-white/70 hover:text-white' : 'text-blue-600/70 hover:text-blue-700'
                    }`}
                  >
                    RU
                  </button>
                </div>
              </div>
            </div>

            {/* Shop Link */}
            <Link to="/categories" className="relative group">
              <div className={`relative backdrop-blur-xl border rounded-2xl px-6 py-3 transition-all duration-300 shadow-xl transform hover:scale-105 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                  : 'bg-blue-100/50 hover:bg-blue-200/50 border-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-blue-700'}`}>{t.header.toShop}</span>
                  <ArrowRight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
                </div>
              </div>
            </Link>

            {/* Cart Button - Hidden on Home Page */}
            {!isHomePage && (
              <button onClick={onCartClick} className="relative group">
                <div className={`relative backdrop-blur-xl border rounded-2xl px-6 py-3 transition-all duration-300 shadow-xl transform hover:scale-105 ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                    : 'bg-blue-100/50 hover:bg-blue-200/50 border-blue-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className={`w-6 h-6 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
                    {cartItemCount > 0 && (
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className={`backdrop-blur-xl border rounded-lg p-2 transition-colors ${
                isDark 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-blue-100/50 border-blue-200'
              }`}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-300" strokeWidth={2} />
              ) : (
                <Moon className="w-5 h-5 text-blue-700" strokeWidth={2} />
              )}
            </button>

            {/* Language Switcher Mobile */}
            <div className={`flex items-center border rounded-lg overflow-hidden ${
              isDark ? 'bg-white/10 border-white/20' : 'bg-blue-100/50 border-blue-200'
            }`}>
              <button
                onClick={() => setLanguage('uz')}
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  language === 'uz'
                    ? isDark ? 'text-blue-300 bg-blue-500/30' : 'text-blue-700 bg-blue-200'
                    : isDark ? 'text-white/70' : 'text-blue-600/70'
                }`}
              >
                UZ
              </button>
              <div className={`w-px h-4 ${isDark ? 'bg-white/20' : 'bg-blue-200'}`}></div>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  language === 'ru'
                    ? isDark ? 'text-blue-300 bg-blue-500/30' : 'text-blue-700 bg-blue-200'
                    : isDark ? 'text-white/70' : 'text-blue-600/70'
                }`}
              >
                RU
              </button>
            </div>

            {/* Cart Button Mobile - Hidden on Home Page */}
            {!isHomePage && (
              <button
                onClick={onCartClick}
                className={`relative backdrop-blur-xl border rounded-lg p-2 ${
                  isDark ? 'bg-white/10 border-white/20' : 'bg-blue-100/50 border-blue-200'
                }`}
              >
                <ShoppingCart className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Menu Button Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`backdrop-blur-xl border rounded-lg p-2 ${
                isDark ? 'bg-white/10 border-white/20' : 'bg-blue-100/50 border-blue-200'
              }`}
            >
              {mobileMenuOpen ? (
                <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
              ) : (
                <Menu className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-700'}`} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-4 border-t mt-2 pt-4 space-y-3 animate-in slide-in-from-top duration-200 ${
            isDark ? 'border-white/10' : 'border-blue-200'
          }`}>
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between w-full backdrop-blur-xl border rounded-xl px-4 py-3 font-medium ${
                isDark 
                  ? 'bg-white/10 border-white/20 text-white active:bg-white/20' 
                  : 'bg-blue-100/50 border-blue-200 text-blue-700 active:bg-blue-200/50'
              }`}
            >
              <span>{t.header.toShop}</span>
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between w-full backdrop-blur-xl border rounded-xl px-4 py-3 font-medium ${
                isDark 
                  ? 'bg-white/10 border-white/20 text-white active:bg-white/20' 
                  : 'bg-blue-100/50 border-blue-200 text-blue-700 active:bg-blue-200/50'
              }`}
            >
              <span>{t.auth?.backToHome || "Bosh sahifa"}</span>
              <Home className="w-5 h-5" strokeWidth={2} />
            </Link>

            {/* Auth in Mobile Menu */}
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between w-full backdrop-blur-xl border rounded-xl px-4 py-3 font-medium ${
                      isDark 
                        ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/30 text-purple-300 active:from-purple-500/30 active:to-blue-500/30' 
                        : 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-300 text-purple-700 active:from-purple-200 active:to-blue-200'
                    }`}
                  >
                    <span>{t.header?.adminPanel || "Admin Panel"}</span>
                    <User className="w-5 h-5" strokeWidth={2} />
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-between w-full backdrop-blur-xl border rounded-xl px-4 py-3 font-medium ${
                    isDark 
                      ? 'bg-red-500/20 border-red-400/30 text-red-300 active:bg-red-500/30' 
                      : 'bg-red-100 border-red-300 text-red-700 active:bg-red-200'
                  }`}
                >
                  <span>{t.header?.logout || "Chiqish"}</span>
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between w-full backdrop-blur-xl border rounded-xl px-4 py-3 font-medium ${
                  isDark 
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-300 active:bg-blue-500/30' 
                    : 'bg-blue-100 border-blue-300 text-blue-700 active:bg-blue-200'
                }`}
              >
                <span>{t.header?.login || "Kirish"}</span>
                <User className="w-5 h-5" strokeWidth={2} />
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
