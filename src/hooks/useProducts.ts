import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';

const LOCAL_PRODUCTS_KEY = 'texnokross_local_products';
const LOCAL_CATEGORIES_KEY = 'texnokross_local_categories';

// Дефолтные категории
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Kir yuvish mashinalari', slug: 'washing-machines', created_at: new Date().toISOString() },
  { id: 'cat_2', name: 'Muzlatgichlar', slug: 'refrigerators', created_at: new Date().toISOString() },
  { id: 'cat_3', name: 'Konditsionerlar', slug: 'air-conditioners', created_at: new Date().toISOString() },
  { id: 'cat_4', name: 'Televizorlar', slug: 'tvs', created_at: new Date().toISOString() },
  { id: 'cat_5', name: 'Changyutgichlar', slug: 'vacuum-cleaners', created_at: new Date().toISOString() },
  { id: 'cat_6', name: 'Mikroto\'lqinli pechlar', slug: 'microwaves', created_at: new Date().toISOString() },
];

const getLocalProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getLocalCategories = (): Category[] => {
  try {
    const data = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name')
        ]);

        // Категории
        if (categoriesResult.data && categoriesResult.data.length > 0) {
          setCategories(categoriesResult.data as Category[]);
        } else {
          setCategories(getLocalCategories());
        }

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
      } catch (err) {
        // Если Supabase недоступен, используем только локальные
        setProducts(getLocalProducts());
        setCategories(getLocalCategories());
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Слушаем изменения в localStorage
    const handleStorageChange = () => {
      const localProducts = getLocalProducts();
      setProducts(prev => {
        const localIds = new Set(localProducts.map(p => p.id));
        const nonLocalProducts = prev.filter(p => !p.id.startsWith('local_') && !localIds.has(p.id));
        return [...localProducts, ...nonLocalProducts];
      });
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Также проверяем каждые 2 секунды локальное хранилище (для синхронизации в том же окне)
    const interval = setInterval(() => {
      const localProducts = getLocalProducts();
      setProducts(prev => {
        const prevIds = new Set(prev.map(p => p.id));
        const localIds = new Set(localProducts.map(p => p.id));
        
        // Если изменилось количество локальных товаров
        const prevLocalCount = prev.filter(p => p.id.startsWith('local_')).length;
        if (prevLocalCount !== localProducts.length) {
          const nonLocalProducts = prev.filter(p => !p.id.startsWith('local_'));
          return [...localProducts, ...nonLocalProducts];
        }
        return prev;
      });
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return { products, categories, loading };
}
