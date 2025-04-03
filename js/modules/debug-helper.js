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
        // Проверяем наличие необходимых изображений
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
        let loadedCount = 0;
        
        // Добавляем информацию о проверке ассетов в debugInfo
        window.debugInfo.assetsChecked = true;
        
        // Уведомляем пользователя о работе системы проверки
        console.warn('FileSystem API not available for asset checking, using Image loading method instead');
        window.debugInfo.warnings.push({
            timestamp: new Date().toISOString(),
            message: 'FileSystem API not available for asset checking'
        });
        
        // Отображаем состояние проверки в логе
        console.log('Checking existence of ' + requiredImages.length + ' required images...');
        
        // Создаем Promise для каждого изображения и дожидаемся всех результатов
        const imageChecks = requiredImages.map(imagePath => {
            return new Promise(resolve => {
                // Создаем объект Image для проверки загрузки
                const img = new Image();
                
                // Отслеживаем успешную загрузку
                img.onload = () => {
                    console.log(`✅ Found image: ${imagePath}`);
                    loadedCount++;
                    resolve({ path: imagePath, exists: true });
                };
                
                // Отслеживаем ошибку загрузки
                img.onerror = () => {
                    console.error(`❌ Missing image: ${imagePath}`);
                    missingImages.push(imagePath);
                    window.debugInfo.errors.push({
                        timestamp: new Date().toISOString(),
                        message: `Missing image: ${imagePath}`
                    });
                    resolve({ path: imagePath, exists: false });
                };
                
                // Начинаем загрузку с добавлением случайного параметра для предотвращения кэширования
                img.src = imagePath + '?t=' + Date.now();
                
                // Устанавливаем таймаут для изображения
                setTimeout(() => {
                    if (!img.complete) {
                        console.warn(`⚠️ Timeout loading image: ${imagePath}`);
                        missingImages.push(imagePath);
                        window.debugInfo.errors.push({
                            timestamp: new Date().toISOString(),
                            message: `Timeout loading image: ${imagePath}`
                        });
                        resolve({ path: imagePath, exists: false });
                    }
                }, 5000);
            });
        });
        
        // Проверяем все изображения параллельно
        Promise.all(imageChecks).then(results => {
            window.debugInfo.missingAssets = missingImages;
            window.debugInfo.imagesChecked = results;
            
            // Выводим сводную информацию
            console.log(`Asset check complete: ${loadedCount}/${requiredImages.length} images loaded`);
            
            if (missingImages.length > 0) {
                console.error(`Missing ${missingImages.length} images: ${missingImages.join(', ')}`);
                
                // Добавляем подробную информацию в отладочную панель
                const debugContainer = document.getElementById('debug-content');
                if (debugContainer) {
                    const assetInfo = document.createElement('div');
                    assetInfo.innerHTML = `<h3>Проблемы с изображениями</h3>
                        <p>Не удалось загрузить ${missingImages.length} изображений:</p>
                        <ul>${missingImages.map(img => `<li>${img}</li>`).join('')}</ul>
                        <p>Загружено ${loadedCount}/${requiredImages.length} изображений</p>`;
                    debugContainer.appendChild(assetInfo);
                }
            }
        });
    } catch (error) {
        console.error('Error checking assets:', error);
        window.debugInfo.errors.push({
            timestamp: new Date().toISOString(),
            message: `Error checking assets: ${error.message}`
        });
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

// Инициализация отладочной панели
function setupDebugPanel() {
    const debugButton = document.getElementById('debug-button');
    const debugPanel = document.getElementById('debug-panel');
    const debugToggleLogs = document.getElementById('debug-toggle-logs');
    const debugToggleClose = document.getElementById('debug-toggle-close');
    
    if (!debugButton || !debugPanel) {
        console.warn('Debug panel elements not found in DOM');
        return;
    }
    
    // Показать/скрыть отладочную панель по клику на кнопку
    debugButton.addEventListener('click', () => {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Скрыть панель по кнопке закрытия
    if (debugToggleClose) {
        debugToggleClose.addEventListener('click', () => {
            debugPanel.style.display = 'none';
        });
    }
    
    // Показать логи
    if (debugToggleLogs) {
        debugToggleLogs.addEventListener('click', () => {
            showLogsInDebugPanel();
        });
    }
    
    // Отображаем статистику по изображениям при инициализации
    const debugContent = document.getElementById('debug-content');
    if (debugContent) {
        const statsDiv = document.createElement('div');
        statsDiv.innerHTML = '<h4>Image Status</h4><p>Checking images...</p>';
        debugContent.appendChild(statsDiv);
        
        // Будем обновлять статистику по таймеру
        window.debugImageStatsElement = statsDiv;
        updateImageStats();
    }
}

// Обновление статистики по изображениям
function updateImageStats() {
    if (!window.debugImageStatsElement) return;
    
    const statsDiv = window.debugImageStatsElement;
    const missingImages = window.debugInfo.missingAssets || [];
    const totalChecked = window.debugInfo.imagesChecked ? window.debugInfo.imagesChecked.length : 0;
    const loadedCount = window.debugInfo.imagesChecked ? 
        window.debugInfo.imagesChecked.filter(img => img && img.exists).length : 0;
    
    statsDiv.innerHTML = `<h4>Image Status</h4>
        <p>Checked: ${totalChecked} images</p>
        <p>Loaded: ${loadedCount}</p>
        <p>Missing: ${missingImages.length}</p>
        ${missingImages.length > 0 ? 
            `<details>
                <summary>Missing Images (${missingImages.length})</summary>
                <ul>${missingImages.map(img => `<li>${img}</li>`).join('')}</ul>
            </details>` : 
            ''}
    `;
    
    // Обновляем статистику каждые 3 секунды
    setTimeout(updateImageStats, 3000);
}

// Показать логи в отладочной панели
function showLogsInDebugPanel() {
    const debugContent = document.getElementById('debug-content');
    if (!debugContent) return;
    
    const logs = window.debugInfo.logs || [];
    const errors = window.debugInfo.errors || [];
    const warnings = window.debugInfo.warnings || [];
    
    const logsHtml = `
        <h4>Logs (${logs.length})</h4>
        <details ${logs.length > 0 ? 'open' : ''}>
            <summary>Show/Hide</summary>
            <ul>${logs.map(log => `<li>${new Date(log.timestamp).toLocaleTimeString()}: ${log.message}</li>`).join('')}</ul>
        </details>
        
        <h4>Errors (${errors.length})</h4>
        <details ${errors.length > 0 ? 'open' : ''}>
            <summary>Show/Hide</summary>
            <ul>${errors.map(err => `<li>${new Date(err.timestamp).toLocaleTimeString()}: <span style="color: #ff5252;">${err.message}</span></li>`).join('')}</ul>
        </details>
        
        <h4>Warnings (${warnings.length})</h4>
        <details ${warnings.length > 0 ? 'open' : ''}>
            <summary>Show/Hide</summary>
            <ul>${warnings.map(warn => `<li>${new Date(warn.timestamp).toLocaleTimeString()}: <span style="color: #ffab40;">${warn.message}</span></li>`).join('')}</ul>
        </details>
    `;
    
    debugContent.innerHTML = logsHtml;
}

// Дополняем инициализацию отладчика настройкой панели
document.addEventListener('DOMContentLoaded', function() {
    window.debugInfo.domLoaded = true;
    initDebugHelper();
    
    // Добавляем проверку ассетов через 1 секунду после загрузки DOM
    setTimeout(checkAssets, 1000);
    
    // Добавляем инициализацию отладочной панели через 1.5 секунд
    setTimeout(setupDebugPanel, 1500);
    
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

/**
 * Модуль для отладки и логирования в Snail to Riches
 */

// Создаем namespace для логов
window.LOG = {
    info: [],
    warnings: [],
    errors: []
};

// Максимальное количество сохраняемых логов
const MAX_LOGS = 50;

// Добавляем в window глобальные функции логирования
window.logInfo = function(message, data = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        data: data
    };
    
    console.info('[INFO]', message, data);
    
    // Добавляем в начало массива
    window.LOG.info.unshift(logEntry);
    
    // Ограничиваем размер массива
    if (window.LOG.info.length > MAX_LOGS) {
        window.LOG.info.pop();
    }
    
    // Обновляем панель отладки, если она существует
    updateDebugPanel();
    
    return logEntry;
};

window.logWarning = function(message, data = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        data: data
    };
    
    console.warn('[WARNING]', message, data);
    
    // Добавляем в начало массива
    window.LOG.warnings.unshift(logEntry);
    
    // Ограничиваем размер массива
    if (window.LOG.warnings.length > MAX_LOGS) {
        window.LOG.warnings.pop();
    }
    
    // Обновляем панель отладки, если она существует
    updateDebugPanel();
    
    return logEntry;
};

window.logError = function(message, data = null) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        data: data
    };
    
    console.error('[ERROR]', message, data);
    
    // Добавляем в начало массива
    window.LOG.errors.unshift(logEntry);
    
    // Ограничиваем размер массива
    if (window.LOG.errors.length > MAX_LOGS) {
        window.LOG.errors.pop();
    }
    
    // Обновляем панель отладки, если она существует
    updateDebugPanel();
    
    return logEntry;
};

// Функция для проверки ассетов
window.checkAssets = function() {
    const assetsToCheck = [
        'images/snail_red.png',
        'images/snail_green.png',
        'images/snail_blue.png',
        'images/snail_lilac.png',
        'images/snail_yellow.png',
        'images/wall_texture.png',
        'images/start.png',
        'images/finish.png'
    ];
    
    let results = {
        total: assetsToCheck.length,
        loaded: 0,
        failed: 0,
        details: {}
    };
    
    // Проверяем доступность FileSystem API
    if ('FileSystem' in window) {
        window.logInfo('FileSystem API доступен для проверки ассетов');
        
        // TODO: Добавить код для проверки через FileSystem API
        
    } else {
        window.logWarning('FileSystem API not available for asset checking, using Image loading method instead');
        
        // Проверяем через загрузку изображений
        assetsToCheck.forEach(asset => {
            const img = new Image();
            
            img.onload = () => {
                results.loaded++;
                results.details[asset] = { status: 'loaded', size: { width: img.width, height: img.height } };
                window.logInfo(`Asset loaded: ${asset}`);
            };
            
            img.onerror = () => {
                results.failed++;
                results.details[asset] = { status: 'failed' };
                window.logWarning(`Asset failed to load: ${asset}`);
            };
            
            // Начинаем загрузку с добавлением timestamp для обхода кеша
            img.src = `${asset}?t=${Date.now()}`;
        });
    }
    
    return results;
};

// Функция для создания и обновления панели отладки
function createDebugPanel() {
    if (document.getElementById('debug-panel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 300px; max-height: 300px; background: rgba(0,0,0,0.8); color: white; z-index: 9999; overflow: auto; font-family: monospace; font-size: 12px; padding: 10px; border-top-left-radius: 5px;';
    
    // Добавляем заголовок
    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #4CAF50;">Debug Panel</h3>
            <div>
                <button id="debug-toggle-logs" style="background: #555; color: white; border: none; border-radius: 3px; padding: 2px 5px; margin-right: 5px; cursor: pointer;">Logs</button>
                <button id="debug-close" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 2px 5px; cursor: pointer;">×</button>
            </div>
        </div>
        <div id="debug-content"></div>
    `;
    
    document.body.appendChild(panel);
    
    // Добавляем обработчики событий
    document.getElementById('debug-close').addEventListener('click', () => {
        panel.style.display = 'none';
    });
    
    let logsVisible = true;
    document.getElementById('debug-toggle-logs').addEventListener('click', () => {
        const content = document.getElementById('debug-content');
        logsVisible = !logsVisible;
        content.style.display = logsVisible ? 'block' : 'none';
        document.getElementById('debug-toggle-logs').textContent = logsVisible ? 'Logs' : 'Show';
    });
    
    // Инициализируем контент
    updateDebugPanel();
}

// Функция для обновления панели отладки
function updateDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (!panel) return;
    
    const content = document.getElementById('debug-content');
    if (!content) return;
    
    // Проверяем загрузку изображений из кеша
    let imagesStatus = '';
    if (window.imageCache) {
        const totalImages = Object.keys(window.imageCache).length;
        const loadedImages = Object.values(window.imageCache).filter(img => img && img.complete).length;
        
        imagesStatus = `<div style="margin-bottom: 10px;">
            <strong>Images:</strong> ${loadedImages}/${totalImages} loaded
        </div>`;
    }
    
    // Формируем HTML для логов
    let logsHTML = '';
    
    // Добавляем ошибки первыми
    if (window.LOG.errors.length > 0) {
        logsHTML += '<div style="margin-bottom: 10px;"><strong style="color: #f44336;">Errors:</strong>';
        window.LOG.errors.slice(0, 3).forEach(entry => {
            logsHTML += `<div style="color: #f44336; margin: 2px 0;">${entry.message}</div>`;
        });
        if (window.LOG.errors.length > 3) {
            logsHTML += `<div style="color: #f44336; font-style: italic;">${window.LOG.errors.length - 3} more errors...</div>`;
        }
        logsHTML += '</div>';
    }
    
    // Добавляем предупреждения
    if (window.LOG.warnings.length > 0) {
        logsHTML += '<div style="margin-bottom: 10px;"><strong style="color: #ff9800;">Warnings:</strong>';
        window.LOG.warnings.slice(0, 3).forEach(entry => {
            logsHTML += `<div style="color: #ff9800; margin: 2px 0;">${entry.message}</div>`;
        });
        if (window.LOG.warnings.length > 3) {
            logsHTML += `<div style="color: #ff9800; font-style: italic;">${window.LOG.warnings.length - 3} more warnings...</div>`;
        }
        logsHTML += '</div>';
    }
    
    // Добавляем информационные логи
    if (window.LOG.info.length > 0) {
        logsHTML += '<div style="margin-bottom: 10px;"><strong style="color: #4CAF50;">Info:</strong>';
        window.LOG.info.slice(0, 3).forEach(entry => {
            logsHTML += `<div style="color: #4CAF50; margin: 2px 0;">${entry.message}</div>`;
        });
        if (window.LOG.info.length > 3) {
            logsHTML += `<div style="color: #4CAF50; font-style: italic;">${window.LOG.info.length - 3} more info logs...</div>`;
        }
        logsHTML += '</div>';
    }
    
    // Обновляем контент
    content.innerHTML = imagesStatus + logsHTML;
}

// Инициализация модуля
document.addEventListener('DOMContentLoaded', function() {
    createDebugPanel();
    
    // Тестовый чек ассетов
    window.checkAssets();
    
    // Логируем старт
    window.logInfo('Debug module initialized');
});

// Экспортируем функции для использования в других модулях
export {
    logInfo,
    logWarning,
    logError,
    checkAssets
}; 