import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { Cart } from './components/Cart';
import { ProductDetail } from './components/ProductDetail';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import type { Product } from './types';

function App() {
  const { products, categories, loading: productsLoading } = useProducts();
  const {
    cartItems,
    loading: cartLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    total,
    itemCount
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (productsLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <Header cartItemCount={itemCount} onCartClick={() => setIsCartOpen(true)} />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={products}
                categories={categories}
                onAddToCart={addToCart}
                onViewDetails={setSelectedProduct}
              />
            }
          />
          <Route
            path="/categories"
            element={<CategoriesPage categories={categories} />}
          />
        </Routes>

        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          total={total}
        />

        <ProductDetail
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />

        <footer className="bg-gradient-to-r from-blue-950/80 via-blue-900/70 to-blue-950/80 backdrop-blur-xl border-t border-white/10 py-8 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-blue-200/80">
              © 2024 Texnokross. Все права защищены.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

