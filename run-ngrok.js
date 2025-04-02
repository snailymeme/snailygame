const ngrok = require('ngrok');
const fs = require('fs');
const { execSync } = require('child_process');

// Функция для очистки URL от всех нежелательных символов
function cleanUrl(url) {
  if (!url) return '';
  
  // Удаляем все непечатаемые символы и пробелы по краям
  let cleaned = url.trim()
    .replace(/[^\x20-\x7E]/g, '') // Удаляем непечатаемые ASCII символы
    .replace(/%+$/, ''); // Удаляем % в конце URL
  
  // Проверяем, что URL правильно сформирован
  if (!cleaned.startsWith('http')) {
    console.error('Warning: URL does not start with http');
    return '';
  }
  
  return cleaned;
}

// Принудительно останавливаем все процессы ngrok
function killAllNgrokProcesses() {
  try {
    console.log('Killing all ngrok processes...');
    
    // Пытаемся остановить через API
    try {
      ngrok.kill();
    } catch (e) {
      console.log('API kill failed, trying process kill');
    }
    
    // Для macOS и Linux
    if (process.platform !== 'win32') {
      try {
        execSync('pkill -f ngrok');
        console.log('All ngrok processes killed via pkill');
      } catch (e) {
        // Игнорируем ошибку, если процессы не найдены
      }
    } 
    // Для Windows
    else {
      try {
        execSync('taskkill /f /im ngrok.exe');
        console.log('All ngrok processes killed via taskkill');
      } catch (e) {
        // Игнорируем ошибку, если процессы не найдены
      }
    }
    
    // Ждем немного, чтобы процессы точно завершились
    return new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    console.warn('Error killing ngrok processes:', error.message);
    // Все равно продолжаем, даже если не смогли убить процессы
    return Promise.resolve();
  }
}

(async function() {
  try {
    // Остановить все процессы ngrok
    await killAllNgrokProcesses();
    
    // Небольшая задержка после остановки
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Запускаем ngrok с вашим токеном на порт 3000
    console.log('Starting ngrok tunnel on port 3000...');
    const url = await ngrok.connect({
      authtoken: '2vB1076Y3cPh8Kif6NVuDIV8eAi_2Vnu9ZFtY3SQSQ4bUQCj1',
      addr: 3000,
      onStatusChange: (status) => {
        console.log('Ngrok status changed:', status);
      }
    });
    
    // Очищаем URL от возможных проблемных символов
    const cleanedUrl = cleanUrl(url);
    
    if (!cleanedUrl) {
      throw new Error('Failed to get a valid ngrok URL');
    }
    
    console.log(`Ngrok tunnel started successfully! URL: ${cleanedUrl}`);
    
    // Сохраняем URL в файл
    fs.writeFileSync('ngrok-url.txt', cleanedUrl);
    console.log('URL saved to ngrok-url.txt');
    
    // Проверка: перечитываем URL из файла для подтверждения
    const savedUrl = fs.readFileSync('ngrok-url.txt', 'utf8').trim();
    console.log(`Verified saved URL: ${savedUrl}`);
    
    process.on('SIGINT', async () => {
      console.log('Stopping ngrok...');
      await ngrok.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error starting ngrok:', error);
    process.exit(1);
  }
})(); 