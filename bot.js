const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Конфигурация
const BOT_TOKEN = '7686647298:AAGmRnfGceCksKJUu8jk0e1dZOakgkn_V1s';
const PORT = 3001;

// Создаем Express приложение
const app = express();

// Настройка статических файлов
app.use(express.static(path.join(__dirname)));

// Создаем бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Функция для чтения URL из файла
async function getWebAppUrl() {
  try {
    if (fs.existsSync('ngrok-url.txt')) {
      const url = fs.readFileSync('ngrok-url.txt', 'utf8').trim();
      console.log('Read URL from file:', url);
      return url;
    }
  } catch (error) {
    console.error('Error reading URL file:', error);
  }
  return null;
}

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = await getWebAppUrl();
  
  if (webAppUrl) {
    const keyboard = {
      inline_keyboard: [[
        {
          text: '🎮 Играть',
          web_app: { url: webAppUrl }
        }
      ]]
    };
    
    bot.sendMessage(chatId, 'Привет! Готов играть в Snail to Riches?', {
      reply_markup: keyboard
    });
  } else {
    console.error('Error sending message: No valid Web App URL available');
    bot.sendMessage(chatId, 'Извините, игра временно недоступна. Попробуйте позже.');
  }
});

// Запускаем сервер
console.log('Starting bot...');
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Функция для проверки доступности URL
async function isUrlAccessible(url) {
  try {
    const response = await axios.get(url, {
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });
    return response.status === 200;
  } catch (error) {
    console.error('Error checking URL:', error.message);
    return false;
  }
}

// Глобальная переменная для хранения текущего URL
let currentWebAppUrl = null;

// Функция для обновления URL
async function updateWebAppUrl() {
  const newUrl = await getWebAppUrl();
  if (newUrl && newUrl !== currentWebAppUrl) {
    currentWebAppUrl = newUrl;
    console.log(`Web App URL updated to: ${currentWebAppUrl}`);
    return true;
  }
  return false;
}

// Периодическая проверка URL
const urlCheckInterval = setInterval(async () => {
  if (!currentWebAppUrl) {
    await updateWebAppUrl();
  }
}, 5000);

// Запускаем процесс получения URL
(async () => {
    console.log('Starting bot...');
    for (let i = 0; i < 5; i++) {
        if (await updateWebAppUrl()) {
            console.log('Bot successfully started with URL:', currentWebAppUrl);
            return;
        }
        console.log('Waiting for valid URL...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('Bot started without initial URL, will keep trying in background');
})(); 