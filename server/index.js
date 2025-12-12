const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

// Telegram настройки (замени на свои)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Дефолтные настройки
const DEFAULT_SETTINGS = {
  deliveryPrice: 30000, // Сумма платной доставки в сумах
  freeDeliveryRadius: 5, // Радиус бесплатной доставки в км
  freeDeliveryCity: 'Navoiy', // Город бесплатной доставки
};

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

// Хелперы для чтения/записи
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

// ==================== PRODUCTS ====================

// GET all products
app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  res.json(products);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// POST new product
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

// PUT update product
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

// DELETE product
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

// GET all categories
app.get('/api/categories', (req, res) => {
  const categories = readJSON(CATEGORIES_FILE, DEFAULT_CATEGORIES);
  res.json(categories);
});

// POST new category
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

// PUT update category
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

// DELETE category
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

// GET all banners
app.get('/api/banners', (req, res) => {
  const banners = readJSON(BANNERS_FILE, DEFAULT_BANNERS);
  res.json(banners);
});

// POST new banner
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

// PUT update banner
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

// DELETE banner
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

// GET all orders
app.get('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  res.json(orders);
});

// POST new order
app.post('/api/orders', async (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const { customer, items, total } = req.body;
  
  const newOrder = {
    id: `order_${Date.now()}`,
    customer,
    items,
    total,
    status: 'new',
    created_at: new Date().toISOString(),
  };
  
  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);
  
  // Формируем сообщение для Telegram
  let itemsList = items.map(item => 
    `  • ${item.name} x${item.quantity} = ${item.price.toLocaleString()} сум`
  ).join('\n');

  const deliveryInfo = customer.deliveryType === 'paid' 
    ? `🚚 <b>Доставка:</b> Платная (${customer.deliveryCost?.toLocaleString() || 0} сум)`
    : `🚚 <b>Доставка:</b> Бесплатная (Навои, до 5 км)`;
  
  const telegramMessage = `
🛒 <b>Новый заказ #${newOrder.id.slice(-6)}</b>

👤 <b>Клиент:</b> ${customer.name}
📞 <b>Телефон:</b> ${customer.phone}
${customer.address ? `📍 <b>Адрес:</b> ${customer.address}` : ''}
${deliveryInfo}
${customer.comment ? `💬 <b>Комментарий:</b> ${customer.comment}` : ''}

📦 <b>Товары:</b>
${itemsList}

💰 <b>Итого:</b> ${total.toLocaleString()} сум

🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}
  `.trim();
  
  await sendToTelegram(telegramMessage);
  
  res.json(newOrder);
});

// PUT update order status
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

// GET settings
app.get('/api/settings', (req, res) => {
  const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json(settings);
});

// PUT update settings
app.put('/api/settings', (req, res) => {
  const currentSettings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
  const newSettings = { ...currentSettings, ...req.body };
  writeJSON(SETTINGS_FILE, newSettings);
  res.json(newSettings);
});

app.listen(PORT, () => {
  console.log(`🚀 Texnokross API running on port ${PORT}`);
  console.log(`📁 Data stored in: ${DATA_DIR}`);
});
