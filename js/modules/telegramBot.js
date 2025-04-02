// Конфигурация бота
const BOT_TOKEN = '7686647298:AAGmRnfGceCksKJUu8jk0e1dZOakgkn_V1s';
const BOT_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Инициализация Web App
const tg = window.Telegram.WebApp;

// Функция для отправки сообщений боту
async function sendMessage(chatId, text, webAppUrl = null) {
    const message = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };

    if (webAppUrl) {
        message.reply_markup = {
            inline_keyboard: [[
                {
                    text: "🎮 Играть",
                    web_app: { url: webAppUrl }
                }
            ]]
        };
    }

    try {
        const response = await fetch(`${BOT_API_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

// Функция для получения информации о боте
async function getBotInfo() {
    try {
        const response = await fetch(`${BOT_API_URL}/getMe`);
        return await response.json();
    } catch (error) {
        console.error('Error getting bot info:', error);
        throw error;
    }
}

// Функция для установки Web App URL
async function setWebAppUrl(url) {
    try {
        const response = await fetch(`${BOT_API_URL}/setWebhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                allowed_updates: ['message']
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error setting webhook:', error);
        throw error;
    }
}

// Экспорт функций
export {
    BOT_TOKEN,
    sendMessage,
    getBotInfo,
    setWebAppUrl,
    tg
}; 