/**
 * Модуль для управления состоянием игры
 * Централизует управление состоянием и отделяет логику от UI
 */

import { GAME_CONFIG, getDeviceInfo } from './config.js';
import { loadImage, preloadImages } from './imageLoader.js';
import { GameRenderer } from './gameRenderer.js';
import * as UI from './ui.js';

/**
 * Класс управления состоянием игры
 */
export class GameState {
    /**
     * Создает новый экземпляр GameState
     */
    constructor() {
        // Основные компоненты игры
        this.canvas = null;
        this.renderer = null;
        this.maze = null;
        this.slugManager = null;
        this.gameCycle = null;
        
        // Состояние игры
        this.raceStarted = false;
        this.raceFinished = false;
        this.selectedSnail = null;
        this.betAmount = GAME_CONFIG.BETTING.DEFAULT_BET;
        this.wallet = null;
        
        // Информация об устройстве
        this.deviceInfo = getDeviceInfo();
        
        // Загруженные изображения
        this.images = null;
        
        // Привязка контекста для методов
        this.startRace = this.startRace.bind(this);
        this.endRace = this.endRace.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.selectSnail = this.selectSnail.bind(this);
        this.setBetAmount = this.setBetAmount.bind(this);
    }
    
    /**
     * Инициализирует игру
     * @returns {Promise} Promise, завершающийся после инициализации
     */
    async initialize() {
        try {
            console.log('Инициализация игры...');
            
            // Инициализация UI элементов
            const elements = UI.setupRaceElements();
            this.canvas = elements.raceCanvas;
            
            // Показываем экран загрузки
            UI.showLoadingScreen();
            
            // Предзагружаем изображения
            try {
                this.images = await preloadImages();
                console.log('Изображения успешно загружены:', this.images);
            } catch (error) {
                console.error('Ошибка при загрузке изображений:', error);
                UI.showError('Ошибка при загрузке изображений', error);
                // Продолжаем без изображений
                this.images = {};
            }
            
            // Инициализация рендерера
            this.renderer = new GameRenderer(this.canvas, {
                cellSize: GAME_CONFIG.MAZE.CELL_SIZE
            });
            this.renderer.setImages(this.images);
            
            // Загружаем менеджер улиток и модуль цикла игры асинхронно
            const [SlugManager, GameCycle] = await Promise.all([
                import('./slug-manager.js').then(module => module.default || module.SlugManager),
                import('./game-cycle.js').then(module => module.default || module.GameCycle)
            ]);
            
            this.slugManager = new SlugManager();
            this.gameCycle = new GameCycle();
            
            // Инициализация лабиринта
            await this.initializeMaze();
            
            // Скрываем экран загрузки
            UI.hideLoadingScreen();
            
            console.log('Инициализация завершена успешно');
            return true;
        } catch (error) {
            console.error('Ошибка при инициализации игры:', error);
            UI.showError('Ошибка при инициализации игры', error);
            UI.hideLoadingScreen();
            return false;
        }
    }
    
    /**
     * Инициализирует лабиринт с учетом производительности устройства
     */
    async initializeMaze() {
        try {
            // Импортируем генератор лабиринта
            const MazeGenerator = await import('./mazeGenerator.js')
                .then(module => module.default || module.MazeGenerator);
            
            // Получаем адаптированные под устройство настройки
            const adaptedSettings = this.deviceInfo.getAdaptedMazeSize();
            
            // Создаем генератор с адаптированными размерами
            const mazeGenerator = new MazeGenerator(
                adaptedSettings.width,
                adaptedSettings.height
            );
            
            // Генерируем лабиринт
            this.maze = mazeGenerator.generate({
                complexity: adaptedSettings.complexity,
                branchFactor: GAME_CONFIG.MAZE.DEFAULT_BRANCH_FACTOR,
                randomStart: false,
                randomFinish: false
            });
            
            console.log('Лабиринт успешно сгенерирован:', 
                        `${this.maze.width}x${this.maze.height}`);
            
            // Обновляем canvas
            if (this.renderer) {
                this.renderer.render(this.maze, []);
            }
            
            return this.maze;
        } catch (error) {
            console.error('Ошибка при инициализации лабиринта:', error);
            throw error;
        }
    }
    
