const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const app = express();

// Конфигурация бота
const BOT_TOKEN = '7686647298:AAGmRnfGceCksKJUu8jk0e1dZOakgkn_V1s';

// Пытаемся прочитать URL из файла, если он существует
let fileUrl = '';
try {
  if (fs.existsSync('ngrok-url.txt')) {
    // Читаем файл и удаляем все непечатаемые символы и пробелы в начале и конце
    fileUrl = fs.readFileSync('ngrok-url.txt', 'utf8')
      .trim()
      .replace(/[^\x20-\x7E]/g, ''); // Удаляем все непечатаемые ASCII символы
    
    console.log(`URL прочитан из файла: ${fileUrl}`);
  }
} catch (error) {
  console.error('Ошибка при чтении файла с URL:', error);
}

// Приоритет: 1) переменная окружения, 2) URL из файла, 3) URL по умолчанию
const WEB_APP_URL = process.env.WEB_APP_URL || fileUrl || 'https://your-ngrok-url-here.ngrok-free.app';

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await bot.sendMessage(chatId, 'Привет! Добро пожаловать в игру "Улитка к богатству"!', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "🎮 Играть",
                        web_app: { url: WEB_APP_URL }
                    }
                ]]
            }
        });
    } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Бот запущен и слушает порт 3000');
    console.log(`Используется URL для Web App: ${WEB_APP_URL}`);
    console.log('Если вы хотите использовать другой URL, запустите бота с переменной окружения:');
    console.log('WEB_APP_URL=https://your-url.ngrok-free.app npm run bot');
}); 