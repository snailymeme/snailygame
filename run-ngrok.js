const ngrok = require('ngrok');
const fs = require('fs');

console.log('=== ЗАПУСК NGROK ===');

// Функция очистки
async function cleanup() {
  try {
    console.log('>> Остановка предыдущих соединений...');
    await ngrok.kill();
    console.log('>> Соединения остановлены');
  } catch (err) {
    // Игнорируем ошибки
  }

  // Удаляем старый файл URL
  if (fs.existsSync('ngrok-url.txt')) {
    fs.unlinkSync('ngrok-url.txt');
    console.log('>> Удален старый файл URL');
  }
}

let ngrokProcess;

// Основная функция запуска
async function startNgrok() {
  try {
    // Очистка
    await cleanup();
    
    // Указываем порт 3001 вместо 3000
    const port = 3001;
    
    // Запуск туннеля
    console.log('>> Запуск туннеля...');
    const url = await ngrok.connect({
      addr: port,
      authtoken: '2vB1076Y3cPh8Kif6NVuDIV8eAi_2Vnu9ZFtY3SQSQ4bUQCj1'
    });
    
    // Сохранение URL
    fs.writeFileSync('ngrok-url.txt', url);
    
    console.log(`>> УСПЕХ! URL: ${url}`);
    console.log('>> URL сохранен в ngrok-url.txt');
    
    // Держим процесс запущенным
    console.log('>> Нажмите Ctrl+C для остановки');
    
    // Обработка завершения
    process.on('SIGINT', async () => {
      console.log('>> Остановка ngrok...');
      await ngrok.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`>> ОШИБКА: ${error.message}`);
    process.exit(1);
  }
}

// Запуск
startNgrok(); 