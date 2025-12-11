import { useState } from 'react';
import { 
  X, Plus, Trash2, Save, FolderOpen, Edit2, Check, AlertCircle
} from 'lucide-react';
import type { Category } from '../types';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const LOCAL_CATEGORIES_KEY = 'texnokross_local_categories';

export function CategoryManager({ isOpen, onClose, isDark, categories, onCategoriesChange }: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    name_ru: '',
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setForm({ name: '', name_ru: '' });
    setEditingCategory(null);
    setIsAdding(false);
    setError(null);
  };

  const handleAdd = () => {
    setForm({ name: '', name_ru: '' });
    setEditingCategory(null);
    setIsAdding(true);
    setError(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsAdding(true);
    setForm({
      name: category.name,
      name_ru: category.name_ru || '',
    });
    setError(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setError('Kategoriya nomini kiriting');
      return;
    }

    // Check for duplicate names
    const isDuplicate = categories.some(c => 
      c.name.toLowerCase() === form.name.trim().toLowerCase() && 
      c.id !== editingCategory?.id
    );

    if (isDuplicate) {
      setError('Bu nomdagi kategoriya mavjud');
      return;
    }

    let updatedCategories: Category[];

    if (editingCategory) {
      // Update existing
      updatedCategories = categories.map(c => 
        c.id === editingCategory.id 
          ? { 
              ...c, 
              name: form.name.trim(), 
              name_ru: form.name_ru.trim() || undefined,
              slug: form.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            }
          : c
      );
    } else {
      // Add new
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name: form.name.trim(),
        name_ru: form.name_ru.trim() || undefined,
        slug: form.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        created_at: new Date().toISOString(),
      };
      updatedCategories = [...categories, newCategory];
    }

    // Save to localStorage
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    onCategoriesChange(updatedCategories);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Kategoriyani o\'chirishni xohlaysizmi?')) return;
    
    const updatedCategories = categories.filter(c => c.id !== id);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updatedCategories));
    onCategoriesChange(updatedCategories);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className={`relative w-full max-w-2xl backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden ${
          isDark 
            ? 'bg-slate-900/95 border-white/20' 
            : 'bg-white border-blue-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Kategoriyalar
                </h2>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-gray-500'}`}>
                  {categories.length} ta kategoriya
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            {/* Add/Edit Form */}
            {isAdding ? (
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
                </h3>

                <div className="space-y-4">
                  {/* Name UZ */}
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>
                      Nomi (UZ) *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Masalan: Televizorlar"
                      className={`w-full px-4 py-2.5 rounded-xl border transition-all ${
                        isDark 
                          ? 'bg-white/10 border-white/20 text-white placeholder-white/30 focus:border-blue-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Name RU */}
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>
                      Название (RU)
                    </label>
                    <input
                      type="text"
                      value={form.name_ru}
                      onChange={(e) => setForm(prev => ({ ...prev, name_ru: e.target.value }))}
                      placeholder="Например: Телевизоры"
                      className={`w-full px-4 py-2.5 rounded-xl border transition-all ${
                        isDark 
                          ? 'bg-white/10 border-white/20 text-white placeholder-white/30 focus:border-blue-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={resetForm}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 rounded-xl"
                  >
                    <Save className="w-4 h-4" />
                    Saqlash
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-all mb-4 ${
                  isDark 
                    ? 'border-purple-400/30 hover:border-purple-400/50 text-purple-300 hover:bg-purple-500/10' 
                    : 'border-purple-300 hover:border-purple-400 text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Yangi kategoriya qo'shish</span>
              </button>
            )}

            {/* Categories List */}
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isDark 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <FolderOpen className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </h4>
                    {category.name_ru && (
                      <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-gray-500'}`}>
                        {category.name_ru}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className={`text-center py-12 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Hozircha kategoriyalar yo'q</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
