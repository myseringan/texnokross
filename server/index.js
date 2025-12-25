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
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RESET_CODES_FILE = path.join(DATA_DIR, 'reset_codes.json');

// Telegram настройки
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

// Верификационный бот для восстановления пароля
const VERIFICATION_BOT_TOKEN = process.env.VERIFICATION_BOT_TOKEN || '8225999981:AAG-rYuARiyierjBrxbPSTLpvlScXvGZLDA';

// ==================== PAYME CONFIGURATION ====================
const PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || '';
const PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY || '';
const PAYME_SECRET_KEY_TEST = process.env.PAYME_SECRET_KEY_TEST || '';
const PAYME_TEST_MODE = process.env.PAYME_TEST_MODE === 'true';

const PAYME_CHECKOUT_URL = PAYME_TEST_MODE
  ? 'https://test.paycom.uz'
  : 'https://checkout.paycom.uz';

const ORDER_TIMEOUT = 12 * 60 * 60 * 1000;

// Frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://texnokross.uz';

// Админ данные
const ADMIN_PHONE = '998907174447';
const ADMIN_PASSWORD = 'Texno@2025!';

// Функции для хэширования паролей
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'texnokross_salt_2025').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Генерация токена сессии
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Генерация кода восстановления (6 цифр)
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

// ==================== TELEGRAM BOT ====================

// Отправка сообщения с кнопками
async function sendTelegramWithButtons(message, orderId, shortId) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured, skipping notification');
    return false;
  }

  // Используем short_id для callback_data (лимит 64 байта в Telegram)
  const cbId = shortId || orderId.slice(-6);

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📦 Обрабатывается', callback_data: `st_proc_${cbId}` },
          { text: '🚚 Отправлено', callback_data: `st_ship_${cbId}` }
        ],
        [
          { text: '✅ Доставлено', callback_data: `st_done_${cbId}` },
          { text: '❌ Отменить', callback_data: `st_canc_${cbId}` }
        ]
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: keyboard
      })
    });
    return response.ok;
  } catch (err) {
    console.error('Telegram error:', err);
    return false;
  }
}

// Обновление сообщения
async function updateTelegramMessage(chatId, messageId, newText, shortId, showButtons = true) {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;

    const body = {
      chat_id: chatId,
      message_id: messageId,
      text: newText,
      parse_mode: 'HTML'
    };

    if (showButtons) {
      body.reply_markup = {
        inline_keyboard: [
          [
            { text: '📦 Обрабатывается', callback_data: `st_proc_${shortId}` },
            { text: '🚚 Отправлено', callback_data: `st_ship_${shortId}` }
          ],
          [
            { text: '✅ Доставлено', callback_data: `st_done_${shortId}` },
            { text: '❌ Отменить', callback_data: `st_canc_${shortId}` }
          ]
        ]
      };
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return true;
  } catch (err) {
    console.error('Telegram update error:', err);
    return false;
  }
}

// Ответ на callback
async function answerCallback(callbackQueryId, text) {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: false
      })
    });
  } catch (err) {
    console.error('Answer callback error:', err);
  }
}

