import { ShoppingCart, Zap, ArrowRight, Globe, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export function Header({ cartItemCount, onCartClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-blue-950/90 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity rounded-full"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-2xl transform group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-3xl font-bold bg-gradient-to-r from-blue-100 via-white to-blue-100 bg-clip-text text-transparent drop-shadow-lg">
                Texnokross
              </h1>
              <p className="hidden sm:block text-xs text-blue-200/80 tracking-wider">{t.header.subtitle}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative group">
              <div className="relative backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-3 transition-all duration-300 shadow-xl">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-white" strokeWidth={2} />
                  <button
                    onClick={() => setLanguage('uz')}
                    className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                      language === 'uz'
                        ? 'text-blue-300 bg-blue-500/20'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    UZ
                  </button>
                  <span className="text-white/30">|</span>
                  <button
                    onClick={() => setLanguage('ru')}
                    className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                      language === 'ru'
                        ? 'text-blue-300 bg-blue-500/20'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    RU
                  </button>
                </div>
              </div>
            </div>

            {/* Shop Link */}
            <Link to="/categories" className="relative group">
              <div className="relative backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-6 py-3 transition-all duration-300 shadow-xl transform hover:scale-105">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{t.header.toShop}</span>
                  <ArrowRight className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
              </div>
            </Link>

            {/* Cart Button - Hidden on Home Page */}
            {!isHomePage && (
              <button onClick={onCartClick} className="relative group">
                <div className="relative backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-6 py-3 transition-all duration-300 shadow-xl transform hover:scale-105">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-6 h-6 text-white" strokeWidth={2} />
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
            {/* Language Switcher Mobile */}
            <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
              <button
                onClick={() => setLanguage('uz')}
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  language === 'uz'
                    ? 'text-blue-300 bg-blue-500/30'
                    : 'text-white/70'
                }`}
              >
                UZ
              </button>
              <div className="w-px h-4 bg-white/20"></div>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                  language === 'ru'
                    ? 'text-blue-300 bg-blue-500/30'
                    : 'text-white/70'
                }`}
              >
                RU
              </button>
            </div>

            {/* Cart Button Mobile - Hidden on Home Page */}
            {!isHomePage && (
              <button
                onClick={onCartClick}
                className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-2"
              >
                <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2} />
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
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-2"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" strokeWidth={2} />
              ) : (
                <Menu className="w-5 h-5 text-white" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 mt-2 pt-4 space-y-3 animate-in slide-in-from-top duration-200">
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-medium active:bg-white/20"
            >
              <span>{t.header.toShop}</span>
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-medium active:bg-white/20"
            >
              <span>Bosh sahifa</span>
              <Zap className="w-5 h-5" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
