/**
 * Скрипт для полного сброса ngrok сессий
 * Останавливает все локальные процессы ngrok и пытается сбросить удаленные сессии
 */

const { exec, execSync } = require('child_process');
const ngrok = require('ngrok');
const https = require('https');
const readline = require('readline');

const API_TOKEN = '2vB1076Y3cPh8Kif6NVuDIV8eAi_2Vnu9ZFtY3SQSQ4bUQCj1';

console.log('🧹 Сброс всех ngrok соединений...');

// Функция для ожидания пользовательского ввода
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

// Остановка локальных процессов
async function killLocalProcesses() {
  console.log('Остановка локальных процессов ngrok...');
  
  try {
    // Пытаемся остановить через API
    await ngrok.kill();
    console.log('✅ Ngrok процессы остановлены через API');
  } catch (e) {
    console.log('⚠️ Не удалось остановить ngrok через API:', e.message);
  }
  
  try {
    if (process.platform !== 'win32') {
      // Для Linux и macOS
      execSync('pkill -f ngrok');
    } else {
      // Для Windows
      execSync('taskkill /F /IM ngrok.exe');
    }
    console.log('✅ Ngrok процессы остановлены через OS');
  } catch (e) {
    console.log('ℹ️ Локальные процессы ngrok не найдены или не могут быть остановлены');
  }
}

// Инструкции по сбросу сессий через интерфейс ngrok
async function showResetInstructions() {
  console.log('\n📋 Инструкции по сбросу сессий через dashboard:');
  console.log('1. Перейдите на https://dashboard.ngrok.com/agents');
  console.log('2. Войдите в свой аккаунт ngrok если потребуется');
  console.log('3. Найдите и остановите все активные сессии, нажав кнопку "Disconnect"');
  console.log('4. Вернитесь сюда и нажмите Enter для продолжения');
  
  await askQuestion('\nНажмите Enter после выполнения этих шагов...');
}

// Очистка локальных файлов ngrok
function cleanLocalFiles() {
  const fs = require('fs');
  
  console.log('\nОчистка локальных файлов ngrok...');
  
  try {
    // Удаляем файл с URL
    if (fs.existsSync('ngrok-url.txt')) {
      fs.unlinkSync('ngrok-url.txt');
      console.log('✅ Файл ngrok-url.txt удален');
    }
    
    // Удаляем конфиг файл, если он есть
    if (fs.existsSync('ngrok.yml')) {
      fs.unlinkSync('ngrok.yml');
      console.log('✅ Файл ngrok.yml удален');
    }
    
    // Удаляем лог файлы, если они есть
    const files = fs.readdirSync('.');
    for (const file of files) {
      if (file.startsWith('ngrok-') && file.endsWith('.log')) {
        fs.unlinkSync(file);
        console.log(`✅ Файл ${file} удален`);
      }
    }
  } catch (e) {
    console.error('❌ Ошибка при очистке файлов:', e.message);
  }
}

// Основная функция
async function main() {
  try {
    // Шаг 1: Остановка локальных процессов
    await killLocalProcesses();
    
    // Шаг 2: Инструкции по сбросу через интерфейс
    await showResetInstructions();
    
    // Шаг 3: Очистка локальных файлов
    cleanLocalFiles();
    
    console.log('\n✅ Сброс ngrok завершен успешно!');
    console.log('Теперь вы можете запустить приложение заново используя команду:');
    console.log('node start-app.js\n');
    
  } catch (error) {
    console.error('❌ Ошибка при сбросе ngrok:', error);
  }
}

main(); 