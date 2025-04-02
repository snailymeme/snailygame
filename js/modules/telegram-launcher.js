/**
 * Модуль для запуска игры из Telegram
 * Автоматически определяет, запущена ли игра через бота, и начинает игру
 */

export function initTelegramLauncher() {
    console.log('Инициализация Telegram лаунчера...');
    
    // Получаем экземпляр Telegram WebApp
    const tg = window.Telegram?.WebApp;
    
    // Проверяем, запущена ли игра из Telegram
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        console.log('Игра запущена из Telegram с параметрами:', tg.initDataUnsafe.start_param);
        
        // Если есть параметр 'autostart', запускаем игру автоматически
        if (tg.initDataUnsafe.start_param === 'autostart') {
            console.log('Включен автозапуск игры');
            setTimeout(autoStartGame, 1000);
        }
    }
    
    // Проверяем, запущена ли игра через ngrok
    const isNgrok = window.location.hostname.includes('ngrok') || 
                   window.location.href.includes('ngrok');
                   
    if (isNgrok) {
        console.log('Игра запущена через ngrok, включаем автозапуск');
        // Отсрочка нужна, чтобы DOM успел загрузиться полностью
        setTimeout(autoStartGame, 1500);
    } else {
        console.log('Игра запущена не через ngrok:', window.location.href);
    }
}

/**
 * Автоматически запускает игру, выбирая случайную улитку и делая ставку
 */
function autoStartGame() {
    console.log('Автоматический запуск игры...');
    
    // Проверяем, загружены ли все необходимые элементы интерфейса
    if (!document.querySelector('.snail-grid') || 
        !document.getElementById('bet-amount') || 
        !document.getElementById('connect-wallet')) {
        console.log('Необходимые элементы еще не загружены, повторная попытка через 1 секунду...');
        setTimeout(autoStartGame, 1000);
        return;
    }
    
    // Выбираем случайную улитку
    const snailButtons = document.querySelectorAll('.snail-button');
    if (snailButtons.length > 0) {
        const randomIndex = Math.floor(Math.random() * snailButtons.length);
        snailButtons[randomIndex].click();
        console.log('Выбрана случайная улитка:', randomIndex);
    } else {
        console.log('Не найдены кнопки выбора улиток!');
    }
    
    // Устанавливаем случайную ставку от 10 до максимального баланса
    const balanceEl = document.getElementById('balance-amount');
    if (balanceEl) {
        try {
            const balance = parseInt(balanceEl.textContent) || 100;
            const betAmount = Math.min(Math.floor(Math.random() * 50) + 10, balance);
            const betInput = document.getElementById('bet-amount');
            if (betInput) {
                betInput.value = betAmount;
                // Генерируем событие ввода для обновления состояния игры
                betInput.dispatchEvent(new Event('input'));
                console.log(`Установлена случайная ставка: ${betAmount}`);
            }
        } catch (e) {
            console.error('Ошибка при установке ставки:', e);
        }
    } else {
        console.log('Не найден элемент баланса!');
    }
    
    // Подключаем кошелек, если еще не подключен
    const connectWalletBtn = document.getElementById('connect-wallet');
    if (connectWalletBtn && !connectWalletBtn.disabled) {
        try {
            connectWalletBtn.click();
            console.log('Кошелек подключен автоматически');
        } catch (e) {
            console.error('Ошибка при подключении кошелька:', e);
        }
    } else {
        console.log('Кнопка подключения кошелька недоступна или уже активирована');
    }
    
    // Запускаем гонку, если кнопка активна
    setTimeout(() => {
        const startRaceBtn = document.getElementById('start-race');
        if (startRaceBtn && !startRaceBtn.disabled) {
            try {
                startRaceBtn.click();
                console.log('Гонка запущена автоматически');
            } catch (e) {
                console.error('Ошибка при запуске гонки:', e);
            }
        } else {
            console.log('Кнопка старта гонки недоступна:', startRaceBtn ? 'Disabled' : 'Not found');
            
            // Если кнопка недоступна, пробуем снова через некоторое время
            setTimeout(() => {
                const retryBtn = document.getElementById('start-race');
                if (retryBtn && !retryBtn.disabled) {
                    retryBtn.click();
                    console.log('Гонка запущена автоматически после повторной попытки');
                }
            }, 2000);
        }
    }, 1000);
} 