// Webhook для Telegram бота
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;

    // Обработка callback от кнопок
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;
      const callbackQueryId = update.callback_query.id;

      console.log('Callback received:', callbackData);

      // Парсим callback: st_STATUS_SHORTID (новый формат)
      const match = callbackData.match(/^st_(proc|ship|done|canc)_(\d+)$/);

      if (match) {
        const statusCode = match[1];
        const shortId = match[2];

        // Маппинг коротких кодов в полные статусы
        const statusMap = {
          'proc': 'processing',
          'ship': 'shipped',
          'done': 'delivered',
          'canc': 'cancelled'
        };
        const newStatus = statusMap[statusCode];

        console.log('Webhook received - Status:', newStatus, 'ShortID:', shortId);

        // Обновляем статус заказа
        const orders = readJSON(ORDERS_FILE, []);

        // Ищем по short_id или по последним 6 символам id
        const orderIndex = orders.findIndex(o =>
          o.short_id === shortId || o.id.endsWith(shortId)
        );

        console.log('Found order index:', orderIndex);

        if (orderIndex !== -1) {
          const order = orders[orderIndex];
          const oldStatus = order.status;

          // Обновляем статус
          orders[orderIndex].status = newStatus;

          // Добавляем timestamp
          const now = new Date().toISOString();
          if (newStatus === 'processing') orders[orderIndex].processing_at = now;
          if (newStatus === 'shipped') orders[orderIndex].shipped_at = now;
          if (newStatus === 'delivered') orders[orderIndex].delivered_at = now;
          if (newStatus === 'cancelled') orders[orderIndex].cancelled_at = now;

          writeJSON(ORDERS_FILE, orders);

          // Статусы для отображения
          const statusLabels = {
            'processing': '📦 Обрабатывается',
            'shipped': '🚚 Отправлено',
            'delivered': '✅ Доставлено',
            'cancelled': '❌ Отменён'
          };

          // Формируем обновлённое сообщение
          const statusLabel = statusLabels[newStatus] || newStatus;

          // Формируем список товаров
          let itemsList = order.items.map(item =>
            `  • ${item.name} x${item.quantity} = ${item.price.toLocaleString()} сум`
          ).join('\n');

          const deliveryInfo = order.customer.deliveryCost === 0
            ? `🚚 Доставка: Бесплатная`
            : `🚚 Доставка: ${order.customer.deliveryCost?.toLocaleString() || 0} сум`;

          const updatedMessage = `
✅ <b>Заказ #${order.short_id || order.id.slice(-6)}</b>

👤 Клиент: ${order.customer.name}
📞 Телефон: ${order.customer.phone}
🏙 Город: ${order.customer.city || 'Не указан'}
${order.customer.address ? `📍 Адрес: ${order.customer.address}` : ''}
${deliveryInfo}

📦 <b>Товары:</b>
${itemsList}

💰 <b>Итого:</b> ${order.total.toLocaleString()} сум

📊 <b>Статус:</b> ${statusLabel}
🕐 Обновлено: ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}
          `.trim();

          // Обновляем сообщение
          const showButtons = newStatus !== 'delivered' && newStatus !== 'cancelled';
          const cbShortId = order.short_id || order.id.slice(-6);
          await updateTelegramMessage(chatId, messageId, updatedMessage, cbShortId, showButtons);

          // Отвечаем на callback
          await answerCallback(callbackQueryId, `Статус изменён: ${statusLabel}`);
        } else {
          console.log('ORDER NOT FOUND! ShortID from callback:', shortId);
          console.log('All order IDs in database:', orders.map(o => `${o.id} (short: ${o.short_id})`).join(', '));
          await answerCallback(callbackQueryId, `Заказ не найден: #${shortId}`);
        }
      } else {
        // Пробуем старый формат для существующих заказов
        const oldMatch = callbackData.match(/^status_(\w+)_(.+)$/);
        if (oldMatch) {
          const newStatus = oldMatch[1];
          const orderId = oldMatch[2];

          console.log('Old format callback - Status:', newStatus, 'OrderID:', orderId);

          const orders = readJSON(ORDERS_FILE, []);
          const orderIndex = orders.findIndex(o => o.id === orderId);

          if (orderIndex !== -1) {
            const order = orders[orderIndex];
            orders[orderIndex].status = newStatus;

            const now = new Date().toISOString();
            if (newStatus === 'processing') orders[orderIndex].processing_at = now;
            if (newStatus === 'shipped') orders[orderIndex].shipped_at = now;
            if (newStatus === 'delivered') orders[orderIndex].delivered_at = now;
            if (newStatus === 'cancelled') orders[orderIndex].cancelled_at = now;

            writeJSON(ORDERS_FILE, orders);

            const statusLabels = {
              'processing': '📦 Обрабатывается',
              'shipped': '🚚 Отправлено',
              'delivered': '✅ Доставлено',
              'cancelled': '❌ Отменён'
            };
            const statusLabel = statusLabels[newStatus] || newStatus;

            await answerCallback(callbackQueryId, `Статус изменён: ${statusLabel}`);
          } else {
            await answerCallback(callbackQueryId, `Заказ не найден`);
          }
        }
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.json({ ok: true });
  }
});

