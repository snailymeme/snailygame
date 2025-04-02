const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Bot configuration
const BOT_TOKEN = '7686647298:AAGmRnfGceCksKJUu8jk0e1dZOakgkn_V1s';

// Try to read URL from file if it exists
let fileUrl = '';
try {
  if (fs.existsSync('ngrok-url.txt')) {
    // Read file and remove all non-printable characters and spaces at the beginning and end
    fileUrl = fs.readFileSync('ngrok-url.txt', 'utf8')
      .trim()
      .replace(/[^\x20-\x7E]/g, ''); // Remove all non-printable ASCII characters
    
    console.log(`URL read from file: ${fileUrl}`);
  }
} catch (error) {
  console.error('Error reading URL file:', error);
}

// Priority: 1) environment variable, 2) URL from file, 3) default URL
const WEB_APP_URL = process.env.WEB_APP_URL || fileUrl || 'https://your-ngrok-url-here.ngrok-free.app';

// Bot initialization
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Обслуживание статических файлов из текущей директории
app.use(express.static(__dirname));

// Добавляем обработчик для корневого маршрута
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Добавляем обработчик для всех остальных маршрутов (fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await bot.sendMessage(chatId, 'Hello! Welcome to the "Snail to Riches" game!', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🎮 Play",
                            web_app: { url: WEB_APP_URL }
                        }
                    ]
                ]
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        await bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

// Start server
app.listen(3000, () => {
    console.log('Bot started and listening on port 3000');
    console.log(`Using URL for Web App: ${WEB_APP_URL}`);
    console.log('If you want to use a different URL, run the bot with environment variable:');
    console.log('WEB_APP_URL=https://your-url.ngrok-free.app npm run bot');
}); 