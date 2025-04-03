/**
 * Snail to Riches - Главный JavaScript файл
 * Инициализирует игру и интегрируется с Telegram Mini App
 */

import { GameState } from './modules/gameState.js';
import { GAME_CONFIG, TELEGRAM_CONFIG } from './modules/config.js';
import * as UI from './modules/ui.js';

// Главный класс приложения
class SnailToRichesApp {
    constructor() {
        // Создаем экземпляр GameState
        this.gameState = new GameState();
        
        // Привязываем обработчики событий
        this.handleSnailSelection = this.handleSnailSelection.bind(this);
        this.handleBetChange = this.handleBetChange.bind(this);
        this.handleStartRace = this.handleStartRace.bind(this);
        
        // Инициализация Telegram Web App, если запущено в Telegram
        this.initTelegramWebApp();
    }
    
    /**
     * Инициализирует интеграцию с Telegram Web App
     */
    initTelegramWebApp() {
        if (TELEGRAM_CONFIG.isRunningInTelegram()) {
            console.log('Интеграция с Telegram Web App...');
            
            const tg = window.Telegram.WebApp;
            
            // Сообщаем Telegram, что приложение готово
            tg.ready();
            
            // Устанавливаем тему и цвета
            tg.expand();
            
            // Получаем данные пользователя
            const userData = TELEGRAM_CONFIG.getUserData();
            if (userData) {
                console.log('Пользователь Telegram:', userData);
            }
            
            console.log('Telegram Web App успешно интегрирован');
        } else {
            console.log('Приложение запущено вне Telegram');
        }
    }
    
    /**
     * Обрабатывает выбор улитки пользователем
     * @param {string} snailType - Тип выбранной улитки
     */
    handleSnailSelection(snailType) {
        this.gameState.selectSnail(snailType);
        
        // Визуальное обновление UI (выделение выбранной улитки)
        document.querySelectorAll('.snail-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`.snail-option[data-type="${snailType}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            
            // Получаем имя и путь к изображению выбранной улитки
            const snailName = selectedElement.querySelector('.snail-name').textContent;
            
            // Обновляем информацию о выбранной улитке в интерфейсе, если такой элемент есть
            const selectedSnailInfo = document.getElementById('selected-snail-info');
            if (selectedSnailInfo) {
                selectedSnailInfo.textContent = `Ваша улитка: ${snailName}`;
            }
        }
    }
    
    /**
     * Обрабатывает изменение суммы ставки
     * @param {number} amount - Новая сумма ставки
     */
    handleBetChange(amount) {
        const validAmount = this.gameState.setBetAmount(amount);
        
        // Обновление UI (поля ввода ставки)
        const betInput = document.getElementById('bet-amount');
        if (betInput && betInput.value !== String(validAmount)) {
            betInput.value = validAmount;
        }
    }
    
    /**
     * Обрабатывает нажатие на кнопку "Начать гонку"
     */
    async handleStartRace() {
        if (!this.gameState.selectedSnail) {
            UI.showError('Выберите улитку', 'Пожалуйста, выберите улитку перед началом гонки');
            return;
        }
        
        // Попытка начать гонку
        await this.gameState.startRace();
    }
    
    /**
     * Инициализирует элементы управления на странице
     */
    setupControls() {
        // Инициализация выбора улиток
        document.querySelectorAll('.snail-option').forEach(el => {
            const snailType = el.getAttribute('data-type');
            el.addEventListener('click', () => this.handleSnailSelection(snailType));
        });
        
        // Инициализация ввода ставки
        const betInput = document.getElementById('bet-amount');
        if (betInput) {
            betInput.addEventListener('change', (e) => {
                this.handleBetChange(parseFloat(e.target.value));
            });
            
            // Устанавливаем начальное значение
            betInput.value = GAME_CONFIG.BETTING.DEFAULT_BET;
        }
        
        // Инициализация кнопки "Начать гонку"
        const startButton = document.getElementById('start-race');
        if (startButton) {
            startButton.addEventListener('click', this.handleStartRace);
        }
    }
    
    /**
     * Запускает приложение
     */
    async start() {
        try {
            console.log('Запуск приложения Snail to Riches...');
            
            // Инициализируем игровое состояние
            await this.gameState.initialize();
            
            // Настраиваем элементы управления
            this.setupControls();
            
            // Показываем первый экран (выбор улитки)
            this.showScreen('start-screen');
            
            console.log('Приложение успешно запущено');
        } catch (error) {
            console.error('Ошибка при запуске приложения:', error);
            UI.showError('Ошибка при запуске приложения', error);
        }
    }
    
    /**
     * Показывает указанный экран и скрывает остальные
     * @param {string} screenId - ID экрана для отображения
     */
    showScreen(screenId) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        
        // Показываем нужный экран
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) {
            screenToShow.style.display = 'flex';
        }
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const app = new SnailToRichesApp();
    app.start();
}); 