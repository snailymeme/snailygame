// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

// Импорт модуля для автоматического запуска из Telegram
import { initTelegramLauncher } from './modules/telegram-launcher.js';

// Импорт модуля для рендеринга гонки
import { initRaceRenderer, startRace as startRaceRenderer, stopRace as stopRaceRenderer } from './modules/race-renderer.js';

// Состояние игры
const gameState = {
    selectedSnail: null,
    betAmount: 10,
    isRacing: false,
    walletConnected: false,
    balance: 100
};

// DOM элементы
const startScreen = document.getElementById('start-screen');
const loadingScreen = document.getElementById('loading-screen');
const raceScreen = document.getElementById('race-screen');
const resultsScreen = document.getElementById('results-screen');
const betInput = document.getElementById('bet-amount');
const balanceAmount = document.getElementById('balance-amount');
const connectWalletBtn = document.getElementById('connect-wallet');
const startRaceBtn = document.getElementById('start-race');
const playAgainBtn = document.getElementById('play-again');
const resultMessage = document.getElementById('result-message');
const winningsAmount = document.getElementById('winnings-amount');

// Инициализация игры
function initGame() {
    // Инициализация выбора улиток
    initSnailSelection();
    
    // Инициализация обработчиков событий
    initEventListeners();
    
    // Инициализация Canvas
    initCanvas();
    
    // Применяем темы Telegram
    applyTelegramTheme();
    
    // Автоматически подключаем кошелек после загрузки
    autoConnectWallet();
    
    // Обновляем баланс
    updateBalance(gameState.balance);
}

// Применение тем Telegram
function applyTelegramTheme() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#F0F2F5');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#1A1A1A');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#7D7D7D');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3498DB');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#FFFFFF');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#FFFFFF');
}

// Инициализация выбора улиток
function initSnailSelection() {
    const snailGrid = document.querySelector('.snail-grid');
    const snails = [
        { id: 'racer', name: 'Гонщик', color: '🔴', speed: 1.5, description: 'Быстрая улитка с ускорениями' },
        { id: 'explorer', name: 'Исследователь', color: '🟢', speed: 1.2, description: 'Любопытная улитка' },
        { id: 'snake', name: 'Змейка', color: '🔵', speed: 1.3, description: 'Движется извилистыми путями' },
        { id: 'stubborn', name: 'Упрямая', color: '🟣', speed: 0.9, description: 'Может застревать' },
        { id: 'default', name: 'Тупичок', color: '🟡', speed: 1.1, description: 'Любит заходить в тупики' }
    ];

    snails.forEach(snail => {
        const button = document.createElement('button');
        button.className = 'snail-button';
        button.innerHTML = `
            <span class="emoji">${snail.color}</span>
            <span class="name">${snail.name}</span>
            <span class="speed">Скорость: ${snail.speed}</span>
        `;
        button.onclick = () => selectSnail(snail.id);
        button.setAttribute('data-snail-id', snail.id);
        snailGrid.appendChild(button);
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Кнопка подключения кошелька
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Кнопка начала гонки
    startRaceBtn.addEventListener('click', startRace);
    
    // Кнопка "играть снова"
    playAgainBtn.addEventListener('click', resetGame);
    
    // Ввод ставки
    betInput.addEventListener('input', (e) => {
        gameState.betAmount = parseInt(e.target.value) || 0;
        checkCanStartRace();
    });
    
    // Элементы управления гонкой
    document.getElementById('zoom-in').addEventListener('click', () => zoomCanvas(1.2));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCanvas(0.8));
    document.getElementById('follow-snail').addEventListener('click', toggleFollowSnail);
    
    // Обработка завершения гонки (будет вызываться из симуляции гонки)
    window.addEventListener('race-finished', handleRaceFinished);
}

// Масштабирование холста
function zoomCanvas(factor) {
    console.log(`Масштабирование холста с фактором: ${factor}`);
    // Здесь будет логика масштабирования
}

// Следование за улиткой
function toggleFollowSnail() {
    console.log('Переключение режима следования за улиткой');
    // Здесь будет логика переключения
}

// Инициализация Canvas
function initCanvas() {
    const canvas = document.getElementById('race-canvas');
    const ctx = canvas.getContext('2d');
    
    // Установка размеров canvas
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Отрисовка фона (заглушка)
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Выбор улитки
function selectSnail(snailId) {
    gameState.selectedSnail = snailId;
    document.querySelectorAll('.snail-button').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-snail-id') === snailId) {
            btn.classList.add('selected');
        }
    });
    
    // Проверяем, можно ли начать гонку
    checkCanStartRace();
}

// Проверка возможности начать гонку
function checkCanStartRace() {
    if (gameState.selectedSnail && gameState.walletConnected && gameState.betAmount > 0 && gameState.betAmount <= gameState.balance) {
        startRaceBtn.disabled = false;
    } else {
        startRaceBtn.disabled = true;
    }
}

// Автоматическое подключение кошелька
function autoConnectWallet() {
    setTimeout(() => {
        connectWallet();
    }, 500);
}

