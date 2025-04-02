// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

// Состояние игры
const gameState = {
    selectedSnail: null,
    betAmount: 0,
    isRacing: false,
    walletConnected: false
};

// DOM элементы
const startScreen = document.getElementById('start-screen');
const raceScreen = document.getElementById('race-screen');
const resultsScreen = document.getElementById('results-screen');
const betInput = document.getElementById('bet-amount');
const connectWalletBtn = document.getElementById('connect-wallet');
const startRaceBtn = document.getElementById('start-race');
const playAgainBtn = document.getElementById('play-again');

// Инициализация игры
function initGame() {
    // Инициализация выбора улиток
    initSnailSelection();
    
    // Инициализация обработчиков событий
    initEventListeners();
    
    // Инициализация Canvas
    initCanvas();
}

// Инициализация выбора улиток
function initSnailSelection() {
    const snailGrid = document.querySelector('.snail-grid');
    const snails = [
        { id: 'racer', name: 'Racer Slug', color: '🔴' },
        { id: 'explorer', name: 'Explorer Slug', color: '🟢' },
        { id: 'snake', name: 'Snake Slug', color: '🔵' },
        { id: 'stubborn', name: 'Stubborn Slug', color: '🟣' },
        { id: 'default', name: 'Default Slug', color: '🟡' }
    ];

    snails.forEach(snail => {
        const button = document.createElement('button');
        button.className = 'snail-button';
        button.innerHTML = `${snail.color} ${snail.name}`;
        button.onclick = () => selectSnail(snail.id);
        snailGrid.appendChild(button);
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    startRaceBtn.addEventListener('click', startRace);
    playAgainBtn.addEventListener('click', resetGame);
    betInput.addEventListener('input', (e) => {
        gameState.betAmount = parseFloat(e.target.value) || 0;
    });
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
}

// Выбор улитки
function selectSnail(snailId) {
    gameState.selectedSnail = snailId;
    document.querySelectorAll('.snail-button').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent.includes(snailId)) {
            btn.classList.add('selected');
        }
    });
}

// Подключение кошелька
async function connectWallet() {
    try {
        // Здесь будет логика подключения к Phantom
        gameState.walletConnected = true;
        connectWalletBtn.textContent = 'Wallet Connected';
        connectWalletBtn.disabled = true;
    } catch (error) {
        console.error('Failed to connect wallet:', error);
    }
}

// Начало гонки
function startRace() {
    if (!gameState.selectedSnail) {
        alert('Please select a snail first!');
        return;
    }
    
    if (!gameState.betAmount) {
        alert('Please enter a bet amount!');
        return;
    }
    
    if (!gameState.walletConnected) {
        alert('Please connect your wallet first!');
        return;
    }
    
    // Переход к экрану гонки
    startScreen.classList.add('hidden');
    raceScreen.classList.remove('hidden');
    
    // Здесь будет логика начала гонки
    gameState.isRacing = true;
}

// Сброс игры
function resetGame() {
    gameState.selectedSnail = null;
    gameState.betAmount = 0;
    gameState.isRacing = false;
    gameState.walletConnected = false;
    
    betInput.value = '';
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.disabled = false;
    
    document.querySelectorAll('.snail-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    resultsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame); 