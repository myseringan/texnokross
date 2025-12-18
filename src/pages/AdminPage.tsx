import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, LogOut, Package, 
  Upload, DollarSign, FileText, Tag, Check, AlertCircle,
  ChevronDown, Search, Grid, List, Image as ImageIcon, Megaphone, FolderOpen, Truck, Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as api from '../lib/api';
import { BannerManager } from '../components/BannerManager';
import { CategoryManager } from '../components/CategoryManager';
import type { Product, Category } from '../types';

type ViewMode = 'grid' | 'list';

interface ProductForm {
  id?: string;
  name: string;
  name_ru: string;
  description: string;
  description_ru: string;
  price: string;
  images: string[];
  category_id: string;
  in_stock: boolean;
  specifications: Record<string, string>;
  specifications_ru: Record<string, string>;
}

const MAX_IMAGES = 4;

const emptyForm: ProductForm = {
  name: '',
  name_ru: '',
  description: '',
  description_ru: '',
  price: '',
  images: [],
  category_id: '',
  in_stock: true,
  specifications: {},
  specifications_ru: {},
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Kir yuvish mashinalari', name_ru: 'Стиральные машины', slug: 'washing-machines', created_at: new Date().toISOString() },
  { id: 'cat_2', name: 'Muzlatgichlar', name_ru: 'Холодильники', slug: 'refrigerators', created_at: new Date().toISOString() },
  { id: 'cat_3', name: 'Konditsionerlar', name_ru: 'Кондиционеры', slug: 'air-conditioners', created_at: new Date().toISOString() },
  { id: 'cat_4', name: 'Televizorlar', name_ru: 'Телевизоры', slug: 'tvs', created_at: new Date().toISOString() },
  { id: 'cat_5', name: 'Changyutgichlar', name_ru: 'Пылесосы', slug: 'vacuum-cleaners', created_at: new Date().toISOString() },
  { id: 'cat_6', name: 'Mikroto\'lqinli pechlar', name_ru: 'Микроволновые печи', slug: 'microwaves', created_at: new Date().toISOString() },
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
  
  // Характеристики UZ
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  // Характеристики RU
  const [specKeyRu, setSpecKeyRu] = useState('');
  const [specValueRu, setSpecValueRu] = useState('');
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCityManagerOpen, setIsCityManagerOpen] = useState(false);
  const [cities, setCities] = useState<{id: string; name: string; name_ru: string; price: number}[]>([]);
  const [editingCity, setEditingCity] = useState<{id?: string; name: string; name_ru: string; price: string} | null>(null);
  const [savingCity, setSavingCity] = useState(false);
  
  const [isImprosoftOpen, setIsImprosoftOpen] = useState(false);
  const [improsoftProducts, setImprosoftProducts] = useState<api.ImprosoftProduct[]>([]);
  const [improsoftLoading, setImprosoftLoading] = useState(false);
  const [improsoftSearch, setImprosoftSearch] = useState('');
  const [selectedImprosoft, setSelectedImprosoft] = useState<api.ImprosoftProduct | null>(null);
  const [improsoftForm, setImprosoftForm] = useState({
    name_ru: '',
    category_id: '',
    image_url: '',
    description: '',
    description_ru: '',
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

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

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, citiesData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCities(),
      ]);
      
      setProducts(productsData || []);
      setCategories(categoriesData?.length > 0 ? categoriesData : DEFAULT_CATEGORIES);
      setCities(citiesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadImprosoftProducts = async () => {
    setImprosoftLoading(true);
    try {
      const data = await api.getImprosoftProducts();
      setImprosoftProducts(data || []);
    } catch (err) {
      console.error('Error loading IMPROSOFT products:', err);
      showMessage('error', 'Ошибка загрузки');
    } finally {
      setImprosoftLoading(false);
    }
  };

  const createFromImprosoft = async () => {
    if (!selectedImprosoft) return;
    
    setCreatingProduct(true);
    try {
      await api.createProductFromImprosoft({
        barcode: selectedImprosoft.barcode,
        name: selectedImprosoft.name,
        name_ru: improsoftForm.name_ru || selectedImprosoft.name,
        price: selectedImprosoft.price,
        category_id: improsoftForm.category_id,
        image_url: improsoftForm.image_url,
        description: improsoftForm.description,
        description_ru: improsoftForm.description_ru,
      });
      
      showMessage('success', 'Товар добавлен в каталог');
      setSelectedImprosoft(null);
      setImprosoftForm({ name_ru: '', category_id: '', image_url: '', description: '', description_ru: '' });
      loadImprosoftProducts();
      fetchData();
    } catch (err: any) {
      showMessage('error', err.message || 'Ошибка создания');
    } finally {
      setCreatingProduct(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(emptyForm);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    const images = product.images || (product.image_url ? [product.image_url] : []);
    
    setEditingProduct({
      id: product.id,
      name: product.name,
      name_ru: product.name_ru || '',
      description: product.description,
      description_ru: product.description_ru || '',
      price: product.price.toString(),
      images: images,
      category_id: product.category_id || '',
      in_stock: product.in_stock,
      specifications: product.specifications as Record<string, string> || {},
      specifications_ru: product.specifications_ru as Record<string, string> || {},
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(emptyForm);
    setSpecKey('');
    setSpecValue('');
    setSpecKeyRu('');
    setSpecValueRu('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (editingProduct.images.length >= MAX_IMAGES) {
      showMessage('error', `Maksimum ${MAX_IMAGES} ta rasm yuklash mumkin`);
      return;
    }

    const file = files[0];
    
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

  // Добавить характеристику UZ
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

  // Добавить характеристику RU
  const addSpecificationRu = () => {
    if (specKeyRu.trim() && specValueRu.trim()) {
      setEditingProduct({
        ...editingProduct,
        specifications_ru: {
          ...editingProduct.specifications_ru,
          [specKeyRu.trim()]: specValueRu.trim(),
        },
      });
      setSpecKeyRu('');
      setSpecValueRu('');
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...editingProduct.specifications };
    delete newSpecs[key];
    setEditingProduct({ ...editingProduct, specifications: newSpecs });
  };

  const removeSpecificationRu = (key: string) => {
    const newSpecs = { ...editingProduct.specifications_ru };
    delete newSpecs[key];
    setEditingProduct({ ...editingProduct, specifications_ru: newSpecs });
  };

  const handleSave = async () => {
    if (!editingProduct.name || !editingProduct.price || !editingProduct.category_id) {
      showMessage('error', t.admin?.fillRequired || 'Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    setSaving(true);
    try {
      const images = editingProduct.images.length > 0 ? editingProduct.images : [DEFAULT_IMAGE];
      const mainImage = images[0];

      const productData = {
        id: isEditing && editingProduct.id ? editingProduct.id : `prod_${Date.now()}`,
        name: editingProduct.name,
        name_ru: editingProduct.name_ru || editingProduct.name,
        description: editingProduct.description,
        description_ru: editingProduct.description_ru || editingProduct.description,
        price: parseFloat(editingProduct.price),
        image_url: mainImage,
        images: images,
        category_id: editingProduct.category_id,
        in_stock: editingProduct.in_stock,
        specifications: editingProduct.specifications,
        specifications_ru: editingProduct.specifications_ru,
        created_at: new Date().toISOString(),
      };

      if (isEditing && editingProduct.id) {
        await api.updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      } else {
        const newProduct = await api.createProduct(productData);
        setProducts(prev => [newProduct as Product, ...prev]);
      }

      showMessage('success', isEditing ? (t.admin?.productUpdated || 'Mahsulot yangilandi') : (t.admin?.productAdded || 'Mahsulot qo\'shildi'));
      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      showMessage('error', t.admin?.saveError || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t.admin?.deleteConfirm || 'Rostdan ham bu mahsulotni o\'chirmoqchimisiz?')) return;

    try {
      await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      showMessage('success', t.admin?.productDeleted || 'Mahsulot o\'chirildi');
    } catch (err) {
      console.error('Delete error:', err);
      showMessage('error', t.admin?.saveError || 'O\'chirishda xatolik');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || product.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

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

          {/* Category Filter */}
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

          {/* Manager Buttons */}
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="hidden sm:inline">Kategoriya</span>
          </button>

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

          <button
            onClick={() => setIsCityManagerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
            }`}
          >
            <Truck className="w-5 h-5" />
            <span className="hidden sm:inline">Shaharlar</span>
          </button>

          <button
            onClick={() => { setIsImprosoftOpen(true); loadImprosoftProducts(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="hidden sm:inline">IMPROSOFT</span>
          </button>

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
                {/* Image Upload */}
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
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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
                </div>

                {/* Name UZ */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    {t.admin?.productName || "Nomi"} (UZ) *
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

                {/* Name RU */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Название (RU)
                  </label>
                  <div className="relative">
                    <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={editingProduct.name_ru}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name_ru: e.target.value })}
                      placeholder="Название товара на русском"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                </div>

                {/* Description UZ */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Tavsif (UZ)
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Mahsulot haqida"
                      rows={2}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all resize-none ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                </div>

                {/* Description RU */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Описание (RU)
                  </label>
                  <div className="relative">
                    <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <textarea
                      value={editingProduct.description_ru}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description_ru: e.target.value })}
                      placeholder="Описание товара на русском"
                      rows={2}
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

                {/* Specifications UZ */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    📋 Xususiyatlari (UZ)
                  </label>
                  
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

                {/* Specifications RU */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    📋 Характеристики (RU)
                  </label>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={specKeyRu}
                      onChange={(e) => setSpecKeyRu(e.target.value)}
                      placeholder="Название (например: Цвет)"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <input
                      type="text"
                      value={specValueRu}
                      onChange={(e) => setSpecValueRu(e.target.value)}
                      placeholder="Значение (например: Чёрный)"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={addSpecificationRu}
                      className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {Object.entries(editingProduct.specifications_ru).length > 0 && (
                    <div className={`rounded-xl border p-3 space-y-2 ${
                      isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
                    }`}>
                      {Object.entries(editingProduct.specifications_ru).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>
                            {key}: <span className={`font-medium ${isDark ? 'text-white' : 'text-purple-900'}`}>{value}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSpecificationRu(key)}
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

      {/* Banner Manager Modal */}
      <BannerManager
        isOpen={isBannerManagerOpen}
        onClose={() => setIsBannerManagerOpen(false)}
        isDark={isDark}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        isDark={isDark}
        categories={categories}
        onCategoriesChange={setCategories}
      />

      {/* City Manager Modal - Simplified */}
      {isCityManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-slate-900/80' : 'bg-slate-900/50'}`} onClick={() => { setIsCityManagerOpen(false); setEditingCity(null); }} />
          <div className={`relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 border border-white/10' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Shaharlar</h2>
              </div>
              <button onClick={() => { setIsCityManagerOpen(false); setEditingCity(null); }} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {editingCity && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
                  <div className="space-y-3">
                    <input type="text" value={editingCity.name} onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })} placeholder="Shahar nomi (UZ)" className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    <input type="text" value={editingCity.name_ru} onChange={(e) => setEditingCity({ ...editingCity, name_ru: e.target.value })} placeholder="Название (RU)" className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    <input type="number" value={editingCity.price} onChange={(e) => setEditingCity({ ...editingCity, price: e.target.value })} placeholder="Narxi (0 = bepul)" className={`w-full px-3 py-2 rounded-lg border outline-none ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    <div className="flex gap-2">
                      <button onClick={async () => { if (!editingCity.name) return; setSavingCity(true); try { if (editingCity.id) { await api.updateCity(editingCity.id, { name: editingCity.name, name_ru: editingCity.name_ru, price: parseInt(editingCity.price) || 0 }); } else { await api.createCity({ name: editingCity.name, name_ru: editingCity.name_ru, price: parseInt(editingCity.price) || 0 }); } const citiesData = await api.getCities(); setCities(citiesData); setEditingCity(null); showMessage('success', 'Saqlandi'); } catch (err) { showMessage('error', 'Xatolik'); } finally { setSavingCity(false); } }} disabled={savingCity} className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-medium disabled:opacity-50">{savingCity ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                      <button onClick={() => setEditingCity(null)} className={`px-4 py-2 rounded-lg ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'}`}>Bekor</button>
                    </div>
                  </div>
                </div>
              )}
              {cities.map(city => (
                <div key={city.id} className={`p-3 rounded-xl flex items-center justify-between ${isDark ? 'bg-white/10' : 'bg-gray-50'}`}>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{city.name} / {city.name_ru}</p>
                    <p className={`text-sm ${city.price === 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-blue-300' : 'text-blue-600')}`}>{city.price === 0 ? 'Bepul' : `${city.price.toLocaleString()} so'm`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingCity({ id: city.id, name: city.name, name_ru: city.name_ru, price: city.price.toString() })} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/20' : 'hover:bg-gray-200'}`}><Edit2 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} /></button>
                    <button onClick={async () => { if (confirm("O'chirmoqchimisiz?")) { try { await api.deleteCity(city.id); const citiesData = await api.getCities(); setCities(citiesData); showMessage('success', "O'chirildi"); } catch (err) { showMessage('error', 'Xatolik'); } } }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-100'}`}><Trash2 className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-4 border-t flex-shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => setEditingCity({ name: '', name_ru: '', price: '0' })} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 rounded-xl"><Plus className="w-5 h-5" />Shahar qo'shish</button>
            </div>
          </div>
        </div>
      )}

      {/* IMPROSOFT Modal - Simplified */}
      {isImprosoftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-sm ${isDark ? 'bg-slate-900/80' : 'bg-slate-900/50'}`} onClick={() => { setIsImprosoftOpen(false); setSelectedImprosoft(null); }} />
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 border border-white/10' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl"><Database className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>IMPROSOFT</h2>
                  <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{improsoftProducts.filter(p => !p.inCatalog).length} ta yangi</p>
                </div>
              </div>
              <button onClick={() => { setIsImprosoftOpen(false); setSelectedImprosoft(null); }} className={`p-2 rounded-xl ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}><X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex">
              <div className={`w-1/2 flex flex-col border-r ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="p-3">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input type="text" value={improsoftSearch} onChange={(e) => setImprosoftSearch(e.target.value)} placeholder="Qidirish..." className={`w-full pl-9 pr-4 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {improsoftLoading ? <div className="flex justify-center py-10"><div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDark ? 'border-purple-400' : 'border-purple-600'}`}></div></div> : improsoftProducts.filter(p => !p.inCatalog).filter(p => p.name.toLowerCase().includes(improsoftSearch.toLowerCase())).map(product => (
                    <button key={product.id} onClick={() => { setSelectedImprosoft(product); setImprosoftForm({ name_ru: '', category_id: '', image_url: '', description: '', description_ru: '' }); }} className={`w-full p-3 rounded-xl text-left transition-all ${selectedImprosoft?.id === product.id ? (isDark ? 'bg-purple-500/30' : 'bg-purple-100') : (isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100')} border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.barcode}</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>{product.price.toLocaleString()} so'm</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-1/2 p-4 overflow-y-auto">
                {selectedImprosoft ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                      <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedImprosoft.name}</h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Shtrix-kod: {selectedImprosoft.barcode}</p>
                      <p className={`text-lg font-bold mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{selectedImprosoft.price.toLocaleString()} so'm</p>
                    </div>
                    <input type="text" value={improsoftForm.name_ru} onChange={(e) => setImprosoftForm({ ...improsoftForm, name_ru: e.target.value })} placeholder="Nomi (RU)" className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    <select value={improsoftForm.category_id} onChange={(e) => setImprosoftForm({ ...improsoftForm, category_id: e.target.value })} className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                      <option value="">Kategoriya...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <input type="text" value={improsoftForm.image_url} onChange={(e) => setImprosoftForm({ ...improsoftForm, image_url: e.target.value })} placeholder="Rasm URL" className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    <textarea value={improsoftForm.description} onChange={(e) => setImprosoftForm({ ...improsoftForm, description: e.target.value })} rows={2} placeholder="Tavsif (UZ)" className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    <textarea value={improsoftForm.description_ru} onChange={(e) => setImprosoftForm({ ...improsoftForm, description_ru: e.target.value })} rows={2} placeholder="Описание (RU)" className={`w-full px-3 py-2 rounded-lg border outline-none text-sm ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    <button onClick={createFromImprosoft} disabled={creatingProduct} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium py-3 rounded-xl disabled:opacity-50"><Plus className="w-5 h-5" />{creatingProduct ? "Qo'shilmoqda..." : "Katalogga qo'shish"}</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Package className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Chap tarafdan tanlang</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
