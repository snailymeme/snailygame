#!/usr/bin/env node

/**
 * Единый скрипт запуска для Snail to Riches
 * Объединяет функциональность всех других скриптов в один с параметрами
 */

const { spawn, exec, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Получаем аргументы командной строки
const args = process.argv.slice(2);
const MODE = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'full';
const CLEAN = args.includes('--clean');
const HELP = args.includes('--help') || args.includes('-h');

// Показываем справку и выходим, если запрошена помощь
if (HELP) {
    console.log(`
Snail to Riches - Единый скрипт запуска

Использование:
  node start.js [options]

Опции:
  --mode=<режим>  Режим запуска (full, app, bot, ngrok)
  --clean         Очистить порты и кэш перед запуском
  --help, -h      Показать эту справку

Режимы:
  full   Запустить все компоненты (по умолчанию)
  app    Запустить только HTTP сервер
  bot    Запустить только Telegram бота
  ngrok  Запустить только ngrok туннель
    `);
    process.exit(0);
}

console.log('========================================');
console.log('🐌 Запуск Snail to Riches');
console.log('========================================');
console.log(`Режим: ${MODE}, Очистка: ${CLEAN ? 'Да' : 'Нет'}`);

// Остановка процессов по имени
function killProcess(name) {
    return new Promise((resolve) => {
        console.log(`🧹 Попытка остановки процесса: ${name}`);
        
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

// Проверка и освобождение портов
async function cleanupPorts() {
    console.log('🧹 Очистка занятых портов...');
    
    // Список портов для очистки
    const ports = [3000, 3001, 4040];
    
    for (const port of ports) {
        console.log(`Проверка порта ${port}...`);
        
        // Находим процесс, использующий порт
        const findCmd = process.platform === 'win32'
            ? `netstat -ano | findstr :${port}`
            : `lsof -i :${port} | grep LISTEN`;
        
        try {
            const { stdout } = await exec(findCmd);
            
            if (stdout) {
                console.log(`Порт ${port} занят.`);
                
                // Получаем PID процесса
                let pid;
                if (process.platform === 'win32') {
                    // Windows: результат будет что-то вроде "TCP    127.0.0.1:3000    LISTENING    1234"
                    pid = stdout.trim().split(/\s+/).pop();
                } else {
                    // UNIX-подобные: результат будет что-то вроде "node    1234    user    15u    ..."
                    pid = stdout.trim().split(/\s+/)[1];
                }
                
                if (pid) {
                    // Убиваем процесс
                    const killCmd = process.platform === 'win32'
                        ? `taskkill /F /PID ${pid}`
                        : `kill -9 ${pid}`;
                    
                    await exec(killCmd);
                    console.log(`✅ Процесс с PID ${pid} на порту ${port} остановлен`);
                }
            } else {
                console.log(`Порт ${port} свободен`);
            }
        } catch (error) {
            // Если команда завершилась с ошибкой, скорее всего порт свободен
            console.log(`Порт ${port} свободен`);
        }
    }
}

// Запуск HTTP сервера
function startServer() {
    console.log('🚀 Запуск HTTP сервера...');
    return spawn('npx', ['http-server', '.', '-p', '3000'], {
        stdio: 'inherit'
    });
}

// Запуск ngrok
function startNgrok() {
    console.log('🚀 Запуск ngrok...');
    
    // Удаляем старый URL-файл если существует
    if (fs.existsSync('ngrok-url.txt')) {
        fs.unlinkSync('ngrok-url.txt');
    }
    
    return new Promise((resolve) => {
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
    console.log('🤖 Запуск Telegram бота...');
    
    const env = { ...process.env };
    if (ngrokUrl) {
        env.NGROK_URL = ngrokUrl;
    }
    
    return spawn('node', ['bot.js'], {
        stdio: 'inherit',
        env
    });
}

// Очистка временных файлов
function cleanupFiles() {
    console.log('🧹 Очистка временных файлов...');
    
    const filesToRemove = [
        'ngrok-url.txt',
        'ngrok_output.txt'
    ];
    
    filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`✅ Файл ${file} удален`);
        }
    });
}

// Главная функция
async function main() {
    try {
        // Очистка, если запрошена
        if (CLEAN) {
            await cleanupPorts();
            cleanupFiles();
            
            // Убиваем все процессы
            await killProcess('ngrok');
            await killProcess('node bot.js');
            await killProcess('http-server');
            
            // Ждем чтобы процессы завершились
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        let serverProcess, ngrokData, botProcess;
        
        // Запуск в зависимости от режима
        switch (MODE) {
            case 'full':
                // Запускаем все компоненты
                serverProcess = startServer();
                ngrokData = await startNgrok();
                botProcess = startBot(ngrokData.url);
                break;
                
            case 'app':
                // Только HTTP сервер
                serverProcess = startServer();
                break;
                
            case 'bot':
                // Только бот
                botProcess = startBot();
                break;
                
            case 'ngrok':
                // Только ngrok
                ngrokData = await startNgrok();
                break;
                
            default:
                console.error(`❌ Неизвестный режим: ${MODE}`);
                process.exit(1);
        }
        
        console.log('========================================');
        console.log('✅ Компоненты успешно запущены!');
        if (ngrokData?.url) {
            console.log(`🌐 URL: ${ngrokData.url}`);
        }
        console.log('========================================');
        
        // Обработка завершения
        process.on('SIGINT', async () => {
            console.log('🛑 Завершение работы...');
            
            // Останавливаем запущенные процессы
            if (serverProcess) serverProcess.kill();
            if (ngrokData?.process) ngrokData.process.kill();
            if (botProcess) botProcess.kill();
            
            // Дополнительная очистка
            await killProcess('ngrok');
            await killProcess('node bot.js');
            await killProcess('http-server');
            
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