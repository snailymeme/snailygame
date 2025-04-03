/**
 * Debug Helper - инструменты для отладки и диагностики проблем в приложении
 */

// Создаем глобальный объект для хранения информации отладки
window.debugInfo = {
    telegramAvailable: false,
    webAppInitialized: false,
    domLoaded: false,
    appInitialized: false,
    errors: [],
    warnings: []
};

// Инициализация отладчика
function initDebugHelper() {
    console.log('Initializing debug helper...');
    
    // Перехватываем ошибки консоли
    const originalConsoleError = console.error;
    console.error = function() {
        // Добавляем ошибку в наш список
        const errorArgs = Array.from(arguments).map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        window.debugInfo.errors.push({
            timestamp: new Date().toISOString(),
            message: errorArgs
        });
        
        // Вызываем оригинальную функцию
        originalConsoleError.apply(console, arguments);
    };
    
    // Перехватываем предупреждения
    const originalConsoleWarn = console.warn;
    console.warn = function() {
        // Добавляем предупреждение в наш список
        const warnArgs = Array.from(arguments).map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        window.debugInfo.warnings.push({
            timestamp: new Date().toISOString(),
            message: warnArgs
        });
        
        // Вызываем оригинальную функцию
        originalConsoleWarn.apply(console, arguments);
    };
    
    // Создаем глобальные обработчики ошибок
    window.onerror = function(message, source, lineno, colno, error) {
        window.debugInfo.errors.push({
            timestamp: new Date().toISOString(),
            type: 'global error',
            message: message,
            source: source,
            line: lineno,
            column: colno,
            stack: error ? error.stack : 'No stack trace'
        });
        
        return false; // Продолжаем обработку ошибки другими обработчиками
    };
    
    // Обрабатываем необработанные отклонения промисов
    window.addEventListener('unhandledrejection', function(event) {
        window.debugInfo.errors.push({
            timestamp: new Date().toISOString(),
            type: 'unhandled promise rejection',
            reason: event.reason ? (event.reason.message || String(event.reason)) : 'Unknown reason',
            stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack trace'
        });
    });
    
    // Проверяем наличие Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.debugInfo.telegramAvailable = true;
        
        // Добавляем информацию о Telegram WebApp
        window.debugInfo.telegramInfo = {
            version: window.Telegram.WebApp.version,
            platform: window.Telegram.WebApp.platform,
            colorScheme: window.Telegram.WebApp.colorScheme,
            themeParams: window.Telegram.WebApp.themeParams,
            viewportHeight: window.Telegram.WebApp.viewportHeight,
            viewportStableHeight: window.Telegram.WebApp.viewportStableHeight
        };
    }
    
    // Показываем кнопку отладки
    showDebugButton();
    
    // Отмечаем, что отладчик инициализирован
    window.debugInfo.debugInitialized = true;
    console.log('Debug helper initialized');
}

// Функция для показа кнопки отладки
function showDebugButton() {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Info';
    debugButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; background-color: rgba(255,0,0,0.7); color: white; border: none; border-radius: 5px; padding: 5px 10px; font-size: 14px;';
    
    debugButton.addEventListener('click', showDebugInfo);
    
    document.body.appendChild(debugButton);
}

