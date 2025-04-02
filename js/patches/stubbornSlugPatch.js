/**
 * Патч для улитки типа "Упрямый"
 * 
 * Характеристики:
 * - Упрямо движется вперед, редко меняет направление
 * - Высокая вероятность продолжать движение в выбранном направлении
 * - Может ускоряться при движении по прямой
 * - Редко, но может резко развернуться назад
 * - Более эффективна в лабиринтах с длинными прямыми проходами
 */

class StubbornSlug {
    /**
     * Применяет патч к классу Slug
     */
    static applyPatch() {
        console.log("Применяем патч для упрямой улитки...");
        
        // Проверяем, что класс Slug существует
        if (typeof Slug !== 'function') {
            console.error("Не найден класс Slug. Патч не применен.");
            return false;
        }
        
        // Сохраняем оригинальные методы
        const originalGeneratePath = Slug.prototype.generatePath;
        const originalInitSlugTypeParameters = Slug.prototype.initSlugTypeParameters;
        const originalMoveToNextPoint = Slug.prototype.moveToNextPoint;
        
        // Переопределяем метод инициализации параметров для типа "Упрямый"
        Slug.prototype.initSlugTypeParameters = function() {
            // Вызываем оригинальный метод
            originalInitSlugTypeParameters.call(this);
            
            // Усиливаем характеристики упрямой улитки, если это упрямый тип
            if (this.type === 'stubborn') {
                console.log("Применение патча для упрямой улитки:", this.colorName);
                
                // Основные параметры упрямства
                this.forwardProbability = 0.85;     // Вероятность продолжать движение прямо
                this.backtrackProbability = 0.05;   // Вероятность разворота назад (1 раз за гонку)
                this.accelerationProbability = 0.4; // Вероятность ускорения при движении прямо
                this.accelerationBoost = 1.1;       // Коэффициент ускорения (10%)
                this.accelerationDuration = 2000;   // Длительность ускорения (мс)
                
                // Дополнительные параметры
                this.consecutiveForwardMoves = 0;   // Счетчик последовательных движений вперед
                this.stubbornBacktrackUsed = false; // Флаг использования резкого разворота
                this.currentAccelerationTimer = 0;  // Таймер текущего ускорения
                this.lastDirection = null;          // Последнее направление движения
                
                // Средне-высокая базовая скорость
                this.BASE_SPEED = 60;
                this.speed = this.BASE_SPEED + (Math.random() * 10 - 5);
                this.originalSpeed = this.speed;    // Запоминаем оригинальную скорость
            }
        };
        
        // Переопределяем метод generatePath для типа "Упрямый"
        Slug.prototype.generatePath = function() {
            // Если это не упрямый тип, используем стандартный метод
            if (this.type !== 'stubborn') {
                return originalGeneratePath.call(this);
            }
            
            // Если улитка достигла финиша, не меняем путь
            if (this.hasFinished) return;
            
            // Пробуем продолжать движение в том же направлении
            if (this.lastDirection && Math.random() < this.forwardProbability) {
                const neighbors = this.getValidNeighbors();
                
                // Проверяем, можем ли мы продолжать в текущем направлении
                const directionMap = {
                    'up': { dRow: -1, dCol: 0 },
                    'down': { dRow: 1, dCol: 0 },
                    'left': { dRow: 0, dCol: -1 },
                    'right': { dRow: 0, dCol: 1 }
                };
                
                const dirDelta = directionMap[this.lastDirection];
                
                if (dirDelta) {
                    const nextRow = this.row + dirDelta.dRow;
                    const nextCol = this.col + dirDelta.dCol;
                    
                    // Проверяем, можно ли двигаться в этом направлении
                    if (this.isValidMove(nextRow, nextCol)) {
                        console.log(`Упрямая улитка ${this.colorName} упрямо продолжает двигаться ${this.lastDirection}`);
                        
                        this.path = [
                            { row: this.row, col: this.col },
                            { row: nextRow, col: nextCol }
                        ];
                        this.currentPathIndex = 0;
                        
                        // Увеличиваем счетчик последовательных движений вперед
                        this.consecutiveForwardMoves++;
                        
                        // Проверяем, не пора ли ускориться
                        if (Math.random() < this.accelerationProbability && this.currentAccelerationTimer <= 0) {
                            this.speed = this.originalSpeed * this.accelerationBoost;
                            this.currentAccelerationTimer = this.accelerationDuration;
                            
                            console.log(`Упрямая улитка ${this.colorName} ускоряется на прямом участке`);
                            
                            // Анимация ускорения
                            this.scene.tweens.add({
                                targets: this.sprite,
                                scaleX: 1.2,
                                scaleY: 0.8,
                                duration: 300,
                                yoyo: true
                            });
                        }
                        
                        return;
                    }
                }
            }
            
            // Проверяем, не пора ли сделать резкий разворот (если еще не использовали)
            if (!this.stubbornBacktrackUsed && Math.random() < this.backtrackProbability) {
                // Находим обратное направление
                const oppositeDirections = {
                    'up': 'down',
                    'down': 'up',
                    'left': 'right',
                    'right': 'left'
                };
                
                const oppositeDir = oppositeDirections[this.lastDirection];
                
                if (oppositeDir) {
                    const dirMap = {
                        'up': { dRow: -1, dCol: 0 },
                        'down': { dRow: 1, dCol: 0 },
                        'left': { dRow: 0, dCol: -1 },
                        'right': { dRow: 0, dCol: 1 }
                    };
                    
                    const dirDelta = dirMap[oppositeDir];
                    
                    if (dirDelta) {
                        const nextRow = this.row + dirDelta.dRow;
                        const nextCol = this.col + dirDelta.dCol;
                        
                        // Проверяем, можно ли двигаться в обратном направлении
                        if (this.isValidMove(nextRow, nextCol)) {
                            console.log(`Упрямая улитка ${this.colorName} резко разворачивается назад!`);
                            
                            this.path = [
                                { row: this.row, col: this.col },
                                { row: nextRow, col: nextCol }
                            ];
                            this.currentPathIndex = 0;
                            
                            // Помечаем разворот как использованный (только один раз за гонку)
                            this.stubbornBacktrackUsed = true;
                            
                            // Сбрасываем счетчик последовательных движений вперед
                            this.consecutiveForwardMoves = 0;
                            
                            // Анимация резкого разворота
                            this.scene.tweens.add({
                                targets: this.sprite,
                                angle: '-=180',
                                duration: 400,
                                ease: 'Cubic.easeOut'
                            });
                            
                            return;
                        }
                    }
                }
            }
            
            // Если продолжение движения вперед или разворот невозможны,
            // сбрасываем счетчик последовательных движений вперед
            this.consecutiveForwardMoves = 0;
            
            // И ищем прямой путь к финишу
            this.path = this.findPathToFinish();
            this.currentPathIndex = 0;
            
            // Если путь к финишу не найден, идем случайно
            if (!this.path || this.path.length <= 1) {
                this.path = this.generateRandomPath(2);
                this.currentPathIndex = 0;
            }
        };
        
        // Переопределяем метод moveToNextPoint для отслеживания направления и обновления ускорения
        Slug.prototype.moveToNextPoint = function() {
            // Сохраняем предыдущие координаты
            const prevRow = this.row;
            const prevCol = this.col;
            
            // Вызываем оригинальный метод
            const result = originalMoveToNextPoint.call(this);
            
            // Если это упрямый тип, обновляем направление и таймер ускорения
            if (this.type === 'stubborn' && this.isMoving && !this.hasFinished) {
                // Определяем направление движения
                if (this.row < prevRow) this.lastDirection = 'up';
                else if (this.row > prevRow) this.lastDirection = 'down';
                else if (this.col < prevCol) this.lastDirection = 'left';
                else if (this.col > prevCol) this.lastDirection = 'right';
                
                // Обновляем таймер ускорения
                if (this.currentAccelerationTimer > 0) {
                    this.currentAccelerationTimer -= 16; // Примерно 60 FPS
                    
                    // Если таймер истек, возвращаем обычную скорость
                    if (this.currentAccelerationTimer <= 0) {
                        this.speed = this.originalSpeed;
                        console.log(`Упрямая улитка ${this.colorName} возвращается к обычной скорости`);
                    }
                }
            }
            
            return result;
        };
        
        console.log("Патч для улитки типа 'Упрямый' успешно применен");
        return true;
    }
}

// Регистрируем патч при загрузке файла
try {
    if (window.patchLoader) {
        window.patchLoader.registerPatch('stubborn', StubbornSlug.applyPatch);
        console.log("Патч упрямой улитки успешно зарегистрирован");
    } else {
        console.error("Загрузчик патчей не найден");
    }
} catch (error) {
    console.error("Ошибка при регистрации патча упрямой улитки:", error);
} 