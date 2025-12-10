import { ShoppingCart, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const specs = product.specifications as Record<string, string>;
  const specEntries = Object.entries(specs).slice(0, 3);
  const { t } = useLanguage();

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:-translate-y-2">
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

          {product.in_stock && (
            <div className="absolute top-4 right-4 backdrop-blur-xl bg-green-500/90 border border-green-400/30 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center space-x-1 shadow-xl">
              <Check className="w-4 h-4" />
              <span>{t.productCard.inStock}</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
            {product.name}
          </h3>

          <p className="text-blue-100/70 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>

          <div className="space-y-2 mb-4">
            {specEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-blue-200/60">{key}:</span>
                <span className="text-blue-100 font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                {product.price.toLocaleString('ru-RU')} сўм
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onViewDetails(product)}
              className="flex-1 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {t.productCard.details}
            </button>

            <button
              onClick={() => onAddToCart(product.id)}
              disabled={!product.in_stock}
              className="backdrop-blur-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