// Функция для отображения информации отладки
function showDebugInfo() {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; overflow: auto; color: white; font-family: monospace;';
    
    // Создаем контент
    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px; max-width: 800px; margin: 20px auto; background: #222; border-radius: 5px;';
    
    // Добавляем заголовок
    const title = document.createElement('h2');
    title.textContent = 'Debug Information';
    title.style.cssText = 'margin-top: 0; color: #ff5555;';
    content.appendChild(title);
    
    // Добавляем общую информацию
    const generalInfo = document.createElement('div');
    generalInfo.innerHTML = `
        <h3>General Info</h3>
        <pre>${JSON.stringify({
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio,
            timestamp: new Date().toISOString(),
            telegramAvailable: window.debugInfo.telegramAvailable,
            domLoaded: window.debugInfo.domLoaded,
            appInitialized: window.debugInfo.appInitialized
        }, null, 2)}</pre>
        
        <h3>Telegram Info</h3>
        <pre>${JSON.stringify(window.debugInfo.telegramInfo || 'Not available', null, 2)}</pre>
        
        <h3>Errors (${window.debugInfo.errors.length})</h3>
        <pre>${JSON.stringify(window.debugInfo.errors, null, 2)}</pre>
        
        <h3>Warnings (${window.debugInfo.warnings.length})</h3>
        <pre>${JSON.stringify(window.debugInfo.warnings, null, 2)}</pre>
    `;
    content.appendChild(generalInfo);
    
    // Добавляем кнопку закрытия
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = 'background: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;';
    closeButton.onclick = () => modal.remove();
    content.appendChild(closeButton);
    
    // Добавляем всё на страницу
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Добавляем функцию для проверки наличия изображений
function checkAssets() {
    console.log('Checking assets...');
    
    try {
        const requiredImages = [
            'images/snail_red.png',
            'images/snail_green.png',
            'images/snail_blue.png',
            'images/snail_lilac.png',
            'images/snail_yellow.png',
            'images/wall_texture.png',
            'images/start.png',
            'images/finish.png'
        ];
        
        const missingImages = [];
        const fs = getFileSystemAPI();
        
        if (!fs) {
            console.warn('FileSystem API not available for asset checking');
            return;
        }
        
        for (const imagePath of requiredImages) {
            try {
                // Создаем объект Image для проверки загрузки
                const img = new Image();
                img.onerror = () => {
                    console.error(`Missing image: ${imagePath}`);
                    missingImages.push(imagePath);
                    window.debugInfo.errors.push({
                        timestamp: new Date().toISOString(),
                        type: 'asset error',
                        message: `Missing image: ${imagePath}`
                    });
                };
                img.src = imagePath;
            } catch (error) {
                console.error(`Error checking ${imagePath}:`, error);
                missingImages.push(imagePath);
            }
        }
        
        // Добавляем информацию о проверке ассетов в debugInfo
        window.debugInfo.assetsChecked = true;
        window.debugInfo.missingAssets = missingImages;
        
        if (missingImages.length > 0) {
            console.error(`Missing ${missingImages.length} required images. Run node download-assets.js`);
            
            // Показываем уведомление о недостающих изображениях
            showMissingAssetsNotification(missingImages);
        } else {
            console.log('All required images are available');
        }
    } catch (error) {
        console.error('Error in assets check:', error);
    }
}

// Получаем FileSystem API если доступен
function getFileSystemAPI() {
    if (typeof fs !== 'undefined') return fs;
    if (typeof require === 'function') {
        try {
            return require('fs');
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Функция для показа уведомления о недостающих ассетах
function showMissingAssetsNotification(missingImages) {
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; bottom: 60px; right: 10px; background-color: #ffaaaa; color: black; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.3); z-index: 9998; max-width: 300px;';
    
    notification.innerHTML = `
        <h3 style="margin: 0 0 5px 0; font-size: 14px;">Отсутствуют изображения</h3>
        <p style="margin: 0 0 5px 0; font-size: 12px;">Запустите скрипт загрузки:</p>
        <code style="display: block; background: #f8d7da; padding: 5px; margin-bottom: 5px; font-size: 12px;">node download-assets.js</code>
        <button style="font-size: 11px; padding: 2px 5px; margin-top: 5px; float: right;">Закрыть</button>
    `;
    
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => notification.remove());
    
    document.body.appendChild(notification);
}

// Дополняем инициализацию отладчика проверкой ассетов
document.addEventListener('DOMContentLoaded', function() {
    window.debugInfo.domLoaded = true;
    initDebugHelper();
    
    // Добавляем проверку ассетов через 1 секунду после загрузки DOM
    setTimeout(checkAssets, 1000);
    
    // Принудительно показываем стартовый экран через 3 секунды, если он всё еще скрыт
    setTimeout(function() {
        const startScreen = document.getElementById('start-screen');
        if (startScreen && (startScreen.style.display === 'none' || startScreen.classList.contains('hidden'))) {
            console.log('Forcing start screen visibility after timeout');
            startScreen.style.display = 'flex';
            startScreen.classList.remove('hidden');
            
            // Записываем в отладочную информацию, что пришлось форсировать отображение
            window.debugInfo.warnings.push({
                timestamp: new Date().toISOString(),
                message: 'Start screen was forcibly shown after timeout'
            });
        }
    }, 3000);
});

// Делаем функции доступными глобально
window.showDebugInfo = showDebugInfo;
window.checkAssets = checkAssets; 