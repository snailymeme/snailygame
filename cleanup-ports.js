/**
 * Скрипт для принудительной очистки портов
 * Останавливает все процессы, использующие порты 3000 и 3001
 */

const { execSync } = require('child_process');
const os = require('os');

// Порты, которые нужно освободить
const ports = [3000, 3001];

// Определяем команду в зависимости от ОС
function getKillCommand(port) {
    const platform = os.platform();
    
    if (platform === 'win32') {
        // Windows
        return `FOR /F "tokens=5" %P IN ('netstat -ano ^| find ":${port}" ^| find "LISTENING"') DO taskkill /F /PID %P`;
    } else if (platform === 'darwin' || platform === 'linux') {
        // MacOS или Linux
        return `lsof -ti :${port} | xargs -r kill -9`;
    } else {
        console.error(`Неподдерживаемая платформа: ${platform}`);
        return null;
    }
}

// Остановка ngrok
console.log('🧹 Остановка ngrok...');
try {
    if (os.platform() === 'win32') {
        execSync('taskkill /F /IM ngrok.exe /T', { stdio: 'ignore' });
    } else {
        execSync('pkill -f ngrok', { stdio: 'ignore' });
    }
    console.log('✅ ngrok остановлен');
} catch (error) {
    console.log('ℹ️ ngrok не запущен или уже остановлен');
}

// Освобождаем порты
console.log('🧹 Освобождение портов...');

ports.forEach(port => {
    const command = getKillCommand(port);
    
    if (!command) return;
    
    try {
        console.log(`🔍 Поиск и остановка процессов на порту ${port}...`);
        execSync(command, { stdio: 'ignore' });
        console.log(`✅ Порт ${port} освобожден`);
    } catch (error) {
        console.log(`ℹ️ Порт ${port} не занят или уже освобожден`);
    }
});

// Остановка всех процессов node bot.js и start-app.js
console.log('🧹 Остановка всех процессов node...');
try {
    if (os.platform() === 'win32') {
        execSync('taskkill /F /FI "IMAGENAME eq node.exe" /T', { stdio: 'ignore' });
    } else {
        execSync('pkill -f "node (bot\\.js|start-app\\.js|run-ngrok\\.js)"', { stdio: 'ignore' });
    }
    console.log('✅ Все процессы node остановлены');
} catch (error) {
    console.log('ℹ️ Процессы node не найдены или уже остановлены');
}

console.log('🎉 Очистка завершена. Порты 3000 и 3001 готовы к использованию.'); 