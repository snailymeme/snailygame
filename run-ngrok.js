const ngrok = require('ngrok');
const fs = require('fs');

(async function() {
  try {
    // Запускаем ngrok с вашим токеном
    const url = await ngrok.connect({
      authtoken: '2vB1076Y3cPh8Kif6NVuDIV8eAi_2Vnu9ZFtY3SQSQ4bUQCj1',
      addr: 8080
    });
    
    console.log(`Ngrok запущен! URL: ${url}`);
    console.log('Используйте этот URL в файле bot.js для WEB_APP_URL');
    
    // Сохраняем URL в файл для удобства, убедившись, что он чистый
    const cleanUrl = url.trim();
    fs.writeFileSync('ngrok-url.txt', cleanUrl);
    
    console.log('URL также сохранен в файл ngrok-url.txt');
    console.log('Для остановки ngrok нажмите Ctrl+C');
    
    // Ожидаем, пока пользователь не завершит процесс
    process.on('SIGINT', async () => {
      console.log('Останавливаем ngrok...');
      await ngrok.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error('Ошибка при запуске ngrok:', error);
    process.exit(1);
  }
})(); 