// ==================== VERIFICATION BOT WEBHOOK ====================

// Webhook для верификационного бота (восстановление пароля)
app.post('/api/verification-bot/webhook', async (req, res) => {
  try {
    const update = req.body;

    // Обработка команды /start
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      const keyboard = {
        keyboard: [[{ text: '📱 Raqamni yuborish', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true
      };

      await fetch(`https://api.telegram.org/bot${VERIFICATION_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🔐 Parolni tiklash uchun telefon raqamingizni yuboring.\n\nQuyidagi tugmani bosing:',
          reply_markup: keyboard
        })
      });
    }

    // Обработка контакта (номера телефона)
    if (update.message?.contact) {
      const chatId = update.message.chat.id;
      const contact = update.message.contact;

      // Проверяем что это номер самого пользователя
      if (contact.user_id !== update.message.from.id) {
        await fetch(`https://api.telegram.org/bot${VERIFICATION_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Iltimos, faqat o\'zingizning raqamingizni yuboring.',
            reply_markup: { remove_keyboard: true }
          })
        });
        res.json({ ok: true });
        return;
      }

      // Нормализуем номер телефона
      const phoneNumber = contact.phone_number.replace(/\D/g, '').slice(-9);

      console.log(`📱 Verification bot: Contact received - ${phoneNumber}`);

      // Проверяем есть ли запрос на восстановление для этого номера
      const resetCodes = readJSON(RESET_CODES_FILE, []);
      const resetEntry = resetCodes.find(c => c.phone === phoneNumber);

      if (resetEntry && new Date(resetEntry.expires_at) > new Date()) {
        // Код найден и не истёк - отправляем
        await fetch(`https://api.telegram.org/bot${VERIFICATION_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Sizning tasdiqlash kodingiz:\n\n🔑 <b>${resetEntry.code}</b>\n\n⏰ Kod 10 daqiqa amal qiladi.\n\nUshbu kodni saytda kiriting.`,
            parse_mode: 'HTML',
            reply_markup: { remove_keyboard: true }
          })
        });

        console.log(`✅ Verification code sent to ${phoneNumber}: ${resetEntry.code}`);
      } else {
        // Нет активного запроса на восстановление
        await fetch(`https://api.telegram.org/bot${VERIFICATION_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Sizning raqamingiz uchun parolni tiklash so\'rovi topilmadi.\n\n1️⃣ Avval saytda "Parolni unutdim" tugmasini bosing\n2️⃣ Telefon raqamingizni kiriting\n3️⃣ Keyin bu botga qayting va raqamingizni yuboring',
            reply_markup: { remove_keyboard: true }
          })
        });

        console.log(`❌ No reset request found for ${phoneNumber}`);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Verification bot webhook error:', error);
    res.json({ ok: true });
  }
});

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

// ==================== AUTH API ====================

// Регистрация
app.post('/api/auth/register', (req, res) => {
  const { phone, password, name } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefon va parol kerak' });
  }

  // Нормализуем телефон
  const normalizedPhone = phone.replace(/\D/g, '').slice(-9);

  if (normalizedPhone.length < 9) {
    return res.status(400).json({ error: 'Telefon raqami noto\'g\'ri' });
  }

  // Проверяем если это админ номер
  if (normalizedPhone === ADMIN_PHONE.slice(-9)) {
    return res.status(400).json({ error: 'Bu raqam bilan ro\'yxatdan o\'tish mumkin emas' });
  }

  const users = readJSON(USERS_FILE, []);

  // Проверяем существует ли пользователь
  const existingUser = users.find(u => u.phone === normalizedPhone);
  if (existingUser) {
    return res.status(400).json({ error: 'Bu raqam allaqachon ro\'yxatdan o\'tgan' });
  }

  // Создаём нового пользователя
  const token = generateToken();
  const newUser = {
    id: `user_${Date.now()}`,
    phone: normalizedPhone,
    name: name || `Foydalanuvchi ${normalizedPhone.slice(-4)}`,
    password_hash: hashPassword(password),
    token: token,
    isAdmin: false,
    created_at: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  console.log(`👤 New user registered: ${normalizedPhone}`);

  res.json({
    success: true,
    user: {
      id: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      isAdmin: false,
      token: token
    }
  });
});

// Вход
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'Telefon va parol kerak' });
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-9);

  // Проверяем если это админ
  if (normalizedPhone === ADMIN_PHONE.slice(-9)) {
    if (password === ADMIN_PASSWORD) {
      const token = generateToken();
      res.json({
        success: true,
        user: {
          id: 'admin',
          phone: ADMIN_PHONE,
          name: 'Administrator',
          isAdmin: true,
          token: token
        }
      });
      return;
    } else {
      return res.status(401).json({ error: 'Parol noto\'g\'ri' });
    }
  }

  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.phone === normalizedPhone);

  if (!user) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi. Avval ro\'yxatdan o\'ting.' });
  }

  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Parol noto\'g\'ri' });
  }

  // Обновляем токен
  const token = generateToken();
  const userIndex = users.findIndex(u => u.phone === normalizedPhone);
  users[userIndex].token = token;
  users[userIndex].last_login = new Date().toISOString();
  writeJSON(USERS_FILE, users);

  console.log(`👤 User logged in: ${normalizedPhone}`);

  res.json({
    success: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      isAdmin: false,
      token: token
    }
  });
});

// Запрос кода восстановления пароля
app.post('/api/auth/forgot-password', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqami kerak' });
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-9);

  // Проверяем если это админ
  if (normalizedPhone === ADMIN_PHONE.slice(-9)) {
    return res.status(400).json({ error: 'Admin parolini tiklash mumkin emas' });
  }

  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.phone === normalizedPhone);

  if (!user) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  // Генерируем код
  const code = generateResetCode();
  const resetCodes = readJSON(RESET_CODES_FILE, []);

  // Удаляем старые коды для этого телефона
  const filteredCodes = resetCodes.filter(c => c.phone !== normalizedPhone);

  // Добавляем новый код (действителен 10 минут)
  filteredCodes.push({
    phone: normalizedPhone,
    code: code,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  });

  writeJSON(RESET_CODES_FILE, filteredCodes);

  // Отправляем SMS через Eskiz.uz (если настроен)
  const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
  const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;

  if (ESKIZ_EMAIL && ESKIZ_PASSWORD) {
    try {
      // Получаем токен Eskiz
      const tokenResponse = await fetch('https://notify.eskiz.uz/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ESKIZ_EMAIL, password: ESKIZ_PASSWORD })
      });
      const tokenData = await tokenResponse.json();

      if (tokenData.data?.token) {
        // Отправляем SMS
        const fullPhone = '998' + normalizedPhone;
        const smsResponse = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenData.data.token}`
          },
          body: JSON.stringify({
            mobile_phone: fullPhone,
            message: `Texnokross: Parolni tiklash kodi: ${code}. Kod 10 daqiqa amal qiladi.`,
            from: '4546'
          })
        });
        const smsData = await smsResponse.json();
        console.log(`📱 SMS sent to ${fullPhone}:`, smsData);
      }
    } catch (err) {
      console.error('Eskiz SMS error:', err);
    }
  }

  // Также отправляем код в Telegram (как резерв)
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const message = `🔐 Parolni tiklash kodi\n\n📞 Telefon: ${normalizedPhone}\n🔑 Kod: ${code}\n⏰ Amal qilish: 10 daqiqa`;
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message
        })
      });
    } catch (err) {
      console.error('Telegram send error:', err);
    }
  }

  console.log(`🔐 Password reset code for ${normalizedPhone}: ${code}`);

  // Определяем было ли отправлено SMS
  const smsSent = !!(ESKIZ_EMAIL && ESKIZ_PASSWORD);

  // Ссылка на верификационного бота
  const botLink = 'https://t.me/texnokross_auth_bot';

  res.json({
    success: true,
    message: smsSent ? 'SMS kod yuborildi' : 'Telegram botga o\'ting',
    sms_sent: smsSent,
    bot_link: smsSent ? undefined : botLink,
    use_bot: !smsSent
  });
});

