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
      PAYME_MERCHANT_ID: '694a411d30511f18816ddf45', // ID мерчанта (получите в кабинете)
      PAYME_SECRET_KEY: '4??45nwPdhSDzN7DCfvd4qMvhD#fuYwT0bIy', // Ключ для продакшена
      PAYME_SECRET_KEY_TEST: 'yBv?6tS4jCd6oAbBj&Of2xW%1EJVe9mJJWfx', // Ключ для тестов
      PAYME_TEST_MODE: 'true', // Переключить на 'false' для продакшена
      
      // Frontend URL для редиректа после оплаты
      FRONTEND_URL: 'https://texnokross.uz'
    }
  }]
};
