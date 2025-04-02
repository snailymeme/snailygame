/**
 * Единый скрипт запуска игры Snail to Riches
 * Этот скрипт последовательно запускает ngrok и бота с правильной конфигурацией
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execPromise = promisify(exec);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('========================================');
console.log('🐌 Запуск Snail to Riches');
console.log('========================================');

// Проверка доступности портов
async function checkPort(port) {
  try {
    const { stdout, stderr } = await execPromise(`lsof -i :${port} | grep LISTEN`);
    if (stdout) {
      console.log(`❌ Порт ${port} уже занят. Попытка освободить порт...`);
      return false;
    }
    return true;
  } catch (error) {
    // Если команда не нашла процессов, значит порт свободен
    return true;
  }
}

// Остановка процессов
async function killProcesses(processName) {
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows 
      ? `taskkill /F /IM ${processName} /T`
      : `pkill -f "${processName}"`;
    
    await execPromise(cmd);
    console.log(`✅ Процесс ${processName} остановлен.`);
  } catch (error) {
    console.log(`ℹ️ Процесс ${processName} не был найден для остановки.`);
  }
}

// Запуск ngrok в отдельном процессе и ожидание получения URL
async function startNgrok() {
  console.log('\n🚀 Запуск ngrok туннеля...');
  
  // Удаляем старый URL файл, если он существует
  if (fs.existsSync('ngrok-url.txt')) {
    fs.unlinkSync('ngrok-url.txt');
  }
  
  // Запускаем скрипт ngrok
  const ngrokProcess = spawn('node', ['run-ngrok.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  ngrokProcess.on('error', (error) => {
    console.error('❌ Ошибка при запуске ngrok:', error);
    process.exit(1);
  });
  
  // Ожидаем создания файла с URL (до 30 секунд)
  let attempts = 0;
  const maxAttempts = 30;
  let ngrokUrl = '';
  
  while (attempts < maxAttempts) {
    await sleep(1000);
    attempts++;
    
    if (fs.existsSync('ngrok-url.txt')) {
      try {
        ngrokUrl = fs.readFileSync('ngrok-url.txt', 'utf8').trim();
        if (ngrokUrl && ngrokUrl.startsWith('http')) {
          console.log(`🌐 Успешно получен URL ngrok: ${ngrokUrl}`);
          return ngrokUrl;
        }
      } catch (err) {
        console.log('⚠️ Ошибка при чтении файла URL, пробуем снова...');
      }
    }
    
    if (attempts % 5 === 0) {
      console.log(`⏳ Ожидание URL ngrok... (${attempts}/${maxAttempts})`);
    }
  }
  
  console.error('❌ Не удалось получить URL ngrok за отведенное время.');
  process.exit(1);
}

// Запуск бота
async function startBot(ngrokUrl) {
  console.log('\n🤖 Запуск Telegram бота...');
  
  if (!ngrokUrl) {
    console.error('❌ URL ngrok не предоставлен, не могу запустить бота.');
    process.exit(1);
  }
  
  // Устанавливаем переменную окружения с URL
  process.env.WEB_APP_URL = ngrokUrl;
  
  // Проверка порта перед запуском
  if (!(await checkPort(3000))) {
    await killProcesses('node bot.js');
    // Ждем, чтобы порт точно освободился
    await sleep(2000);
  }
  
  // Запускаем бота
  const botProcess = spawn('node', ['bot.js'], {
    stdio: 'inherit',
    shell: true,
    env: {...process.env}
  });
  
  botProcess.on('error', (error) => {
    console.error('❌ Ошибка при запуске бота:', error);
    process.exit(1);
  });
  
  await sleep(2000);
  console.log('\n✅ Приложение запущено! Открой свой Telegram бот и наслаждайся игрой.');
  console.log(`📱 URL для мини-приложения: ${ngrokUrl}`);
}

// Основная функция
async function main() {
  try {
    // Убиваем все процессы
    console.log('🧹 Очистка предыдущих процессов...');
    await killProcesses('node run-ngrok.js');
    await killProcesses('ngrok');
    await sleep(1000);
    await killProcesses('node bot.js');
    await sleep(2000);
    
    // Проверка портов
    if (!(await checkPort(3000))) {
      console.log('❌ Не удалось освободить порт 3000. Пожалуйста, закройте все использующие его программы.');
      process.exit(1);
    }
    
    // Запуск компонентов
    const ngrokUrl = await startNgrok();
    await startBot(ngrokUrl);
    
  } catch (error) {
    console.error('❌ Ошибка в процессе запуска:', error);
    process.exit(1);
  }
}

// Обработка завершения программы
process.on('SIGINT', async () => {
  console.log('\n👋 Завершение работы приложения...');
  await killProcesses('ngrok');
  await killProcesses('node run-ngrok.js');
  await killProcesses('node bot.js');
  console.log('Все процессы остановлены. До свидания!');
  process.exit(0);
});

// Запускаем основную функцию
main(); 