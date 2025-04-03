const ngrok = require('ngrok');
const fs = require('fs');
const axios = require('axios');

// Функция для проверки доступности URL
async function isUrlAccessible(url) {
  try {
    console.log('Checking URL:', url);
    const response = await axios.get(url, {
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      }),
      timeout: 5000
    });
    console.log('URL response status:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('Error checking URL:', error.message);
    return false;
  }
}

// Функция для сохранения URL в файл
async function saveUrlToFile(url) {
  try {
    console.log('Waiting before URL check...');
    // Ждем 5 секунд перед первой проверкой
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Checking URL availability:', url);
    // Проверяем доступность URL
    if (await isUrlAccessible(url)) {
      fs.writeFileSync('ngrok-url.txt', url);
      console.log(`URL successfully saved to ngrok-url.txt: ${url}`);
      return true;
    } else {
      throw new Error('URL not accessible');
    }
  } catch (error) {
    console.error('Error saving URL:', error.message);
    return false;
  }
}

// Функция для завершения всех процессов ngrok
async function killAllNgrokProcesses() {
  console.log('Killing all ngrok processes...');
  try {
    await ngrok.kill();
    // Даем время на завершение процессов
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('All ngrok processes killed');
  } catch (error) {
    console.error('Error killing ngrok processes:', error.message);
  }
}

// Основная функция запуска ngrok
async function startNgrok() {
  const maxAttempts = 3;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await killAllNgrokProcesses();
      
      console.log('Starting ngrok tunnel...');
      const url = await ngrok.connect({
        addr: 3000,
        proto: 'http',
        onStatusChange: status => {
          console.log('Ngrok status:', status);
        },
        authtoken: process.env.NGROK_AUTH_TOKEN || '2vB1076Y3cPh8Kif6NVuDIV8eAi_2Vnu9ZFtY3SQSQ4bUQCj1',
        configPath: './ngrok.yml'
      });
      
      console.log(`Ngrok tunnel started! URL: ${url}`);
      
      if (await saveUrlToFile(url)) {
        console.log('Ngrok setup completed successfully');
        return true;
      }
      
      throw new Error('Failed to save URL');
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxAttempts) {
        console.log(`Retrying in 5 seconds... (${maxAttempts - attempt} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('Failed to start ngrok after multiple attempts');
        process.exit(1);
      }
    }
  }
  return false;
}

// Запускаем ngrok
startNgrok(); 