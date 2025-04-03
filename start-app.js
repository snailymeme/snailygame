/**
 * Единый скрипт запуска игры Snail to Riches
 * Этот скрипт последовательно запускает ngrok и бота с правильной конфигурацией
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const express = require('express');

console.log('========================================');
console.log('🐌 Запуск Snail to Riches');
console.log('========================================');

// Порт для HTTP сервера
const port = 3000;
const app = express();

// Настройка статических файлов
app.use(express.static(__dirname));

// Остановка процессов по имени
function killProcess(name) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `taskkill /F /IM ${name} /T`
      : `pkill -f "${name}"`;
    
    exec(cmd, (error) => {
      if (error) {
        console.log(`ℹ️ Процесс ${name} не найден или уже остановлен`);
      } else {
        console.log(`✅ Процесс ${name} остановлен`);
      }
      resolve();
    });
  });
}

// Очистка предыдущих процессов
async function cleanup() {
  console.log('🧹 Очистка предыдущих процессов...');
  await killProcess('ngrok');
  await killProcess('node bot.js');
  // Ждем чтобы процессы завершились
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Запуск HTTP сервера
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`✅ HTTP сервер запущен на порту ${port}`);
      resolve(server);
    });
  });
}

// Простой запуск ngrok
function startNgrok() {
  return new Promise((resolve) => {
    console.log('🚀 Запуск ngrok...');
    
    // Удаляем старый URL-файл если существует
    if (fs.existsSync('ngrok-url.txt')) {
      fs.unlinkSync('ngrok-url.txt');
    }
    
    const ngrokProcess = spawn('node', ['run-ngrok.js'], {
      stdio: 'inherit'
    });
    
    // Функция для проверки создания файла с URL
    const checkUrlFile = () => {
      if (fs.existsSync('ngrok-url.txt')) {
        try {
          const url = fs.readFileSync('ngrok-url.txt', 'utf8').trim();
          if (url) {
            console.log(`✅ ngrok URL: ${url}`);
            resolve({ process: ngrokProcess, url });
            return;
          }
        } catch (e) {}
      }
      
      // Если файла нет, проверяем снова через секунду
      setTimeout(checkUrlFile, 1000);
    };
    
    // Начинаем проверки через 3 секунды
    setTimeout(checkUrlFile, 3000);
  });
}

// Запуск Telegram бота
function startBot(ngrokUrl) {
  return new Promise((resolve) => {
    console.log('🤖 Запуск Telegram бота...');
    
    const botProcess = spawn('node', ['bot.js'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NGROK_URL: ngrokUrl
      }
    });
    
    botProcess.on('error', (error) => {
      console.error(`❌ Ошибка при запуске бота: ${error.message}`);
    });
    
    // Даем время боту инициализироваться
    setTimeout(() => {
      console.log('✅ Telegram бот запущен');
      resolve(botProcess);
    }, 2000);
  });
}

// Главная функция
async function main() {
  try {
    // Очистка
    await cleanup();
    
    // Запуск сервера
    const server = await startServer();
    
    // Запуск ngrok
    const { url } = await startNgrok();
    
    // Запуск бота
    await startBot(url);
    
    console.log('========================================');
    console.log('✅ Приложение успешно запущено!');
    console.log(`🌐 URL: ${url}`);
    console.log('========================================');
    
    // Обработка завершения
    process.on('SIGINT', async () => {
      console.log('🛑 Завершение работы...');
      await killProcess('ngrok');
      await killProcess('node bot.js');
      server.close();
      console.log('👋 До свидания!');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Запуск
main(); 