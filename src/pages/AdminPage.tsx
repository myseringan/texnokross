import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, LogOut, Package, 
  Upload, DollarSign, FileText, Tag, Check, AlertCircle,
  ChevronDown, Search, Grid, List, Image as ImageIcon, FileSpreadsheet, Megaphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { ExcelImport } from '../components/ExcelImport';
import { BannerManager } from '../components/BannerManager';
import type { Product, Category } from '../types';

type ViewMode = 'grid' | 'list';

interface ProductForm {
  id?: string;
  name: string;
  description: string;
  price: string;
  images: string[]; // Массив фото (до 4 штук)
  category_id: string;
  in_stock: boolean;
  specifications: Record<string, string>;
}

const MAX_IMAGES = 4;

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  images: [],
  category_id: '',
  in_stock: true,
  specifications: {},
};

// Локальное хранилище
const LOCAL_PRODUCTS_KEY = 'texnokross_local_products';
const LOCAL_CATEGORIES_KEY = 'texnokross_local_categories';
const DELETED_PRODUCTS_KEY = 'texnokross_deleted_products';

// Картинка по умолчанию
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format';

// Дефолтные категории
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Kir yuvish mashinalari', slug: 'washing-machines', created_at: new Date().toISOString() },
  { id: 'cat_2', name: 'Muzlatgichlar', slug: 'refrigerators', created_at: new Date().toISOString() },
  { id: 'cat_3', name: 'Konditsionerlar', slug: 'air-conditioners', created_at: new Date().toISOString() },
  { id: 'cat_4', name: 'Televizorlar', slug: 'tvs', created_at: new Date().toISOString() },
  { id: 'cat_5', name: 'Changyutgichlar', slug: 'vacuum-cleaners', created_at: new Date().toISOString() },
  { id: 'cat_6', name: 'Mikroto\'lqinli pechlar', slug: 'microwaves', created_at: new Date().toISOString() },
];

