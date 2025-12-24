const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Папка для данных
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Файлы данных
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const BANNERS_FILE = path.join(DATA_DIR, 'banners.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const CITIES_FILE = path.join(DATA_DIR, 'cities.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Telegram настройки
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// ==================== PAYME CONFIGURATION ====================
// ВАЖНО: Замените на свои данные из личного кабинета Payme Business
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || ''; // ID мерчанта
const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY || ''; // Секретный ключ
const PAYME_SECRET_KEY_TEST = process.env.PAYME_SECRET_KEY_TEST || ''; // Ключ для тестов
const PAYME_TEST_MODE = process.env.PAYME_TEST_MODE === 'true'; // Тестовый режим

// URL для чекаута
const PAYME_CHECKOUT_URL = PAYME_TEST_MODE 
  ? 'https://test.paycom.uz' 
  : 'https://checkout.paycom.uz';

// Таймаут для заказа (12 часов в миллисекундах)
const ORDER_TIMEOUT = 12 * 60 * 60 * 1000;

// Дефолтные настройки
const DEFAULT_SETTINGS = {
  deliveryPrice: 30000,
  freeDeliveryRadius: 5,
  freeDeliveryCity: 'Navoiy',
};

// Дефолтные города
const DEFAULT_CITIES = [
  { id: 'city_1', name: 'Navoiy', name_ru: 'Навои', price: 0 },
  { id: 'city_2', name: 'Buxoro', name_ru: 'Бухара', price: 50000 },
  { id: 'city_3', name: 'Samarqand', name_ru: 'Самарканд', price: 80000 },
  { id: 'city_4', name: 'Toshkent', name_ru: 'Ташкент', price: 100000 },
  { id: 'city_5', name: 'Qoraqalpog\'iston', name_ru: 'Каракалпакстан', price: 120000 },
];

// Дефолтные категории
const DEFAULT_CATEGORIES = [
  { id: 'cat_1', name: 'Kir yuvish mashinalari', name_ru: 'Стиральные машины', slug: 'washing-machines', created_at: new Date().toISOString() },
  { id: 'cat_2', name: 'Muzlatgichlar', name_ru: 'Холодильники', slug: 'refrigerators', created_at: new Date().toISOString() },
  { id: 'cat_3', name: 'Konditsionerlar', name_ru: 'Кондиционеры', slug: 'air-conditioners', created_at: new Date().toISOString() },
  { id: 'cat_4', name: 'Televizorlar', name_ru: 'Телевизоры', slug: 'tvs', created_at: new Date().toISOString() },
  { id: 'cat_5', name: 'Changyutgichlar', name_ru: 'Пылесосы', slug: 'vacuum-cleaners', created_at: new Date().toISOString() },
  { id: 'cat_6', name: "Mikroto'lqinli pechlar", name_ru: 'Микроволновые печи', slug: 'microwaves', created_at: new Date().toISOString() },
];

// Дефолтные баннеры
const DEFAULT_BANNERS = [
  {
    id: 'banner_1',
    title: 'Chegirmalar 20% gacha!',
    subtitle: 'Barcha maishiy texnikaga maxsus narxlar',
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop&auto=format',
    type: 'sale',
    active: true,
    created_at: new Date().toISOString(),
  },
];

// ==================== HELPERS ====================

function readJSON(file, defaultData = []) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
    writeJSON(file, defaultData);
    return defaultData;
  } catch (err) {
    console.error('Read error:', err);
    return defaultData;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Write error:', err);
    return false;
  }
}

// Функция отправки в Telegram
async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured, skipping notification');
    return false;
  }
  
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    return response.ok;
  } catch (err) {
    console.error('Telegram error:', err);
    return false;
  }
}

// ==================== PRODUCTS ====================

