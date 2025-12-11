import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';

const LOCAL_PRODUCTS_KEY = 'texnokross_local_products';

const getLocalProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name')
        ]);

        // Загружаем локальные товары
        const localProducts = getLocalProducts();

        // Объединяем: локальные имеют приоритет
        const supabaseProducts = productsResult.data || [];
        const localIds = new Set(localProducts.map(p => p.id));
        const mergedProducts = [
          ...localProducts,
          ...supabaseProducts.filter(p => !localIds.has(p.id))
        ];

        setProducts(mergedProducts as Product[]);
        if (categoriesResult.data) setCategories(categoriesResult.data as Category[]);
      } catch (err) {
        // Если Supabase недоступен, используем только локальные
        setProducts(getLocalProducts());
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      fetchData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { products, categories, loading };
}
