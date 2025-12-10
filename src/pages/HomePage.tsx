import { useSearchParams } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ProductGrid } from '../components/ProductGrid';
import type { Product, Category } from '../types';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (productId: string) => void;
  onViewDetails: (product: Product) => void;
}

export function HomePage({ products, categories, onAddToCart, onViewDetails }: HomePageProps) {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  return (
    <div className="pt-20">
      <Hero />
      <ProductGrid
        products={products}
        categories={categories}
        onAddToCart={onAddToCart}
        onViewDetails={onViewDetails}
        initialCategory={categoryParam}
      />
    </div>
  );
}
