import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Save, X, LogOut, Package, 
  Image, DollarSign, FileText, Tag, Check, AlertCircle,
  ChevronDown, Search, Grid, List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';

type ViewMode = 'grid' | 'list';

interface ProductForm {
  id?: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  category_id: string;
  in_stock: boolean;
  specifications: Record<string, string>;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  category_id: '',
  in_stock: true,
  specifications: {},
};

export function AdminPage() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (err) {
      showMessage('error', 'Ma\'lumotlarni yuklashda xatolik');
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
    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
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
      showMessage('error', 'Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.price),
        image_url: editingProduct.image_url || 'https://via.placeholder.com/400x300?text=No+Image',
        category_id: editingProduct.category_id,
        in_stock: editingProduct.in_stock,
        specifications: editingProduct.specifications,
      };

      if (isEditing && editingProduct.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        showMessage('success', 'Mahsulot yangilandi');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        showMessage('success', 'Mahsulot qo\'shildi');
      }

      closeModal();
      fetchData();
    } catch (err) {
      showMessage('error', 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Rostdan ham bu mahsulotni o\'chirmoqchimisiz?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      showMessage('success', 'Mahsulot o\'chirildi');
      fetchData();
    } catch (err) {
      showMessage('error', 'O\'chirishda xatolik');
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
                  Admin Panel
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
              <span className="hidden sm:inline">Chiqish</span>
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
              placeholder="Qidirish..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="">Barcha kategoriyalar</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
              isDark ? 'text-blue-300' : 'text-gray-400'
            }`} />
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

          {/* Add Button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Qo'shish</span>
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
              Mahsulotlar topilmadi
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
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    product.in_stock 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {product.in_stock ? 'Mavjud' : 'Tugagan'}
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
                      <span className="text-sm">Tahrirlash</span>
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
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    {product.price.toLocaleString()} сўм
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.in_stock 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {product.in_stock ? 'Mavjud' : 'Tugagan'}
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
                  {isEditing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
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
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Nomi *
                  </label>
                  <div className="relative">
                    <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Mahsulot nomi"
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
                    <select
                      value={editingProduct.category_id}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    >
                      <option value="">Tanlang</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    Rasm URL
                  </label>
                  <div className="relative">
                    <Image className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? 'text-blue-300' : 'text-gray-400'
                    }`} />
                    <input
                      type="url"
                      value={editingProduct.image_url}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                      placeholder="https://..."
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                        isDark
                          ? 'bg-white/10 border-white/20 text-white placeholder-blue-300/50'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  </div>
                  {editingProduct.image_url && (
                    <img
                      src={editingProduct.image_url}
                      alt="Preview"
                      className="mt-2 h-32 rounded-lg object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
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
                  Bekor qilish
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-xl shadow-lg disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