// Сброс пароля с кодом
app.post('/api/auth/reset-password', (req, res) => {
  const { phone, code, newPassword } = req.body;

  if (!phone || !code || !newPassword) {
    return res.status(400).json({ error: 'Telefon, kod va yangi parol kerak' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak' });
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-9);

  const resetCodes = readJSON(RESET_CODES_FILE, []);
  const resetEntry = resetCodes.find(c => c.phone === normalizedPhone && c.code === code);

  if (!resetEntry) {
    return res.status(400).json({ error: 'Kod noto\'g\'ri' });
  }

  if (new Date(resetEntry.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Kod eskirgan. Yangi kod so\'rang.' });
  }

  // Обновляем пароль
  const users = readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.phone === normalizedPhone);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  users[userIndex].password_hash = hashPassword(newPassword);
  users[userIndex].password_updated_at = new Date().toISOString();
  writeJSON(USERS_FILE, users);

  // Удаляем использованный код
  const filteredCodes = resetCodes.filter(c => c.phone !== normalizedPhone);
  writeJSON(RESET_CODES_FILE, filteredCodes);

  console.log(`🔐 Password reset for ${normalizedPhone}`);

  res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
});

// Смена пароля (для авторизованного пользователя)
app.post('/api/auth/change-password', (req, res) => {
  const { phone, oldPassword, newPassword } = req.body;

  if (!phone || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'Yangi parol kamida 4 ta belgidan iborat bo\'lishi kerak' });
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-9);

  const users = readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.phone === normalizedPhone);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  if (!verifyPassword(oldPassword, users[userIndex].password_hash)) {
    return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });
  }

  users[userIndex].password_hash = hashPassword(newPassword);
  users[userIndex].password_updated_at = new Date().toISOString();
  writeJSON(USERS_FILE, users);

  console.log(`🔐 Password changed for ${normalizedPhone}`);

  res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
});

