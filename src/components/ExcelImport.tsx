import { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Product, Category } from '../types';

interface ExcelImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: Product[]) => void;
  categories: Category[];
  isDark: boolean;
  existingProducts: Product[];
}

interface ImportRow {
  name: string;
  category: string;
  price: number;
  quantity: number;
  in_stock: boolean;
  description: string;
}

const LOCAL_PRODUCTS_KEY = 'texnokross_local_products';

export function ExcelImport({ isOpen, onClose, onImport, categories, isDark, existingProducts }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  if (!isOpen) return null;

  // Найти категорию по названию
  const findCategory = (categoryName: string): string => {
    const cat = categories.find(c => 
      c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(c.name.toLowerCase())
    );
    return cat?.id || categories[0]?.id || 'cat_1';
  };

  // Обработка файла
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) {
        setError('Fayl bo\'sh yoki noto\'g\'ri format');
        return;
      }

      // Парсим данные
      const rows: ImportRow[] = jsonData.map((row: any) => ({
        name: row['Nomi'] || row['Название'] || row['Name'] || row['name'] || '',
        category: row['Kategoriya'] || row['Категория'] || row['Category'] || row['category'] || '',
        price: parseFloat(row['Narxi'] || row['Цена'] || row['Price'] || row['price'] || 0),
        quantity: parseInt(row['Soni'] || row['Количество'] || row['Quantity'] || row['quantity'] || 0),
        in_stock: (row['Mavjud'] || row['В наличии'] || row['In Stock'] || row['in_stock'] || '').toString().toLowerCase() !== 'yo\'q' && 
                  (row['Mavjud'] || row['В наличии'] || row['In Stock'] || row['in_stock'] || '').toString().toLowerCase() !== 'нет' &&
                  (row['Mavjud'] || row['В наличии'] || row['In Stock'] || row['in_stock'] || '').toString().toLowerCase() !== 'no' &&
                  (row['Mavjud'] || row['В наличии'] || row['In Stock'] || row['in_stock'] || '').toString() !== '0',
        description: row['Tavsif'] || row['Описание'] || row['Description'] || row['description'] || '',
      })).filter(row => row.name && row.price > 0);

      if (rows.length === 0) {
        setError('Hech qanday to\'g\'ri ma\'lumot topilmadi. Ustun nomlarini tekshiring.');
        return;
      }

      setPreview(rows);
    } catch (err) {
      console.error('Excel parsing error:', err);
      setError('Faylni o\'qishda xatolik. Excel formatini tekshiring.');
    }
  };

  // Импорт товаров
  const handleImport = () => {
    if (preview.length === 0) return;

    setImporting(true);

    try {
      const newProducts: Product[] = preview.map((row, index) => {
        // Проверяем есть ли такой товар уже
        const existingProduct = existingProducts.find(p => 
          p.name.toLowerCase() === row.name.toLowerCase()
        );

        if (existingProduct) {
          // Обновляем существующий товар
          return {
            ...existingProduct,
            price: row.price,
            in_stock: row.in_stock,
            description: row.description || existingProduct.description,
            specifications: {
              ...existingProduct.specifications,
              'Soni': row.quantity.toString(),
            },
          };
        } else {
          // Создаём новый товар
          return {
            id: `local_import_${Date.now()}_${index}`,
            name: row.name,
            description: row.description,
            price: row.price,
            image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format',
            images: [],
            category_id: findCategory(row.category),
            in_stock: row.in_stock,
            specifications: {
              'Soni': row.quantity.toString(),
            },
            created_at: new Date().toISOString(),
          };
        }
      });

      // Объединяем с существующими (обновляем или добавляем)
      const updatedProducts = [...existingProducts];
      
      newProducts.forEach(newProd => {
        const existingIndex = updatedProducts.findIndex(p => p.name.toLowerCase() === newProd.name.toLowerCase());
        if (existingIndex >= 0) {
          updatedProducts[existingIndex] = newProd;
        } else {
          updatedProducts.unshift(newProd);
        }
      });

      // Сохраняем в localStorage
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updatedProducts));

      onImport(updatedProducts);
      onClose();
      setPreview([]);
      setFileName('');
    } catch (err) {
      setError('Import qilishda xatolik yuz berdi');
    } finally {
      setImporting(false);
    }
  };

  // Скачать шаблон
  const downloadTemplate = () => {
    const templateData = [
      {
        'Nomi': 'Samsung Galaxy S24',
        'Kategoriya': 'Televizorlar',
        'Narxi': 15000000,
        'Soni': 10,
        'Mavjud': 'Ha',
        'Tavsif': 'Yangi model televizor',
      },
      {
        'Nomi': 'LG Muzlatkich',
        'Kategoriya': 'Muzlatgichlar',
        'Narxi': 8500000,
        'Soni': 5,
        'Mavjud': 'Ha',
        'Tavsif': 'Ikki eshikli muzlatkich',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mahsulotlar');
    XLSX.writeFile(wb, 'texnokross_shablon.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className={`relative w-full max-w-3xl backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden ${
          isDark 
            ? 'bg-slate-900/95 border-white/20' 
            : 'bg-white border-blue-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Excel dan import
                </h2>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-gray-500'}`}>
                  Ombor ma'lumotlarini yuklash
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
          <div className="p-4 sm:p-6 space-y-4">
            {/* Download Template */}
            <button
              onClick={downloadTemplate}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-all ${
                isDark 
                  ? 'border-blue-400/30 hover:border-blue-400/50 text-blue-300 hover:bg-blue-500/10' 
                  : 'border-blue-300 hover:border-blue-400 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Shablon faylni yuklab olish</span>
            </button>

            {/* File Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-green-500 ${
                isDark 
                  ? 'border-white/20 hover:bg-white/5' 
                  : 'border-gray-300 hover:bg-green-50'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
              <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {fileName || 'Excel faylni tanlang'}
              </p>
              <p className={`text-sm ${isDark ? 'text-blue-300/60' : 'text-gray-400'}`}>
                .xlsx, .xls, .csv formatlar qo'llab-quvvatlanadi
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div className={`border rounded-xl overflow-hidden ${
                isDark ? 'border-white/20' : 'border-gray-200'
              }`}>
                <div className={`px-4 py-2 font-medium flex items-center justify-between ${
                  isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <span>Ko'rib chiqish ({preview.length} ta mahsulot)</span>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className={`sticky top-0 ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-3 py-2 text-left ${isDark ? 'text-blue-300' : 'text-gray-600'}`}>Nomi</th>
                        <th className={`px-3 py-2 text-left ${isDark ? 'text-blue-300' : 'text-gray-600'}`}>Kategoriya</th>
                        <th className={`px-3 py-2 text-right ${isDark ? 'text-blue-300' : 'text-gray-600'}`}>Narxi</th>
                        <th className={`px-3 py-2 text-center ${isDark ? 'text-blue-300' : 'text-gray-600'}`}>Soni</th>
                        <th className={`px-3 py-2 text-center ${isDark ? 'text-blue-300' : 'text-gray-600'}`}>Mavjud</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                          <td className={`px-3 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.name}</td>
                          <td className={`px-3 py-2 ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>{row.category || '-'}</td>
                          <td className={`px-3 py-2 text-right ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {row.price.toLocaleString()} сўм
                          </td>
                          <td className={`px-3 py-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.quantity}</td>
                          <td className="px-3 py-2 text-center">
                            {row.in_stock ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Ha</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">Yo'q</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Column Guide */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-blue-50'}`}>
              <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Ustun nomlari:
              </p>
              <div className={`text-sm space-y-1 ${isDark ? 'text-blue-200/70' : 'text-gray-600'}`}>
                <p>• <strong>Nomi</strong> / Название / Name - Mahsulot nomi</p>
                <p>• <strong>Kategoriya</strong> / Категория / Category - Toifa nomi</p>
                <p>• <strong>Narxi</strong> / Цена / Price - Narxi (faqat raqam)</p>
                <p>• <strong>Soni</strong> / Количество / Quantity - Ombordagi soni</p>
                <p>• <strong>Mavjud</strong> / В наличии / In Stock - Ha/Yo'q</p>
                <p>• <strong>Tavsif</strong> / Описание / Description - Qisqacha tavsif</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex gap-3 p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Bekor qilish
            </button>
            <button
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              {importing ? 'Yuklanmoqda...' : `Import qilish (${preview.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
