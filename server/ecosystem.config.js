module.exports = {
  apps: [{
    name: 'texnokross-api',
    script: 'index.js',
    env: {
      // Telegram
      TELEGRAM_BOT_TOKEN: '8095102367:AAERemO07E-9MrxmAFi1ypuNDLWUgK3rW-Y',
      TELEGRAM_CHAT_ID: '1273160896',
      
      // Server
      PORT: 3001,
      
      // Payme Configuration
      // ВАЖНО: Замените на свои данные из личного кабинета Payme Business
      // https://business.payme.uz/
      PAYME_MERCHANT_ID: '', // ID мерчанта (получите в кабинете)
      PAYME_SECRET_KEY: '', // Ключ для продакшена
      PAYME_SECRET_KEY_TEST: '', // Ключ для тестов
      PAYME_TEST_MODE: 'true', // Переключить на 'false' для продакшена
      
      // Frontend URL для редиректа после оплаты
      FRONTEND_URL: 'https://your-domain.uz'
    },
    
    // Production environment
    env_production: {
      NODE_ENV: 'production',
      TELEGRAM_BOT_TOKEN: '8095102367:AAERemO07E-9MrxmAFi1ypuNDLWUgK3rW-Y',
      TELEGRAM_CHAT_ID: '1273160896',
      PORT: 3001,
      
      PAYME_MERCHANT_ID: '', // Ваш Merchant ID
      PAYME_SECRET_KEY: '', // Ваш секретный ключ
      PAYME_SECRET_KEY_TEST: '',
      PAYME_TEST_MODE: 'false', // В продакшене - false
      
      FRONTEND_URL: 'https://your-domain.uz'
    }
  }]
};
