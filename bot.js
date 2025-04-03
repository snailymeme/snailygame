/**
 * Snail to Riches - Telegram Bot
 * Обеспечивает интеграцию с Telegram для запуска Web App
 */

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// ========== Конфигурация ==========

// Получаем токен из переменных окружения или подгружаем из .env файла
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Проверяем наличие токена
if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не установлен! Убедитесь, что токен указан в переменных окружения или в .env файле.');
    process.exit(1);
}

// Порт для HTTP сервера
const PORT = process.env.PORT || 3001;

// ========== Инициализация ==========

// Создаем Express приложение для статического сервера
const app = express();

// Настройка статических файлов
app.use(express.static(path.join(__dirname)));

// Создаем бота с включенным polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ========== Вспомогательные функции ==========

/**
 * Функция для получения актуального URL из файла
 * @returns {Promise<string|null>} URL или null, если URL не найден
 */
async function getWebAppUrl() {
    try {
        // Проверяем наличие файла
        if (fs.existsSync('ngrok-url.txt')) {
            const url = fs.readFileSync('ngrok-url.txt', 'utf8').trim();
            console.log('📄 Получен URL из файла:', url);
            return url;
        }
    } catch (error) {
        console.error('❌ Ошибка при чтении файла URL:', error);
    }
    return null;
}

/**
 * Проверяет доступность URL
 * @param {string} url - URL для проверки
 * @returns {Promise<boolean>} Результат проверки
 */
async function isUrlAccessible(url) {
    try {
        const response = await axios.get(url, {
            validateStatus: function (status) {
                return status >= 200 && status < 500;
            },
            timeout: 5000 // Таймаут 5 секунд
        });
        return response.status === 200;
    } catch (error) {
        console.error('❌ Ошибка при проверке URL:', error.message);
        return false;
    }
}

// ========== Глобальное состояние ==========

// Переменная для хранения текущего URL
let currentWebAppUrl = null;

/**
 * Обновляет URL для WebApp
 * @returns {Promise<boolean>} true, если URL успешно обновлен
 */
async function updateWebAppUrl() {
    const newUrl = await getWebAppUrl();
    
    // Если URL получен и отличается от текущего
    if (newUrl && newUrl !== currentWebAppUrl) {
        // Проверяем доступность URL перед обновлением
        if (await isUrlAccessible(newUrl)) {
            currentWebAppUrl = newUrl;
            console.log(`✅ URL Web App обновлен: ${currentWebAppUrl}`);
            return true;
        } else {
            console.error(`❌ URL недоступен: ${newUrl}`);
            return false;
        }
    }
    return false;
}

// ========== Обработчики сообщений ==========

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Получаем актуальный URL если currentWebAppUrl не установлен
    if (!currentWebAppUrl) {
        await updateWebAppUrl();
    }
    
    if (currentWebAppUrl) {
        // Создаем клавиатуру с кнопкой Web App
        const keyboard = {
            inline_keyboard: [[
                {
                    text: '🎮 Играть',
                    web_app: { url: currentWebAppUrl }
                }
            ]]
        };
        
        // Отправляем приветственное сообщение
        bot.sendMessage(chatId, 'Привет! Готов играть в Snail to Riches?', {
            reply_markup: keyboard
        });
    } else {
        console.error('❌ Ошибка отправки сообщения: URL Web App не доступен');
        bot.sendMessage(chatId, 'Извините, игра временно недоступна. Попробуйте позже.');
    }
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `
*Snail to Riches - Помощь*

Это игра, где вы можете делать ставки на гонки улиток и выигрывать призы!

*Доступные команды:*
/start - Начать игру
/help - Показать это сообщение

*Как играть:*
1. Нажмите кнопку "🎮 Играть"
2. Выберите улитку и сделайте ставку
3. Наблюдайте за гонкой и болейте за свою улитку!
4. Если ваша улитка победит, вы получите выигрыш!
    `, {
        parse_mode: 'Markdown'
    });
});

// ========== Периодические задачи ==========

// Периодическая проверка URL
const urlCheckInterval = setInterval(async () => {
    if (!currentWebAppUrl) {
        await updateWebAppUrl();
    }
}, 30000); // Проверка каждые 30 секунд

// ========== Запуск сервера ==========

// Запускаем Express сервер
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});

// Запускаем процесс получения URL
(async () => {
    console.log('🚀 Запуск бота...');
    
    // Пытаемся получить URL 5 раз с интервалом в 2 секунды
    for (let i = 0; i < 5; i++) {
        if (await updateWebAppUrl()) {
            console.log('✅ Бот успешно запущен с URL:', currentWebAppUrl);
            return;
        }
        console.log(`⏳ Ожидание валидного URL... (попытка ${i+1}/5)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('⚠️ Бот запущен без начального URL, продолжим попытки получения URL в фоне');
})();

// Обработка завершения работы
process.on('SIGINT', () => {
    console.log('🛑 Завершение работы бота...');
    clearInterval(urlCheckInterval);
    bot.stopPolling();
    console.log('👋 Бот остановлен. До свидания!');
    process.exit(0);
}); 