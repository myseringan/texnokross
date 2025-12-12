import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Instagram, Phone, Send } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
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

  if (productsLoading || cartLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
      }`}>
        <div className={`backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-2xl ${
          isDark 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white/80 border-blue-200'
        }`}>
          <div className={`animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 mx-auto mb-4 ${
            isDark ? 'border-blue-400' : 'border-blue-600'
          }`}></div>
          <p className={`text-base sm:text-lg font-medium text-center ${
            isDark ? 'text-white' : 'text-blue-900'
          }`}>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
    }`}>
      <Header cartItemCount={itemCount} onCartClick={() => setIsCartOpen(true)} />

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
      </Routes>

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

      <footer className={`backdrop-blur-xl border-t py-6 sm:py-8 mt-12 sm:mt-20 transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-r from-blue-950/80 via-blue-900/70 to-blue-950/80 border-white/10' 
          : 'bg-gradient-to-r from-white via-blue-50/70 to-white border-blue-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className={`text-xs sm:text-base ${isDark ? 'text-blue-200/80' : 'text-blue-700'}`}>
              {t.common.copyright}
            </p>
            
            {/* Social Icons & Phone */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/texnokross_uz/"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isDark 
                    ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 hover:from-pink-500/30 hover:to-purple-500/30' 
                    : 'bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-300 hover:from-pink-200 hover:to-purple-200'
                }`}
              >
                <Instagram className={`w-5 h-5 ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/t_Texnokross_navai_uz"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isDark 
                    ? 'bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-400/30 hover:from-sky-500/30 hover:to-blue-500/30' 
                    : 'bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-300 hover:from-sky-200 hover:to-blue-200'
                }`}
              >
                <Send className={`w-5 h-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
              </a>

              {/* Phone with number */}
              <a
                href="tel:+998907174447"
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 hover:from-green-500/30 hover:to-emerald-500/30' 
                    : 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-300 hover:from-green-200 hover:to-emerald-200'
                }`}
              >
                <Phone className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm sm:text-base font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  +998 90 717 44 47
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
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