export function AdminPage() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#category-dropdown') && !target.closest('[data-dropdown-trigger="category"]')) {
        document.getElementById('category-dropdown')?.classList.add('hidden');
      }
      if (!target.closest('#modal-category-dropdown') && !target.closest('[data-dropdown-trigger="modal-category"]')) {
        document.getElementById('modal-category-dropdown')?.classList.add('hidden');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Проверяем доступ
  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, navigate]);

  // Загружаем данные
  useEffect(() => {
    fetchData();
  }, []);

  const getLocalProducts = (): Product[] => {
    try {
      const data = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveLocalProducts = (prods: Product[]) => {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(prods));
  };

  const getLocalCategories = (): Category[] => {
    try {
      const data = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  };

  const getDeletedIds = (): string[] => {
    try {
      const data = localStorage.getItem(DELETED_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveDeletedIds = (ids: string[]) => {
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(ids));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Пробуем загрузить категории из Supabase
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
      } else {
        // Используем локальные/дефолтные категории
        setCategories(getLocalCategories());
      }

      // Загружаем товары из Supabase
      const { data: supabaseProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // Загружаем локальные товары
      const localProducts = getLocalProducts();
      
      // Загружаем список удалённых ID
      const deletedIds = new Set(getDeletedIds());

      // Объединяем: локальные имеют приоритет, фильтруем удалённые
      const localIds = new Set(localProducts.map(p => p.id));
      const mergedProducts = [
        ...localProducts.filter(p => !deletedIds.has(p.id)),
        ...(supabaseProducts || []).filter(p => !localIds.has(p.id) && !deletedIds.has(p.id))
      ];

      setProducts(mergedProducts);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Если Supabase недоступен, используем локальные данные
      const deletedIds = new Set(getDeletedIds());
      setProducts(getLocalProducts().filter(p => !deletedIds.has(p.id)));
      setCategories(getLocalCategories());
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const openAddModal = () => {
    setEditingProduct(emptyForm);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    // Получаем массив изображений из product
    const images = product.images || (product.image_url ? [product.image_url] : []);
    
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      images: images,
      category_id: product.category_id || '',
      in_stock: product.in_stock,
      specifications: product.specifications as Record<string, string> || {},
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(emptyForm);
    setSpecKey('');
    setSpecValue('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Проверяем лимит
    if (editingProduct.images.length >= MAX_IMAGES) {
      showMessage('error', `Maksimum ${MAX_IMAGES} ta rasm yuklash mumkin`);
      return;
    }

    const file = files[0];
    
    // Проверяем размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setEditingProduct(prev => ({
        ...prev,
        images: [...prev.images, base64]
      }));
    };
    reader.readAsDataURL(file);
    
    // Сбрасываем input для повторной загрузки того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setEditingProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setEditingProduct({
        ...editingProduct,
        specifications: {
          ...editingProduct.specifications,
          [specKey.trim()]: specValue.trim(),
        },
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...editingProduct.specifications };
    delete newSpecs[key];
    setEditingProduct({ ...editingProduct, specifications: newSpecs });
  };

  const handleSave = async () => {
    if (!editingProduct.name || !editingProduct.price || !editingProduct.category_id) {
      showMessage('error', t.admin?.fillRequired || 'Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    setSaving(true);
    try {
      // Определяем изображения
      const images = editingProduct.images.length > 0 ? editingProduct.images : [DEFAULT_IMAGE];
      const mainImage = images[0];

      const productData: Product = {
        id: isEditing && editingProduct.id ? editingProduct.id : `local_${Date.now()}`,
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.price),
        image_url: mainImage, // Главное фото для обратной совместимости
        images: images, // Массив всех фото
        category_id: editingProduct.category_id,
        in_stock: editingProduct.in_stock,
        specifications: editingProduct.specifications,
        created_at: new Date().toISOString(),
      };

      // Сохраняем локально
      const localProducts = getLocalProducts();
      
      if (isEditing && editingProduct.id) {
        // Обновляем существующий
        const index = localProducts.findIndex(p => p.id === editingProduct.id);
        if (index >= 0) {
          localProducts[index] = { ...localProducts[index], ...productData };
        } else {
          localProducts.unshift(productData);
        }
        
        // Обновляем state сразу
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      } else {
        // Добавляем новый
        localProducts.unshift(productData);
        
        // Обновляем state сразу
        setProducts(prev => [productData, ...prev]);
      }

      saveLocalProducts(localProducts);

      // Пробуем сохранить в Supabase (без ожидания результата)
      try {
        if (!mainImage.startsWith('data:')) {
          // Только если изображение не base64
          if (isEditing && editingProduct.id && !editingProduct.id.startsWith('local_')) {
            await supabase
              .from('products')
              .update({
                name: productData.name,
                description: productData.description,
                price: productData.price,
                image_url: productData.image_url,
                category_id: productData.category_id,
                in_stock: productData.in_stock,
                specifications: productData.specifications,
              })
              .eq('id', editingProduct.id);
          }
        }
      } catch (e) {
        console.log('Supabase sync skipped');
      }

      showMessage('success', isEditing ? (t.admin?.productUpdated || 'Mahsulot yangilandi') : (t.admin?.productAdded || 'Mahsulot qo\'shildi'));
      closeModal();
    } catch (err) {
      showMessage('error', t.admin?.saveError || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t.admin?.deleteConfirm || 'Rostdan ham bu mahsulotni o\'chirmoqchimisiz?')) return;

    try {
      // Добавляем в список удалённых ID
      const deletedIds = getDeletedIds();
      if (!deletedIds.includes(productId)) {
        deletedIds.push(productId);
        saveDeletedIds(deletedIds);
      }

      // Удаляем из локального хранилища (если есть)
      const localProducts = getLocalProducts().filter(p => p.id !== productId);
      saveLocalProducts(localProducts);

      // Сразу обновляем state
      setProducts(prev => prev.filter(p => p.id !== productId));

      // Пробуем удалить из Supabase
      if (!productId.startsWith('local_')) {
        try {
          await supabase.from('products').delete().eq('id', productId);
        } catch (e) {
          console.log('Supabase delete skipped');
        }
      }

      showMessage('success', t.admin?.productDeleted || 'Mahsulot o\'chirildi');
    } catch (err) {
      showMessage('error', t.admin?.saveError || 'O\'chirishda xatolik');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || product.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Получаем название категории
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return t.admin?.noCategory || 'Kategoriyasiz';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || t.admin?.noCategory || 'Noma\'lum';
  };

  if (!isAdmin) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-100 via-white to-blue-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${
        isDark 
          ? 'bg-slate-900/80 border-white/10' 
          : 'bg-white/80 border-blue-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t.admin?.title || "Boshqaruv Paneli"}
                </h1>
                <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-gray-500'}`}>
                  {user?.name}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                isDark 
                  ? 'text-red-400 hover:bg-red-500/20' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">{t.admin?.logout || "Chiqish"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-top ${
          message.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-blue-300' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.admin?.searchProducts || "Qidirish..."}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          {/* Category Filter - Custom Dropdown */}
          <div className="relative">
            <button
              data-dropdown-trigger="category"
              onClick={() => {
                const dropdown = document.getElementById('category-dropdown');
                if (dropdown) dropdown.classList.toggle('hidden');
              }}
              className={`flex items-center justify-between gap-2 pl-4 pr-3 py-2.5 rounded-xl border transition-all duration-200 min-w-[200px] ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <span className="truncate">
                {filterCategory 
                  ? categories.find(c => c.id === filterCategory)?.name || (t.admin?.selectCategory || 'Kategoriya')
                  : (t.admin?.allCategories || 'Barcha kategoriyalar')}
              </span>
              <ChevronDown className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-blue-300' : 'text-gray-400'}`} />
            </button>
            
            {/* Dropdown Menu */}
            <div 
              id="category-dropdown"
              className={`hidden absolute top-full left-0 mt-2 w-full rounded-xl border shadow-xl z-50 overflow-hidden ${
                isDark 
                  ? 'bg-slate-800 border-white/20' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <button
                onClick={() => {
                  setFilterCategory('');
                  document.getElementById('category-dropdown')?.classList.add('hidden');
                }}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  filterCategory === ''
                    ? isDark ? 'bg-blue-500/30 text-white' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Barcha kategoriyalar
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFilterCategory(cat.id);
                    document.getElementById('category-dropdown')?.classList.add('hidden');
                  }}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    filterCategory === cat.id
                      ? isDark ? 'bg-blue-500/30 text-white' : 'bg-blue-100 text-blue-700'
                      : isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : isDark ? 'text-blue-300' : 'text-gray-500'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : isDark ? 'text-blue-300' : 'text-gray-500'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Banner Manager Button */}
          <button
            onClick={() => setIsBannerManagerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30' 
                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300'
            }`}
          >
            <Megaphone className="w-5 h-5" />
            <span className="hidden sm:inline">Banner</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => setIsImportOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Add Button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>{t.common?.add || "Qo'shish"}</span>
          </button>
        </div>

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 ${
              isDark ? 'border-blue-400' : 'border-blue-600'
            }`}></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={`text-center py-20 backdrop-blur-xl border rounded-2xl ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-blue-200'
          }`}>
            <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-blue-300/50' : 'text-gray-300'}`} />
            <p className={`text-lg ${isDark ? 'text-blue-200/60' : 'text-gray-500'}`}>
              {t.admin?.noProductsFound || "Mahsulotlar topilmadi"}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                  isDark 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white border-blue-200'
                }`}
              >
                <div className="relative h-40">
                  <img
                    src={product.images?.[0] || product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${
                    isDark ? 'bg-black/50 text-white' : 'bg-white/90 text-gray-700'
                  }`}>
                    {getCategoryName(product.category_id)}
                  </div>
                  {/* Image count */}
                  {product.images && product.images.length > 1 && (
                    <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      isDark ? 'bg-black/50 text-white' : 'bg-white/90 text-gray-700'
                    }`}>
                      <ImageIcon className="w-3 h-3" />
                      {product.images.length}
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    product.in_stock 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {product.in_stock ? (t.admin?.available || 'Mavjud') : (t.admin?.unavailable || 'Tugagan')}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-bold mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </h3>
                  <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
                    {product.description}
                  </p>
                  <p className={`text-lg font-bold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    {product.price.toLocaleString()} сўм
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-white/10 hover:bg-white/20 text-blue-300' 
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm">{t.common?.edit || "Tahrirlash"}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                          : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={`flex items-center gap-4 backdrop-blur-xl border rounded-xl p-4 transition-all duration-300 ${
                  isDark 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white border-blue-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={product.images?.[0] || product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  {product.images && product.images.length > 1 && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {product.images.length}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-blue-200/70' : 'text-gray-500'}`}>
                    {getCategoryName(product.category_id)}
                  </p>
                  <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    {product.price.toLocaleString()} сўм
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.in_stock 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {product.in_stock ? (t.admin?.available || 'Mavjud') : (t.admin?.unavailable || 'Tugagan')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className={`p-2 rounded-lg transition-all ${
                      isDark 
                        ? 'hover:bg-white/10 text-blue-300' 
                        : 'hover:bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className={`p-2 rounded-lg transition-all ${
                      isDark 
                        ? 'hover:bg-red-500/20 text-red-400' 
                        : 'hover:bg-red-50 text-red-600'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            ></div>

            <div className={`relative w-full max-w-2xl backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden ${
              isDark 
                ? 'bg-slate-900/95 border-white/20' 
                : 'bg-white border-blue-200'
            }`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-white/10' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isEditing ? (t.admin?.editProduct || 'Mahsulotni tahrirlash') : (t.admin?.addProduct || 'Yangi mahsulot qo\'shish')}
                </h2>
                <button
                  onClick={closeModal}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
                {/* Image Upload - Multiple */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    {t.admin?.images || "Rasmlar"} ({editingProduct.images.length}/{MAX_IMAGES})
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Images Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {/* Existing Images */}
                    {editingProduct.images.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={img}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        {index === 0 && (
                          <div className={`absolute top-1 left-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                          }`}>
                            {t.admin?.mainImage || "Asosiy"}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add More Button */}
                    {editingProduct.images.length < MAX_IMAGES && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-square cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all hover:border-blue-500 ${
                          isDark 
                            ? 'border-white/20 hover:bg-white/5' 
                            : 'border-gray-300 hover:bg-blue-50'
                        }`}
                      >
                        <Plus className={`w-8 h-8 mb-1 ${isDark ? 'text-blue-300' : 'text-gray-400'}`} />
                        <p className={`text-xs text-center ${isDark ? 'text-blue-200' : 'text-gray-500'}`}>
                          {t.admin?.addImage || "Rasm qo'shish"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-xs ${isDark ? 'text-blue-300/60' : 'text-gray-400'}`}>
                    {t.admin?.imageHint || `Birinchi rasm asosiy rasm sifatida ko'rsatiladi. Maksimum ${MAX_IMAGES} ta rasm.`}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    {t.admin?.productName || "Nomi"} *
                  </label>
                  <div className="relative">
                    <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder={t.admin?.productName || "Mahsulot nomi"}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Tavsif
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Mahsulot haqida"
                      rows={3}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all resize-none ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                </div>

                {/* Price & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                      Narxi (сўм) *
                    </label>
                    <div className="relative">
                      <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                        isDark ? 'text-blue-300' : 'text-gray-400'
                      }`} />
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        placeholder="0"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                          isDark
                            ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                      Kategoriya *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        data-dropdown-trigger="modal-category"
                        onClick={() => {
                          const dropdown = document.getElementById('modal-category-dropdown');
                          if (dropdown) dropdown.classList.toggle('hidden');
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          isDark
                            ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                            : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      >
                        <span className={editingProduct.category_id ? '' : isDark ? 'text-blue-300/50' : 'text-gray-400'}>
                          {editingProduct.category_id 
                            ? categories.find(c => c.id === editingProduct.category_id)?.name || 'Tanlang'
                            : 'Tanlang'}
                        </span>
                        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-gray-400'}`} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div 
                        id="modal-category-dropdown"
                        className={`hidden absolute top-full left-0 mt-2 w-full rounded-xl border shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto ${
                          isDark 
                            ? 'bg-slate-800 border-white/20' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setEditingProduct({ ...editingProduct, category_id: cat.id });
                              document.getElementById('modal-category-dropdown')?.classList.add('hidden');
                            }}
                            className={`w-full text-left px-4 py-2.5 transition-colors ${
                              editingProduct.category_id === cat.id
                                ? isDark ? 'bg-blue-500/30 text-white' : 'bg-blue-100 text-blue-700'
                                : isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* In Stock */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, in_stock: !editingProduct.in_stock })}
                    className={`w-12 h-7 rounded-full transition-all duration-200 ${
                      editingProduct.in_stock 
                        ? 'bg-green-500' 
                        : isDark ? 'bg-white/20' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                      editingProduct.in_stock ? 'translate-x-6' : 'translate-x-1'
                    }`}></div>
                  </button>
                  <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    {editingProduct.in_stock ? 'Mavjud' : 'Tugagan'}
                  </span>
                </div>

                {/* Specifications */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Xususiyatlari
                  </label>
                  
                  {/* Add Spec */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      placeholder="Nomi (masalan: Rang)"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <input
                      type="text"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      placeholder="Qiymati (masalan: Qora)"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={addSpecification}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Specs List */}
                  {Object.entries(editingProduct.specifications).length > 0 && (
                    <div className={`rounded-xl border p-3 space-y-2 ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}>
                      {Object.entries(editingProduct.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>
                            {key}: <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSpecification(key)}
                            className="p-1 text-red-500 hover:bg-red-500/20 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex gap-3 p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <button
                  onClick={closeModal}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.common?.cancel || "Bekor qilish"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-xl shadow-lg disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? (t.admin?.saving || 'Saqlanmoqda...') : (t.common?.save || 'Saqlash')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(importedProducts) => {
          setProducts(importedProducts);
          showMessage('success', `${importedProducts.length} ta mahsulot import qilindi`);
        }}
        categories={categories}
        isDark={isDark}
        existingProducts={products}
      />

      {/* Banner Manager Modal */}
      <BannerManager
        isOpen={isBannerManagerOpen}
        onClose={() => setIsBannerManagerOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
