/**
 * Модуль управления игровым циклом
 * Координирует все этапы гонки: подготовка, старт, процесс, финиш
 */

class GameCycle {
    /**
     * Создает менеджер игрового цикла
     * @param {Object} options - Параметры инициализации
     * @param {SlugManager} options.slugManager - Менеджер улиток
     * @param {Canvas} options.canvas - Элемент canvas для отрисовки
     */
    constructor(options = {}) {
        this.slugManager = options.slugManager || null;
        this.canvas = options.canvas || null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Состояние игрового цикла
        this.state = 'idle'; // idle, preparing, running, finished
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.winnerDetermined = false;
        this.winner = null;
        
        // Обработчики событий
        this.onRaceStart = null;
        this.onRaceUpdate = null;
        this.onRaceFinish = null;
        this.onWinnerDetermined = null;
        
        // Привязка методов
        this.update = this.update.bind(this);
        
        console.log('GameCycle: создан экземпляр');
    }
    
    /**
     * Подготавливает гонку к запуску
     * @param {Object} options - Параметры гонки
     */
    prepare(options = {}) {
        this.state = 'preparing';
        
        if (!this.slugManager) {
            console.error('SlugManager не определен для GameCycle');
            return false;
        }
        
        // Сброс состояния
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.winnerDetermined = false;
        this.winner = null;
        
        try {
            // Создаем новый лабиринт
            const mazeWidth = options.mazeWidth || 20;
            const mazeHeight = options.mazeHeight || 15;
            
            // Получаем случайный стиль для лабиринта
            let mazeStyle = null;
            if (typeof window.getRandomMazeStyle === 'function') {
                mazeStyle = window.getRandomMazeStyle();
            }
            
            // Создаем лабиринт с выбранным стилем
            const maze = new Maze(mazeWidth, mazeHeight, mazeStyle);
            
            // Генерируем лабиринт с заданными параметрами
            maze.generate({
                complexity: 0.6,     // Сложность лабиринта
                branchFactor: 0.4,   // Коэффициент ветвления
                randomStart: false,  // Старт всегда в верхнем левом углу
                randomFinish: false  // Финиш всегда в нижнем правом углу
            });
            
            console.log('Создан новый лабиринт:', maze.width, 'x', maze.height);
            
            // Устанавливаем лабиринт в глобальную переменную
            window.maze = maze;
            
            // Настраиваем менеджер улиток
            this.slugManager.setMaze(maze);
            this.slugManager.prepareRace();
            
            console.log('Игровой цикл: подготовка к гонке завершена');
            return true;
        } catch (error) {
            console.error('Ошибка при подготовке гонки:', error);
            return false;
        }
    }
    
    /**
     * Запускает игровой цикл
     */
    start() {
        if (this.state === 'running') return;
        
        this.state = 'running';
        this.isRunning = true;
        this.startTime = performance.now();
        
        // Запуск улиток
        if (this.slugManager) {
            this.slugManager.startRace();
        }
        
        // Запуск игрового цикла
        requestAnimationFrame(this.update);
        
        // Вызов обработчика события
        if (typeof this.onRaceStart === 'function') {
            this.onRaceStart();
        }
        
        console.log('Игровой цикл: гонка запущена');
    }
    
    /**
     * Приостанавливает игровой цикл
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        
        console.log('Игровой цикл: гонка приостановлена');
    }
    
    /**
     * Возобновляет игровой цикл
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        requestAnimationFrame(this.update);
        
        console.log('Игровой цикл: гонка возобновлена');
    }
    
    /**
     * Останавливает игровой цикл
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        this.state = 'finished';
        
        // Останавливаем улиток
        if (this.slugManager) {
            this.slugManager.stopRace();
        }
        
        console.log('Игровой цикл: гонка остановлена');
        
        // Вызов обработчика события
        if (typeof this.onRaceFinish === 'function') {
            this.onRaceFinish({
                winner: this.winner,
                elapsedTime: this.elapsedTime
            });
        }
    }
    
    /**
     * Обновляет состояние игрового цикла
     * @param {number} timestamp - Временная метка текущего кадра
     */
    update(timestamp) {
        if (!this.isRunning || this.isPaused) return;
        
        // Обновление времени
        this.elapsedTime = (timestamp - this.startTime) / 1000;
        
        // Обновление улиток
        if (this.slugManager) {
            this.slugManager.update(timestamp);
            
            // Проверка на наличие победителя
            if (this.slugManager.isRaceFinished && !this.winnerDetermined) {
                this.winnerDetermined = true;
                this.winner = this.slugManager.winner;
                
                // Вызов обработчика события
                if (typeof this.onWinnerDetermined === 'function') {
                    this.onWinnerDetermined(this.winner);
                }
                
                console.log('Игровой цикл: определен победитель', this.winner?.type);
                
                // Остановка гонки через небольшую задержку
                setTimeout(() => this.stop(), 1000);
            }
        }
        
        // Вызов обработчика события
        if (typeof this.onRaceUpdate === 'function') {
            this.onRaceUpdate({
                timestamp,
                elapsedTime: this.elapsedTime
            });
        }
        
        // Продолжение цикла
        if (this.isRunning && !this.isPaused) {
            requestAnimationFrame(this.update);
        }
    }
    
    /**
     * Проверяет, завершена ли гонка
     * @returns {boolean} True, если гонка завершена
     */
    isFinished() {
        return this.state === 'finished';
    }
    
    /**
     * Устанавливает обработчик события начала гонки
     * @param {Function} callback - Функция-обработчик
     */
    setOnRaceStart(callback) {
        this.onRaceStart = callback;
    }
    
    /**
     * Устанавливает обработчик события обновления гонки
     * @param {Function} callback - Функция-обработчик
     */
    setOnRaceUpdate(callback) {
        this.onRaceUpdate = callback;
    }
    
    /**
     * Устанавливает обработчик события завершения гонки
     * @param {Function} callback - Функция-обработчик
     */
    setOnRaceFinish(callback) {
        this.onRaceFinish = callback;
    }
    
    /**
     * Устанавливает обработчик события определения победителя
     * @param {Function} callback - Функция-обработчик
     */
    setOnWinnerDetermined(callback) {
        this.onWinnerDetermined = callback;
    }
}

// Делаем класс доступным глобально
window.GameCycle = GameCycle;
