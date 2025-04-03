/**
 * Модуль для управления загрузкой и кэшированием изображений
 */

// Кеш для хранения загруженных изображений
const imageCache = {};

// Пути к изображениям для приложения
export const IMAGE_PATHS = {
    wall: 'images/wall_texture.png',
    start: 'images/start.png',
    finish: 'images/finish.png',
    snail_red: 'images/snail_red.png',
    snail_blue: 'images/snail_blue.png',
    snail_green: 'images/snail_green.png',
    snail_lilac: 'images/snail_lilac.png',
    snail_yellow: 'images/snail_yellow.png'
};

/**
 * Корректирует путь к изображению для правильной загрузки в Telegram Web App
 * @param {string} path - Исходный путь к изображению
 * @returns {string} - Скорректированный путь
 */
export function correctImagePath(path) {
    // Если путь уже абсолютный, не меняем его
    if (path.startsWith('http') || path.startsWith('//')) {
        return path;
    }
    
    // Если мы в Telegram Web App, корректируем пути
    if (window.Telegram && window.Telegram.WebApp) {
        const baseUrl = window.location.origin;
        
        // Убираем начальный слеш, если он есть
        const cleanPath = path.replace(/^\//, '');
        
        // Формируем полный путь
        return `${baseUrl}/${cleanPath}`;
    }
    
    // Если не в Telegram Web App, возвращаем исходный путь
    return path;
}

/**
 * Загружает изображение с кэшированием
 * @param {string} path - Путь к изображению
 * @returns {Promise<HTMLImageElement>} - Promise с загруженным изображением
 */
export function loadImage(path) {
    const correctedPath = correctImagePath(path);
    
    // Проверяем, есть ли изображение в кэше
    if (imageCache[correctedPath]) {
        return Promise.resolve(imageCache[correctedPath]);
    }
    
    // Если нет, загружаем новое изображение
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            console.log(`✅ Изображение загружено: ${correctedPath}`);
            imageCache[correctedPath] = img;
            resolve(img);
        };
        
        img.onerror = (error) => {
            console.error(`❌ Ошибка загрузки изображения: ${correctedPath}`, error);
            reject(new Error(`Не удалось загрузить изображение: ${path}`));
        };
        
        img.src = correctedPath;
    });
}

/**
 * Предзагружает все необходимые для игры изображения
 * @returns {Promise<Object>} - Promise с объектом загруженных изображений
 */
export function preloadImages() {
    console.log('Начинаем предзагрузку всех изображений...');
    
    const imagePaths = Object.values(IMAGE_PATHS);
    const imagePromises = imagePaths.map(path => loadImage(path));
    
    return Promise.all(imagePromises)
        .then(images => {
            console.log(`✅ Успешно загружено ${images.length} изображений`);
            
            // Формируем объект с загруженными изображениями
            const loadedImages = {};
            Object.keys(IMAGE_PATHS).forEach((key, index) => {
                loadedImages[key] = images[index];
            });
            
            return loadedImages;
        })
        .catch(error => {
            console.error('❌ Ошибка при предзагрузке изображений:', error);
            throw error;
        });
}

/**
 * Проверяет доступность изображений по указанным путям
 * @param {Array<string>} paths - Массив путей к изображениям для проверки
 * @returns {Promise<Array<Object>>} - Promise с результатами проверки
 */
export function testImageAvailability(paths) {
    console.log('Проверка доступности изображений...');
    
    const tests = paths.map(path => {
        return new Promise((resolve) => {
            const img = new Image();
            const correctedPath = correctImagePath(path);
            
            img.onload = () => {
                console.log(`✅ Изображение доступно: ${correctedPath}`);
                resolve({ success: true, path: correctedPath, originalPath: path });
            };
            
            img.onerror = () => {
                console.error(`❌ Изображение недоступно: ${correctedPath}`);
                resolve({ success: false, path: correctedPath, originalPath: path });
            };
            
            img.src = correctedPath;
        });
    });
    
    return Promise.all(tests)
        .then(results => {
            // Подсчитываем, сколько изображений доступны
            const availableCount = results.filter(r => r.success).length;
            console.log(`Доступно ${availableCount} из ${results.length} изображений`);
            
            return results;
        });
}

/**
 * Получает изображение из кэша или загружает его
 * @param {string} key - Ключ изображения из IMAGE_PATHS
 * @returns {Promise<HTMLImageElement>} - Promise с изображением
 */
export function getImage(key) {
    const path = IMAGE_PATHS[key];
    if (!path) {
        return Promise.reject(new Error(`Неизвестный ключ изображения: ${key}`));
    }
    
    return loadImage(path);
} 