// Получение профиля пользователя
app.get('/api/auth/profile/:phone', (req, res) => {
  const normalizedPhone = req.params.phone.replace(/\D/g, '').slice(-9);

  // Проверяем если это админ
  if (normalizedPhone === ADMIN_PHONE.slice(-9)) {
    return res.json({
      id: 'admin',
      phone: ADMIN_PHONE,
      name: 'Administrator',
      isAdmin: true
    });
  }

  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.phone === normalizedPhone);

  if (!user) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }

  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    isAdmin: false,
    created_at: user.created_at
  });
});

// ==================== ORDERS ====================

app.get('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  res.json(orders);
});

// Получение заказа по ID
app.get('/api/orders/:id', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.post('/api/orders', async (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const { customer, items, total } = req.body;

  // Генерируем короткий ID из 6 цифр
  const shortId = Math.floor(100000 + Math.random() * 900000).toString();

  const newOrder = {
    id: `order_${Date.now()}_${shortId}`,
    short_id: shortId,
    customer,
    items,
    total,
    status: 'pending',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    expire_at: new Date(Date.now() + ORDER_TIMEOUT).toISOString(),
  };

  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);

  console.log(`📦 New order created: ${newOrder.id} (pending payment)`);

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

// API для обновления статуса заказа
app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orders = readJSON(ORDERS_FILE, []);
  const index = orders.findIndex(o => o.id === req.params.id);

  if (index !== -1) {
    orders[index].status = status;

    const now = new Date().toISOString();
    if (status === 'processing') orders[index].processing_at = now;
    if (status === 'shipped') orders[index].shipped_at = now;
    if (status === 'delivered') orders[index].delivered_at = now;
    if (status === 'cancelled') orders[index].cancelled_at = now;

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

    const amountTiyin = Math.round(amount * 100);

    let params = `m=${PAYME_MERCHANT_ID};ac.order_id=${order_id};a=${amountTiyin}`;

    if (return_url) {
      params += `;c=${return_url}`;
    }

    const encodedParams = Buffer.from(params).toString('base64');
    const payment_url = `${PAYME_CHECKOUT_URL}/${encodedParams}`;

    console.log(`💳 Payment link created for order ${order_id}: ${amount} сум`);

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

app.post('/api/payme', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.json(createPaymeError(-31001, 'Unauthorized'));
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [login, password] = credentials.split(':');

    const secretKey = PAYME_TEST_MODE ? PAYME_SECRET_KEY_TEST : PAYME_SECRET_KEY;

    if (login !== 'Paycom' || password !== secretKey) {
      return res.json(createPaymeError(-31001, 'Unauthorized'));
    }

    const { id, method, params } = req.body;

    console.log(`💳 Payme API: ${method}`, params);

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
    '-31001': { ru: 'Недостаточно привилегий', uz: 'Huquqlar yetarli emas', en: 'Insufficient privileges' },
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

  const expectedAmount = order.total * 100;
  if (amount !== expectedAmount) {
    return createPaymeError(-31051, 'Invalid amount', 'amount');
  }

  if (new Date() > new Date(order.expire_at)) {
    return createPaymeError(-31052, 'Order expired', 'order_id');
  }

  if (order.payment_status === 'paid') {
    return createPaymeError(-31053, 'Order already paid', 'order_id');
  }

  return { result: { allow: true } };
}

async function createTransaction(params) {
  const { id: paymeId, time, amount, account } = params;
  const orderId = account?.order_id;

  const checkResult = await checkPerformTransaction(params);
  if (checkResult.error) {
    return checkResult;
  }

  const transactions = readJSON(TRANSACTIONS_FILE, []);

  let transaction = transactions.find(t => t.payme_id === paymeId);

  if (transaction) {
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

  const existingTx = transactions.find(t =>
    t.order_id === orderId &&
    t.state === 1 &&
    t.payme_id !== paymeId
  );

  if (existingTx) {
    return createPaymeError(-31050, 'Another transaction in progress for this order');
  }

  transaction = {
    id: `tx_${Date.now()}`,
    payme_id: paymeId,
    order_id: orderId,
    amount,
    state: 1,
    create_time: time,
    created_at: new Date().toISOString()
  };

  transactions.push(transaction);
  writeJSON(TRANSACTIONS_FILE, transactions);

  const orders = readJSON(ORDERS_FILE, []);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].payment_status = 'processing';
    orders[orderIndex].transaction_id = transaction.id;
    writeJSON(ORDERS_FILE, orders);
  }

  console.log(`💳 Transaction created: ${transaction.id} for order ${orderId}`);

  return {
    result: {
      create_time: transaction.create_time,
      transaction: transaction.id,
      state: transaction.state
    }
  };
}

async function performTransaction(params) {
  const { id: paymeId } = params;

  const transactions = readJSON(TRANSACTIONS_FILE, []);
  const txIndex = transactions.findIndex(t => t.payme_id === paymeId);

  if (txIndex === -1) {
    return createPaymeError(-31099, 'Transaction not found');
  }

  const transaction = transactions[txIndex];

  if (transaction.state === 2) {
    return {
      result: {
        transaction: transaction.id,
        perform_time: transaction.perform_time,
        state: transaction.state
      }
    };
  }

  if (transaction.state !== 1) {
    return createPaymeError(-31099, 'Transaction in invalid state');
  }

  const performTime = Date.now();
  transactions[txIndex].state = 2;
  transactions[txIndex].perform_time = performTime;
  transactions[txIndex].performed_at = new Date().toISOString();
  writeJSON(TRANSACTIONS_FILE, transactions);

  const orders = readJSON(ORDERS_FILE, []);
  const orderIndex = orders.findIndex(o => o.id === transaction.order_id);
  if (orderIndex !== -1) {
    orders[orderIndex].payment_status = 'paid';
    orders[orderIndex].status = 'paid';
    orders[orderIndex].paid_at = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);

    // Отправляем уведомление в Telegram С КНОПКАМИ
    const order = orders[orderIndex];

    let itemsList = order.items.map(item =>
      `  • ${item.name} x${item.quantity} = ${item.price.toLocaleString()} сум`
    ).join('\n');

    const deliveryInfo = order.customer.deliveryCost === 0
      ? `🚚 Доставка: Бесплатная`
      : `🚚 Доставка: ${order.customer.deliveryCost?.toLocaleString() || 0} сум`;

    const telegramMessage = `
✅ <b>Оплата получена!</b>

🛒 Заказ: #${order.short_id || order.id.slice(-6)}
👤 Клиент: ${order.customer.name}
📞 Телефон: ${order.customer.phone}
🏙 Город: ${order.customer.city || 'Не указан'}
${order.customer.address ? `📍 Адрес: ${order.customer.address}` : ''}
${deliveryInfo}

📦 <b>Товары:</b>
${itemsList}

💰 <b>Итого:</b> ${order.total.toLocaleString()} сум

📊 <b>Статус:</b> 💳 Оплачено
🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })}
    `.trim();

    await sendTelegramWithButtons(telegramMessage, order.id, order.short_id);
  }

  console.log(`✅ Transaction performed: ${transaction.id}`);

  return {
    result: {
      transaction: transaction.id,
      perform_time: performTime,
      state: 2
    }
  };
}

async function cancelTransaction(params) {
  const { id: paymeId, reason } = params;

  const transactions = readJSON(TRANSACTIONS_FILE, []);
  const txIndex = transactions.findIndex(t => t.payme_id === paymeId);

  if (txIndex === -1) {
    return createPaymeError(-31099, 'Transaction not found');
  }

  const transaction = transactions[txIndex];

  if (transaction.state < 0) {
    return {
      result: {
        transaction: transaction.id,
        cancel_time: transaction.cancel_time,
        state: transaction.state
      }
    };
  }

  let newState;
  if (transaction.state === 1) {
    newState = -1;
  } else if (transaction.state === 2) {
    newState = -2;
  } else {
    return createPaymeError(-31060, 'Cannot cancel transaction');
  }

  const cancelTime = Date.now();
  transactions[txIndex].state = newState;
  transactions[txIndex].cancel_time = cancelTime;
  transactions[txIndex].reason = reason;
  transactions[txIndex].cancelled_at = new Date().toISOString();
  writeJSON(TRANSACTIONS_FILE, transactions);

  const orders = readJSON(ORDERS_FILE, []);
  const orderIndex = orders.findIndex(o => o.id === transaction.order_id);
  if (orderIndex !== -1) {
    orders[orderIndex].payment_status = 'cancelled';
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].cancelled_at = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);
  }

  console.log(`❌ Transaction cancelled: ${transaction.id}, reason: ${reason}`);

  return {
    result: {
      transaction: transaction.id,
      cancel_time: cancelTime,
      state: newState
    }
  };
}

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

// ==================== CALLBACK URL ====================

app.get('/api/payment/callback', (req, res) => {
  const { order_id } = req.query;

  if (order_id) {
    const orders = readJSON(ORDERS_FILE, []);
    const order = orders.find(o => o.id === order_id);

    if (order) {
      return res.redirect(`${FRONTEND_URL}/order?payment_status=${order.payment_status}&order_id=${order_id}`);
    }
  }

  res.redirect(FRONTEND_URL);
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Texnokross API running on port ${PORT}`);
  console.log(`📁 Data stored in: ${DATA_DIR}`);
  console.log(`💳 Payme Mode: ${PAYME_TEST_MODE ? 'TEST' : 'PRODUCTION'}`);
  console.log(`💳 Payme Merchant ID: ${PAYME_MERCHANT_ID ? 'Configured' : 'NOT CONFIGURED!'}`);
  console.log(`🤖 Telegram Bot: ${TELEGRAM_BOT_TOKEN ? 'Configured' : 'NOT CONFIGURED!'}`);
});
