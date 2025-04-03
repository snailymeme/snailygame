/**
 * Комплексный скрипт запуска Snail to Riches
 * Запускает HTTP сервер, ngrok и бота Telegram в одном процессе
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const ngrok = require('ngrok');
const TelegramBot = require('node-telegram-bot-api');

// Конфигурация
const PORT = 3001;
const BOT_TOKEN = '7686647298:AAGmRnfGceCksKJUu8jk0e1dZOakgkn_V1s';
const NGROK_AUTH_TOKEN = '2vB1076Y3cPh8Kif6NVuDIV8eAi_2Vnu9ZFtY3SQSQ4bUQCj1';

// Очистка процессов
async function cleanup() {
  console.log('🧹 Очистка предыдущих процессов...');

  try {
    await ngrok.kill();
    console.log('✅ ngrok остановлен');
  } catch (error) {
    console.log('ℹ️ ngrok не запущен или уже остановлен');
  }

  try {
    if (process.platform === 'win32') {
      exec('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
    } else {
      exec('pkill -f "node start-full\\.js"', { stdio: 'ignore' });
    }
  } catch (error) {
    // Игнорируем ошибки при очистке
  }
}

// Запуск сервера Express
function startServer() {
  return new Promise((resolve) => {
    console.log('🚀 Запуск HTTP сервера...');
    
    const app = express();
    app.use(express.static(path.join(__dirname)));
    
    const server = app.listen(PORT, () => {
      console.log(`✅ HTTP сервер запущен на порту ${PORT}`);
      resolve(server);
    });
  });
}

// Запуск Ngrok
async function startNgrok() {
  console.log('🚀 Запуск ngrok...');
  
  try {
    // Запуск туннеля
    const url = await ngrok.connect({
      addr: PORT,
      authtoken: NGROK_AUTH_TOKEN
    });
    
    console.log(`✅ ngrok запущен с URL: ${url}`);
    
    // Сохраняем URL в файл для бота
    fs.writeFileSync('ngrok-url.txt', url);
    
    return url;
  } catch (error) {
    console.error('❌ Ошибка при запуске ngrok:', error);
    throw error;
  }
}

// Запуск Telegram бота
function startBot(url) {
  console.log('🤖 Запуск Telegram бота...');
  
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  
  // Обработка команды /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (url) {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🎮 Играть',
            web_app: { url }
          }
        ]]
      };
      
      bot.sendMessage(chatId, 'Привет! Готов играть в Snail to Riches?', {
        reply_markup: keyboard
      });
      
      console.log(`✅ Отправлена ссылка на игру пользователю ${msg.from.username || msg.from.id}`);
    } else {
      console.error('❌ Ошибка отправки сообщения: Нет доступного URL');
      bot.sendMessage(chatId, 'Извините, игра временно недоступна. Попробуйте позже.');
    }
  });
  
  console.log('✅ Telegram бот запущен');
  return bot;
}

// Главная функция
async function main() {
  console.log('========================================');
  console.log('🐌 Запуск Snail to Riches');
  console.log('========================================');
  
  try {
    // Очистка
    await cleanup();
    
    // Запуск сервера
    const server = await startServer();
    
    // Запуск ngrok
    const url = await startNgrok();
    
    // Запуск бота
    const bot = startBot(url);
    
    console.log('========================================');
    console.log('✅ Приложение успешно запущено!');
    console.log(`🌐 URL: ${url}`);
    console.log('========================================');
    
    // Обработка завершения
    process.on('SIGINT', async () => {
      console.log('🛑 Завершение работы...');
      
      try {
        await ngrok.kill();
        console.log('✅ ngrok остановлен');
      } catch (error) {
        console.error('❌ Ошибка при остановке ngrok:', error);
      }
      
      if (bot) {
        bot.stopPolling();
        console.log('✅ Бот остановлен');
      }
      
      if (server) {
        server.close(() => {
          console.log('✅ HTTP сервер остановлен');
          console.log('👋 До свидания!');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Запуск
main(); 