    /**
     * Выбирает улитку для ставки
     * @param {string} snailType - Тип выбранной улитки
     */
    selectSnail(snailType) {
        if (this.raceStarted) {
            console.warn('Невозможно выбрать улитку: гонка уже началась');
            return;
        }
        
        this.selectedSnail = snailType;
        console.log(`Выбрана улитка: ${snailType}`);
        
        // Обновляем информацию в UI
        const snailConfig = GAME_CONFIG.SLUG.TYPES[snailType] || GAME_CONFIG.SLUG.TYPES.default;
        UI.updateSelectedSnailInfo(snailConfig.name);
        
        return this.selectedSnail;
    }
    
    /**
     * Устанавливает сумму ставки
     * @param {number} amount - Сумма ставки
     */
    setBetAmount(amount) {
        if (this.raceStarted) {
            console.warn('Невозможно изменить ставку: гонка уже началась');
            return;
        }
        
        // Валидация суммы ставки
        const validAmount = Math.min(
            Math.max(parseFloat(amount) || 0, GAME_CONFIG.BETTING.MIN_BET),
            GAME_CONFIG.BETTING.MAX_BET
        );
        
        this.betAmount = validAmount;
        console.log(`Установлена ставка: ${validAmount}`);
        
        return this.betAmount;
    }
    
    /**
     * Запускает гонку улиток
     */
    async startRace() {
        if (this.raceStarted) {
            console.warn('Гонка уже запущена');
            return;
        }
        
        if (!this.selectedSnail) {
            console.warn('Невозможно начать гонку: улитка не выбрана');
            UI.showError('Выберите улитку', 'Пожалуйста, выберите улитку перед началом гонки');
            return;
        }
        
        try {
            console.log('Начало гонки...');
            this.raceStarted = true;
            
            // Показываем экран загрузки
            UI.showLoadingScreen();
            
            // Инициализируем улиток
            await this.initializeSlugs();
            
            // Запускаем игровой цикл
            this.gameCycle.start({
                maze: this.maze,
                slugs: this.slugManager.getSlugs(),
                renderer: this.renderer,
                playerSlug: this.selectedSnail,
                onUpdate: this.updateRace.bind(this),
                onFinish: this.endRace.bind(this)
            });
            
            // Скрываем экран загрузки
            UI.hideLoadingScreen();
            
            console.log('Гонка успешно запущена');
        } catch (error) {
            console.error('Ошибка при запуске гонки:', error);
            UI.showError('Ошибка при запуске гонки', error);
            UI.hideLoadingScreen();
            this.raceStarted = false;
        }
    }
    
    /**
     * Инициализирует улиток для гонки
     * @returns {Promise} Promise, завершающийся после инициализации улиток
     */
    async initializeSlugs() {
        try {
            // Проверяем наличие менеджера улиток
            if (!this.slugManager) {
                throw new Error('SlugManager не инициализирован');
            }
            
            // Создаем улиток для гонки
            this.slugManager.initialize({
                maze: this.maze,
                canvas: this.canvas,
                selectedType: this.selectedSnail,
                opponentTypes: ['racer', 'explorer', 'snake', 'stubborn'].filter(
                    type => type !== this.selectedSnail
                ).slice(0, 3)
            });
            
            console.log('Улитки успешно инициализированы');
            return this.slugManager.getSlugs();
        } catch (error) {
            console.error('Ошибка при инициализации улиток:', error);
            throw error;
        }
    }
    
    /**
     * Обновляет состояние гонки
     * @param {Object} state - Текущее состояние гонки
     */
    updateRace(state) {
        // Обновляем таймер
        UI.updateRaceTimer(state.elapsedTime);
    }
    
    /**
     * Завершает гонку
     * @param {Object} results - Результаты гонки
     */
    endRace(results) {
        if (!this.raceStarted || this.raceFinished) {
            return;
        }
        
        this.raceFinished = true;
        console.log('Гонка завершена:', results);
        
        // Останавливаем игровой цикл
        this.gameCycle.stop();
        
        // Определяем, выиграл ли игрок
        const isWin = results.winner === this.selectedSnail;
        const winAmount = isWin ? this.betAmount * GAME_CONFIG.BETTING.WIN_MULTIPLIER : 0;
        
        // Показываем результаты
        UI.showRaceResults({
            isWin,
            betAmount: this.betAmount,
            winAmount
        }, this.resetGame);
    }
    
    /**
     * Сбрасывает состояние игры для новой гонки
     */
    async resetGame() {
        console.log('Сброс игры...');
        
        this.raceStarted = false;
        this.raceFinished = false;
        this.selectedSnail = null;
        
        // Сбрасываем UI
        UI.updateSelectedSnailInfo(null);
        UI.updateRaceTimer(0);
        
        // Генерируем новый лабиринт
        await this.initializeMaze();
        
        console.log('Игра успешно сброшена');
    }
} 