app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const newProduct = {
    ...req.body,
    id: req.body.id || `prod_${Date.now()}`,
    created_at: req.body.created_at || new Date().toISOString(),
  };
  products.unshift(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body };
    writeJSON(PRODUCTS_FILE, products);
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE, []);
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);
  if (products.length < initialLength) {
    writeJSON(PRODUCTS_FILE, products);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// ==================== CATEGORIES ====================

app.get('/api/categories', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  const newCategory = {
    ...req.body,
    id: req.body.id || `cat_${Date.now()}`,
    created_at: req.body.created_at || new Date().toISOString(),
  };
  categories.push(newCategory);
  writeJSON(CATEGORIES_FILE, categories);
  res.json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...req.body };
    writeJSON(CATEGORIES_FILE, categories);
    res.json(categories[index]);
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  let categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  const initialLength = categories.length;
  categories = categories.filter(c => c.id !== req.params.id);
  if (categories.length < initialLength) {
    writeJSON(CATEGORIES_FILE, categories);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

// ==================== BANNERS ====================

app.get('/api/banners', (req, res) => {
  const banners = readJSON(BANNERS_FILE, DEFAULT_BANNERS);
  res.json(banners);
});

app.post('/api/banners', (req, res) => {
  const banners = readJSON(BANNERS_FILE, DEFAULT_BANNERS);
  const newBanner = {
    ...req.body,
    id: req.body.id || `banner_${Date.now()}`,
    created_at: req.body.created_at || new Date().toISOString(),
  };
  banners.push(newBanner);
  writeJSON(BANNERS_FILE, banners);
  res.json(newBanner);
});

app.put('/api/banners/:id', (req, res) => {
  const banners = readJSON(BANNERS_FILE, DEFAULT_BANNERS);
  const index = banners.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    banners[index] = { ...banners[index], ...req.body };
    writeJSON(BANNERS_FILE, banners);
    res.json(banners[index]);
  } else {
    res.status(404).json({ error: 'Banner not found' });
  }
});

app.delete('/api/banners/:id', (req, res) => {
  let banners = readJSON(BANNERS_FILE, DEFAULT_BANNERS);
  const initialLength = banners.length;
  banners = banners.filter(b => b.id !== req.params.id);
  if (banners.length < initialLength) {
    writeJSON(BANNERS_FILE, banners);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Banner not found' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==================== ORDERS ====================

app.get('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const { customer, items, total } = req.body;
  
  const newOrder = {
    id: `order_${Date.now()}`,
    customer,
    items,
    total,
    status: 'pending', // pending, paid, cancelled, delivered
    payment_status: 'pending', // pending, processing, paid, failed, cancelled
    created_at: new Date().toISOString(),
    expire_at: new Date(Date.now() + ORDER_TIMEOUT).toISOString(),
  };
  
  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);
  
  // Формируем сообщение для Telegram
  let itemsList = items.map(item => 
    `  • ${item.name} x${item.quantity} = ${item.price.toLocaleString()} сум`
  ).join('\n');

  const deliveryInfo = customer.deliveryCost === 0 
    ? `🚚 <b>Доставка:</b> Бесплатная`
    : `🚚 <b>Доставка:</b> ${customer.deliveryCost?.toLocaleString() || 0} сум`;
  
  const telegramMessage = `
🛒 <b>Новый заказ #${newOrder.id.slice(-6)}</b>

👤 <b>Клиент:</b> ${customer.name}
📞 <b>Телефон:</b> ${customer.phone}
🏙 <b>Город:</b> ${customer.city || 'Не указан'}
${customer.address ? `📍 <b>Адрес:</b> ${customer.address}` : ''}
${deliveryInfo}
${customer.comment ? `💬 <b>Комментарий:</b> ${customer.comment}` : ''}

📦 <b>Товары:</b>
${itemsList}

💰 <b>Итого:</b> ${total.toLocaleString()} сум
💳 <b>Статус:</b> Ожидает оплаты

🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}
  `.trim();
  
  await sendToTelegram(telegramMessage);
  
  res.json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...req.body };
    writeJSON(ORDERS_FILE, orders);
    res.json(orders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// ==================== SETTINGS ====================

app.get('/api/settings', (req, res) => {
  const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const currentSettings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
  const newSettings = { ...currentSettings, ...req.body };
  writeJSON(SETTINGS_FILE, newSettings);
  res.json(newSettings);
});

// ==================== CITIES ====================

app.get('/api/cities', (req, res) => {
  const cities = readJSON(CITIES_FILE, DEFAULT_CITIES);
  res.json(cities);
});

app.post('/api/cities', (req, res) => {
  const cities = readJSON(CITIES_FILE, DEFAULT_CITIES);
  const newCity = {
    ...req.body,
    id: req.body.id || `city_${Date.now()}`,
  };
  cities.push(newCity);
  writeJSON(CITIES_FILE, cities);
  res.json(newCity);
});

app.put('/api/cities/:id', (req, res) => {
  const cities = readJSON(CITIES_FILE, DEFAULT_CITIES);
  const index = cities.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    cities[index] = { ...cities[index], ...req.body };
    writeJSON(CITIES_FILE, cities);
    res.json(cities[index]);
  } else {
    res.status(404).json({ error: 'City not found' });
  }
});

app.delete('/api/cities/:id', (req, res) => {
  let cities = readJSON(CITIES_FILE, DEFAULT_CITIES);
  const initialLength = cities.length;
  cities = cities.filter(c => c.id !== req.params.id);
  if (cities.length < initialLength) {
    writeJSON(CITIES_FILE, cities);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'City not found' });
  }
});

// ==================== IMPROSOFT SYNC ====================

const IMPROSOFT_FILE = path.join(DATA_DIR, 'improsoft_raw.json');

app.post('/api/improsoft/sync', (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    const improsoftRaw = readJSON(IMPROSOFT_FILE, []);
    
    let added = 0;
    let updated = 0;
    
    for (const item of products) {
      const { name, barcode, price } = item;
      if (!name || !barcode) continue;
      
      const existingIndex = improsoftRaw.findIndex(p => p.barcode === barcode);
      
      if (existingIndex >= 0) {
        improsoftRaw[existingIndex].name = name;
        improsoftRaw[existingIndex].price = price || improsoftRaw[existingIndex].price;
        improsoftRaw[existingIndex].updated_at = new Date().toISOString();
        updated++;
      } else {
        improsoftRaw.push({
          id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          barcode,
          price: price || 0,
          created_at: new Date().toISOString()
        });
        added++;
      }
    }
    
    writeJSON(IMPROSOFT_FILE, improsoftRaw);
    
    const catalogProducts = readJSON(PRODUCTS_FILE, []);
    let catalogUpdated = 0;
    
    for (const item of products) {
      const catalogProduct = catalogProducts.find(p => p.barcode === item.barcode);
      if (catalogProduct && item.price) {
        catalogProduct.price = item.price;
        catalogUpdated++;
      }
    }
    
    if (catalogUpdated > 0) {
      writeJSON(PRODUCTS_FILE, catalogProducts);
    }
    
    console.log(`IMPROSOFT Sync: raw added ${added}, raw updated ${updated}, catalog prices updated ${catalogUpdated}`);
    
    res.json({
      success: true,
      added,
      updated,
      catalogUpdated,
      total: improsoftRaw.length
    });
    
  } catch (error) {
    console.error('IMPROSOFT sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.get('/api/improsoft/status', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const improsoftRaw = readJSON(IMPROSOFT_FILE, []);
  const improsoftProducts = products.filter(p => p.source === 'improsoft');
  
  res.json({
    total: products.length,
    fromImprosoft: improsoftProducts.length,
    rawTotal: improsoftRaw.length,
    notAdded: improsoftRaw.length - improsoftProducts.length,
    lastSync: improsoftRaw.length > 0 ? 
      improsoftRaw.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0].updated_at || improsoftRaw[0].created_at : null
  });
});

app.get('/api/improsoft/products', (req, res) => {
  const improsoftRaw = readJSON(IMPROSOFT_FILE, []);
  const products = readJSON(PRODUCTS_FILE, []);
  
  const existingBarcodes = products.filter(p => p.barcode).map(p => p.barcode);
  
  const result = improsoftRaw.map(item => ({
    ...item,
    inCatalog: existingBarcodes.includes(item.barcode)
  }));
  
  res.json(result);
});

app.post('/api/improsoft/create-product', (req, res) => {
  try {
    const { barcode, name, name_ru, price, category_id, image_url, description, description_ru } = req.body;
    
    if (!barcode || !name) {
      return res.status(400).json({ error: 'Barcode and name required' });
    }
    
    const products = readJSON(PRODUCTS_FILE, []);
    
    if (products.find(p => p.barcode === barcode)) {
      return res.status(400).json({ error: 'Product with this barcode already exists' });
    }
    
    const newProduct = {
      id: `prod_${Date.now()}`,
      name,
      name_ru: name_ru || name,
      description: description || '',
      description_ru: description_ru || '',
      price: price || 0,
      image_url: image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      images: [],
      category_id: category_id || '',
      in_stock: true,
      barcode,
      specifications: {},
      specifications_ru: {},
      created_at: new Date().toISOString(),
      source: 'improsoft'
    };
    
    products.push(newProduct);
    writeJSON(PRODUCTS_FILE, products);
    
    console.log(`Created product from IMPROSOFT: ${name} (${barcode})`);
    
    res.json(newProduct);
    
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ==================== PAYME INTEGRATION ====================

/**
 * Генерация ссылки на оплату через Payme Checkout
 * Формат: https://checkout.paycom.uz/base64(m=MERCHANT_ID;ac.order_id=ORDER_ID;a=AMOUNT;c=RETURN_URL)
 */
app.post('/api/create-payment', async (req, res) => {
  try {
    const { order_id, amount, return_url } = req.body;
    
    if (!order_id || !amount) {
      return res.status(400).json({ error: 'order_id and amount required' });
    }

    if (!PAYME_MERCHANT_ID) {
      console.error('PAYME_MERCHANT_ID not configured!');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    // Сумма в тийинах (1 сум = 100 тийинов)
    const amountTiyin = Math.round(amount * 100);
    
    // Формируем параметры для URL
    let params = `m=${PAYME_MERCHANT_ID};ac.order_id=${order_id};a=${amountTiyin}`;
    
    // Добавляем return_url если указан
    if (return_url) {
      params += `;c=${return_url}`;
    }
    
    // Кодируем в base64
    const encodedParams = Buffer.from(params).toString('base64');
    
    // Формируем URL для чекаута
    const payment_url = `${PAYME_CHECKOUT_URL}/${encodedParams}`;
    
    console.log(`Created payment link for order ${order_id}: ${amount} UZS`);
    
    res.json({ 
      success: true, 
      payment_url,
      order_id,
      amount,
      amount_tiyin: amountTiyin
    });
    
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

/**
 * Merchant API endpoint для Payme
 * Payme будет отправлять запросы сюда для проверки и выполнения транзакций
 */
app.post('/api/payme', async (req, res) => {
  try {
    // Проверка авторизации
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.json(createPaymeError(-32504, 'Unauthorized'));
    }
    
    // Декодируем Basic auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [login, password] = credentials.split(':');
    
    // Проверяем логин и пароль
    const secretKey = PAYME_TEST_MODE ? PAYME_SECRET_KEY_TEST : PAYME_SECRET_KEY;
    
    if (login !== 'Paycom' || password !== secretKey) {
      return res.json(createPaymeError(-32504, 'Unauthorized'));
    }
    
    const { id, method, params } = req.body;
    
    console.log(`Payme API: ${method}`, params);
    
    let result;
    
    switch (method) {
      case 'CheckPerformTransaction':
        result = await checkPerformTransaction(params);
        break;
      case 'CreateTransaction':
        result = await createTransaction(params);
        break;
      case 'PerformTransaction':
        result = await performTransaction(params);
        break;
      case 'CancelTransaction':
        result = await cancelTransaction(params);
        break;
      case 'CheckTransaction':
        result = await checkTransaction(params);
        break;
      case 'GetStatement':
        result = await getStatement(params);
        break;
      default:
        result = createPaymeError(-32601, 'Method not found');
    }
    
    res.json({
      jsonrpc: '2.0',
      id,
      ...result
    });
    
  } catch (error) {
    console.error('Payme API error:', error);
    res.json({
      jsonrpc: '2.0',
      id: req.body?.id,
      error: {
        code: -32400,
        message: { ru: 'Системная ошибка', uz: 'Tizim xatosi', en: 'System error' }
      }
    });
  }
});

// ==================== PAYME MERCHANT API METHODS ====================

function createPaymeError(code, message, data = null) {
  const messages = {
    '-32504': { ru: 'Недостаточно привилегий', uz: 'Huquqlar yetarli emas', en: 'Insufficient privileges' },
    '-32600': { ru: 'Неверный JSON-RPC объект', uz: 'Noto\'g\'ri JSON-RPC obyekt', en: 'Invalid JSON-RPC object' },
    '-32601': { ru: 'Метод не найден', uz: 'Metod topilmadi', en: 'Method not found' },
    '-31050': { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' },
    '-31051': { ru: 'Неверная сумма', uz: 'Noto\'g\'ri summa', en: 'Invalid amount' },
    '-31052': { ru: 'Заказ просрочен', uz: 'Buyurtma muddati o\'tgan', en: 'Order expired' },
    '-31053': { ru: 'Заказ уже оплачен', uz: 'Buyurtma allaqachon to\'langan', en: 'Order already paid' },
    '-31060': { ru: 'Невозможно отменить транзакцию', uz: 'Tranzaksiyani bekor qilib bo\'lmaydi', en: 'Cannot cancel transaction' },
    '-31099': { ru: 'Транзакция не найдена', uz: 'Tranzaksiya topilmadi', en: 'Transaction not found' },
  };
  
  return {
    error: {
      code,
      message: messages[code.toString()] || { ru: message, uz: message, en: message },
      data
    }
  };
}

// Проверка возможности выполнения транзакции
async function checkPerformTransaction(params) {
  const { account, amount } = params;
  const orderId = account?.order_id;
  
  if (!orderId) {
    return createPaymeError(-31050, 'Order ID not provided', 'order_id');
  }
  
  const orders = readJSON(ORDERS_FILE, []);
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return createPaymeError(-31050, 'Order not found', 'order_id');
  }
  
  // Проверяем сумму (amount в тийинах)
  const expectedAmount = order.total * 100;
  if (amount !== expectedAmount) {
    return createPaymeError(-31051, 'Invalid amount', 'amount');
  }
  
  // Проверяем не просрочен ли заказ
  if (new Date() > new Date(order.expire_at)) {
    return createPaymeError(-31052, 'Order expired', 'order_id');
  }
  
  // Проверяем не оплачен ли уже
  if (order.payment_status === 'paid') {
    return createPaymeError(-31053, 'Order already paid', 'order_id');
  }
  
  return { result: { allow: true } };
}

// Создание транзакции
async function createTransaction(params) {
  const { id: paymeId, time, amount, account } = params;
  const orderId = account?.order_id;
  
  // Сначала проверяем возможность
  const checkResult = await checkPerformTransaction(params);
  if (checkResult.error) {
    return checkResult;
  }
  
  const transactions = readJSON(TRANSACTIONS_FILE, []);
  
  // Проверяем существует ли уже транзакция с таким payme_id
  let transaction = transactions.find(t => t.payme_id === paymeId);
  
  if (transaction) {
    // Если транзакция уже есть и в правильном статусе
    if (transaction.state === 1) {
      return {
        result: {
          create_time: transaction.create_time,
          transaction: transaction.id,
          state: transaction.state
        }
      };
    } else {
      return createPaymeError(-31099, 'Transaction in invalid state');
    }
  }
  
  // Проверяем нет ли другой активной транзакции для этого заказа
  const existingTx = transactions.find(t => 
    t.order_id === orderId && 
    t.state === 1 && 
    t.payme_id !== paymeId
  );
  
  if (existingTx) {
    return createPaymeError(-31050, 'Another transaction in progress for this order');
  }
  
  // Создаём новую транзакцию
  transaction = {
    id: `tx_${Date.now()}`,
    payme_id: paymeId,
    order_id: orderId,
    amount,
    state: 1, // Создана
    create_time: time,
    created_at: new Date().toISOString()
  };
  
  transactions.push(transaction);
  writeJSON(TRANSACTIONS_FILE, transactions);
  
  // Обновляем статус заказа
  const orders = readJSON(ORDERS_FILE, []);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].payment_status = 'processing';
    orders[orderIndex].transaction_id = transaction.id;
    writeJSON(ORDERS_FILE, orders);
  }
  
  console.log(`Transaction created: ${transaction.id} for order ${orderId}`);
  
  return {
    result: {
      create_time: transaction.create_time,
      transaction: transaction.id,
      state: transaction.state
    }
  };
}

// Выполнение (подтверждение) транзакции
async function performTransaction(params) {
  const { id: paymeId } = params;
  
  const transactions = readJSON(TRANSACTIONS_FILE, []);
  const txIndex = transactions.findIndex(t => t.payme_id === paymeId);
  
  if (txIndex === -1) {
    return createPaymeError(-31099, 'Transaction not found');
  }
  
  const transaction = transactions[txIndex];
  
  // Если уже выполнена
  if (transaction.state === 2) {
    return {
      result: {
        transaction: transaction.id,
        perform_time: transaction.perform_time,
        state: transaction.state
      }
    };
  }
  
  // Проверяем что транзакция в состоянии "создана"
  if (transaction.state !== 1) {
    return createPaymeError(-31099, 'Transaction in invalid state');
  }
  
  // Выполняем транзакцию
  const performTime = Date.now();
  transactions[txIndex].state = 2; // Выполнена
  transactions[txIndex].perform_time = performTime;
  transactions[txIndex].performed_at = new Date().toISOString();
  writeJSON(TRANSACTIONS_FILE, transactions);
  
  // Обновляем статус заказа
  const orders = readJSON(ORDERS_FILE, []);
  const orderIndex = orders.findIndex(o => o.id === transaction.order_id);
  if (orderIndex !== -1) {
    orders[orderIndex].payment_status = 'paid';
    orders[orderIndex].status = 'paid';
    orders[orderIndex].paid_at = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);
    
    // Отправляем уведомление в Telegram
    const order = orders[orderIndex];
    const telegramMessage = `
✅ <b>Оплата получена!</b>

🛒 Заказ: #${order.id.slice(-6)}
👤 Клиент: ${order.customer.name}
📞 Телефон: ${order.customer.phone}
💰 Сумма: ${order.total.toLocaleString()} сум

🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}
    `.trim();
    
    await sendToTelegram(telegramMessage);
  }
  
  console.log(`Transaction performed: ${transaction.id}`);
  
  return {
    result: {
      transaction: transaction.id,
      perform_time: performTime,
      state: 2
    }
  };
}

// Отмена транзакции
async function cancelTransaction(params) {
  const { id: paymeId, reason } = params;
  
  const transactions = readJSON(TRANSACTIONS_FILE, []);
  const txIndex = transactions.findIndex(t => t.payme_id === paymeId);
  
  if (txIndex === -1) {
    return createPaymeError(-31099, 'Transaction not found');
  }
  
  const transaction = transactions[txIndex];
  
  // Если уже отменена
  if (transaction.state < 0) {
    return {
      result: {
        transaction: transaction.id,
        cancel_time: transaction.cancel_time,
        state: transaction.state
      }
    };
  }
  
  // Определяем новое состояние
  let newState;
  if (transaction.state === 1) {
    newState = -1; // Отменена до выполнения
  } else if (transaction.state === 2) {
    newState = -2; // Отменена после выполнения
  } else {
    return createPaymeError(-31060, 'Cannot cancel transaction');
  }
  
  const cancelTime = Date.now();
  transactions[txIndex].state = newState;
  transactions[txIndex].cancel_time = cancelTime;
  transactions[txIndex].reason = reason;
  transactions[txIndex].cancelled_at = new Date().toISOString();
  writeJSON(TRANSACTIONS_FILE, transactions);
  
  // Обновляем статус заказа
  const orders = readJSON(ORDERS_FILE, []);
  const orderIndex = orders.findIndex(o => o.id === transaction.order_id);
  if (orderIndex !== -1) {
    orders[orderIndex].payment_status = 'cancelled';
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].cancelled_at = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);
    
    // Отправляем уведомление в Telegram
    const order = orders[orderIndex];
    const reasonText = {
      1: 'Ошибка получателя',
      2: 'Ошибка в деталях транзакции',
      3: 'Отменено пользователем',
      4: 'Ошибка при выполнении',
      5: 'Отменено покупателем'
    };
    
    const telegramMessage = `
❌ <b>Оплата отменена</b>

🛒 Заказ: #${order.id.slice(-6)}
👤 Клиент: ${order.customer.name}
📞 Телефон: ${order.customer.phone}
💰 Сумма: ${order.total.toLocaleString()} сум
📝 Причина: ${reasonText[reason] || 'Не указана'}

🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}
    `.trim();
    
    await sendToTelegram(telegramMessage);
  }
  
  console.log(`Transaction cancelled: ${transaction.id}, reason: ${reason}`);
  
  return {
    result: {
      transaction: transaction.id,
      cancel_time: cancelTime,
      state: newState
    }
  };
}

// Проверка статуса транзакции
async function checkTransaction(params) {
  const { id: paymeId } = params;
  
  const transactions = readJSON(TRANSACTIONS_FILE, []);
  const transaction = transactions.find(t => t.payme_id === paymeId);
  
  if (!transaction) {
    return createPaymeError(-31099, 'Transaction not found');
  }
  
  return {
    result: {
      create_time: transaction.create_time,
      perform_time: transaction.perform_time || 0,
      cancel_time: transaction.cancel_time || 0,
      transaction: transaction.id,
      state: transaction.state,
      reason: transaction.reason || null
    }
  };
}

// Получение списка транзакций за период
async function getStatement(params) {
  const { from, to } = params;
  
  const transactions = readJSON(TRANSACTIONS_FILE, []);
  
  const filtered = transactions.filter(t => {
    const createTime = t.create_time;
    return createTime >= from && createTime <= to;
  });
  
  const result = filtered.map(t => ({
    id: t.payme_id,
    time: t.create_time,
    amount: t.amount,
    account: { order_id: t.order_id },
    create_time: t.create_time,
    perform_time: t.perform_time || 0,
    cancel_time: t.cancel_time || 0,
    transaction: t.id,
    state: t.state,
    reason: t.reason || null
  }));
  
  return { result: { transactions: result } };
}

// ==================== CALLBACK URL для возврата после оплаты ====================

app.get('/api/payment/callback', (req, res) => {
  const { order_id } = req.query;
  
  if (order_id) {
    const orders = readJSON(ORDERS_FILE, []);
    const order = orders.find(o => o.id === order_id);
    
    if (order) {
      // Редирект на страницу успеха или страницу заказа
      // Замените URL на ваш домен
      const successUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${successUrl}/?payment_status=${order.payment_status}&order_id=${order_id}`);
    }
  }
  
  res.redirect('/');
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Texnokross API running on port ${PORT}`);
  console.log(`📁 Data stored in: ${DATA_DIR}`);
  console.log(`💳 Payme Mode: ${PAYME_TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
  console.log(`💳 Payme Merchant ID: ${PAYME_MERCHANT_ID ? 'Configured' : 'NOT CONFIGURED!'}`);
});
