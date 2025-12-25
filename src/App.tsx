import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Instagram, Phone, Send } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { VideoIntro } from './components/VideoIntro';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ProfilePage } from './pages/ProfilePage';
import { Cart } from './components/Cart';
import { ProductDetail } from './components/ProductDetail';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import type { Product } from './types';

function AppContent() {
  const { products, categories, loading: productsLoading } = useProducts();
  const {
    cartItems,
    loading: cartLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    total,
    itemCount
  } = useCart();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [introComplete, setIntroComplete] = useState(false);

  // Показываем интро только на главной странице при первом заходе
  const showIntro = !sessionStorage.getItem('hasSeenIntro');

  if (productsLoading || cartLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
      }`}>
        <div className={`backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl ${
          isDark
            ? 'bg-white/10 border-white/20'
            : 'bg-white/80 border-blue-200'
        }`}>
          <div className={`animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 border-t-4 border-b-4 mx-auto mb-3 sm:mb-4 ${
            isDark ? 'border-blue-400' : 'border-blue-600'
          }`}></div>
          <p className={`text-sm sm:text-base lg:text-lg font-medium text-center ${
            isDark ? 'text-white' : 'text-blue-900'
          }`}>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Video Intro - показывается только при первом заходе */}
      {showIntro && !introComplete && (
        <VideoIntro
          onComplete={() => setIntroComplete(true)}
          videoSrc="/intro.mp4"
          maxDuration={20}
        />
      )}

      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
      }`}>
        <Header cartItemCount={itemCount} onCartClick={() => setIsCartOpen(true)} />

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={<HomePage />}
            />
            <Route
              path="/categories"
              element={
                <CategoriesPage
                  categories={categories}
                  products={products}
                  onAddToCart={addToCart}
                  onViewDetails={setSelectedProduct}
                />
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/order" element={<OrderTrackingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          total={total}
        />

        <ProductDetail
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />

        <footer className={`backdrop-blur-xl border-t py-4 sm:py-6 lg:py-8 transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-r from-blue-950/80 via-blue-900/70 to-blue-950/80 border-white/10'
            : 'bg-gradient-to-r from-white via-blue-50/70 to-white border-blue-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Copyright */}
              <p className={`text-xs sm:text-sm lg:text-base text-center sm:text-left ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>
                {t.common.copyright}
              </p>

              {/* Social Icons & Phone */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/texnokross_uz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isDark
                      ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 hover:from-pink-500/30 hover:to-purple-500/30'
                      : 'bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-300 hover:from-pink-200 hover:to-purple-200'
                  }`}
                >
                  <Instagram className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
                </a>

                {/* Telegram */}
                <a
                  href="https://t.me/t_Texnokross_navai_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isDark
                      ? 'bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-400/30 hover:from-sky-500/30 hover:to-blue-500/30'
                      : 'bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-300 hover:from-sky-200 hover:to-blue-200'
                  }`}
                >
                  <Send className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                </a>

                {/* Phone with number */}
                <a
                  href="tel:+998907174447"
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isDark
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 hover:from-green-500/30 hover:to-emerald-500/30'
                      : 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300 hover:from-green-200 hover:to-emerald-200'
                  }`}
                >
                  <Phone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`text-xs sm:text-sm lg:text-base font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    +998 90 717 44 47
                  </span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