// Подключение кошелька
function connectWallet() {
    try {
        // Имитация подключения к кошельку
        gameState.walletConnected = true;
        connectWalletBtn.textContent = 'Кошелек подключен';
        connectWalletBtn.classList.add('connected');
        connectWalletBtn.disabled = true;
        
        // Проверяем, можно ли начать гонку
        checkCanStartRace();
        
        // Отображаем успешное подключение
        tg.showPopup({
            title: 'Подключено!',
            message: 'Кошелек успешно подключен',
            buttons: [{type: 'ok'}]
        });
    } catch (error) {
        console.error('Ошибка при подключении кошелька:', error);
        tg.showPopup({
            title: 'Ошибка',
            message: 'Не удалось подключить кошелек',
            buttons: [{type: 'ok'}]
        });
    }
}

// Обновление баланса
function updateBalance(newBalance) {
    gameState.balance = newBalance;
    balanceAmount.textContent = newBalance;
}

// Начало гонки
function startRace() {
    if (!canStartRace()) {
        tg.showPopup({
            title: 'Невозможно начать гонку',
            message: 'Пожалуйста, выберите улитку, подключите кошелек и введите корректную ставку',
            buttons: [{type: 'ok'}]
        });
        return;
    }
    
    // Списываем ставку с баланса
    updateBalance(gameState.balance - gameState.betAmount);
    
    // Показываем экран загрузки
    startScreen.classList.add('hidden');
    loadingScreen.classList.remove('hidden');
    
    // Имитируем загрузку гонки
    setTimeout(() => {
        // Переход к экрану гонки
        loadingScreen.classList.add('hidden');
        raceScreen.classList.remove('hidden');
        
        // Запускаем гонку
        gameState.isRacing = true;
        
        // Получаем данные о улитках для передачи в рендерер
        const snailsData = [
            { id: 'racer', name: 'Гонщик', color: '🔴', speed: 1.5, description: 'Быстрая улитка с ускорениями' },
            { id: 'explorer', name: 'Исследователь', color: '🟢', speed: 1.2, description: 'Любопытная улитка' },
            { id: 'snake', name: 'Змейка', color: '🔵', speed: 1.3, description: 'Движется извилистыми путями' },
            { id: 'stubborn', name: 'Упрямая', color: '🟣', speed: 0.9, description: 'Может застревать' },
            { id: 'default', name: 'Тупичок', color: '🟡', speed: 1.1, description: 'Любит заходить в тупики' }
        ];
        
        // Инициализируем и запускаем рендерер гонки
        const canvas = document.getElementById('race-canvas');
        initRaceRenderer(canvas, snailsData, gameState.selectedSnail);
        startRaceRenderer();
    }, 3000);
}

// Проверка возможности начать гонку
function canStartRace() {
    return (
        gameState.selectedSnail !== null &&
        gameState.walletConnected &&
        gameState.betAmount > 0 &&
        gameState.betAmount <= gameState.balance
    );
}

// Обработка завершения гонки
function handleRaceFinished(event) {
    const { winner, position, time } = event.detail;
    
    // Завершаем гонку
    gameState.isRacing = false;
    
    if (winner) {
        // Выигрыш
        const winAmount = gameState.betAmount * 2;
        updateBalance(gameState.balance + winAmount);
        resultMessage.textContent = `Поздравляем! Ваша улитка финишировала ${position}-й за ${time} сек.`;
        winningsAmount.textContent = `Вы выиграли ${winAmount} монет!`;
        winningsAmount.classList.add('win');
        
        // Вибрация при победе
        if (tg.isExpanded && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    } else {
        // Проигрыш
        resultMessage.textContent = `К сожалению, ваша улитка финишировала ${position}-й за ${time} сек.`;
        winningsAmount.textContent = `Вы потеряли ${gameState.betAmount} монет.`;
        winningsAmount.classList.add('loss');
    }
    
    // Переключаемся на экран результатов
    raceScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Сообщаем результат Telegram
    tg.HapticFeedback.notificationOccurred(winner ? 'success' : 'error');
    
    // Включаем кнопку "Главное меню" в Telegram
    tg.BackButton.show();
    tg.BackButton.onClick(() => resetGame());
}

// Сброс игры
function resetGame() {
    gameState.selectedSnail = null;
    gameState.isRacing = false;
    
    // Останавливаем рендерер гонки
    stopRaceRenderer();
    
    // Сбрасываем выбор улитки
    document.querySelectorAll('.snail-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Сбрасываем ставку на значение по умолчанию
    betInput.value = '10';
    gameState.betAmount = 10;
    
    // Сбрасываем классы выигрыша/проигрыша
    winningsAmount.classList.remove('win', 'loss');
    
    // Скрываем кнопку "Главное меню" в Telegram
    tg.BackButton.hide();
    
    // Показываем начальный экран
    resultsScreen.classList.add('hidden');
    raceScreen.classList.add('hidden');
    loadingScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    
    // Проверяем, можно ли начать гонку
    checkCanStartRace();
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // Инициализируем автозапуск из Telegram
    initTelegramLauncher();
}); 