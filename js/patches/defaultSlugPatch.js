/**
 * Патч для улитки типа "Тупичок" (Дефолтная улитка)
 * 
 * Характеристики:
 * - Сбалансированная, стандартная улитка
 * - Средняя скорость
 * - Иногда случайные повороты
 * - Любит заходить в тупики и "исследовать" их
 * - Долго "размышляет" в тупиках
 */

class DefaultSlug {
    /**
     * Применяет патч к классу Slug
     */
    static applyPatch() {
        console.log("Применяем патч для улитки типа Тупичок...");
        
        // Проверяем, что класс Slug существует
        if (typeof Slug !== 'function') {
            console.error("Не найден класс Slug. Патч не применен.");
            return false;
        }
        
        // Сохраняем оригинальные методы
        const originalInitSlugTypeParameters = Slug.prototype.initSlugTypeParameters;
        const originalGeneratePath = Slug.prototype.generatePath;
        
        // Переопределяем метод инициализации параметров
        Slug.prototype.initSlugTypeParameters = function() {
            // Вызываем оригинальный метод
            originalInitSlugTypeParameters.call(this);
            
            // Усиливаем характеристики для типа "deadender"
            if (this.type === 'deadender') {
                console.log("Применение патча для улитки типа Тупичок:", this.color);
                
                // Устанавливаем параметры
                this.randomTurnProbability = 0.6;   // Вероятность случайного поворота
                this.deadEndProbability = 0.7;      // Вероятность захода в тупик
                this.pauseInDeadEndTime = 2000;     // Время "размышления" в тупике (мс)
                this.longRouteProbability = 0.4;    // Вероятность выбора самого длинного маршрута
                
                // Средняя скорость
                this.BASE_SPEED = 45;
                this.speed = this.BASE_SPEED + (Math.random() * 10 - 5);
            }
        };
        
        // Переопределяем метод generatePath для типа "deadender"
        Slug.prototype.generatePath = function() {
            // Если это не тупичок, используем стандартный метод
            if (this.type !== 'deadender') {
                return originalGeneratePath.call(this);
            }
            
            // Если улитка достигла финиша, не меняем путь
            if (this.hasFinished) return;
            
            // Проверяем, находимся ли мы в тупике
            if (this.isInDeadEnd()) {
                console.log(`Тупичок ${this.colorName} находится в тупике и размышляет`);
                
                // Устанавливаем паузу для "размышления"
                if (this.pauseTimer <= 0) {
                    this.pauseTimer = this.pauseInDeadEndTime;
                    
                    // Анимация "размышления"
                    this.scene.tweens.add({
                        targets: this.sprite,
                        scaleX: 1.1,
                        scaleY: 0.9,
                        duration: 500,
                        yoyo: true,
                        repeat: 3
                    });
                }
                
                // После паузы выбираем путь к выходу из тупика
                if (this.path && this.path.length > 1) {
                    return;
                }
            }
            
            // Случайный поворот
            if (Math.random() < this.randomTurnProbability) {
                const neighbors = this.getValidNeighbors();
                if (neighbors.length > 0) {
                    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                    this.path = [
                        { row: this.row, col: this.col },
                        { row: randomNeighbor.row, col: randomNeighbor.col }
                    ];
                    this.currentPathIndex = 0;
                    return;
                }
            }
            
            // Проверка на выбор пути в тупик
            if (Math.random() < this.deadEndProbability) {
                // Находим все тупики поблизости
                const deadEnds = this.findNearbyDeadEnds();
                if (deadEnds.length > 0) {
                    const randomDeadEnd = deadEnds[Math.floor(Math.random() * deadEnds.length)];
                    this.path = this.findPathFrom(this.row, this.col, randomDeadEnd.row, randomDeadEnd.col);
                    this.currentPathIndex = 0;
                    console.log(`Тупичок ${this.colorName} направляется в тупик`);
                    return;
                }
            }
            
            // Выбор длинного маршрута
            if (Math.random() < this.longRouteProbability) {
                // Ищем длинный обходной путь
                const longPath = this.findLongPath();
                if (longPath && longPath.length > 2) {
                    this.path = longPath;
                    this.currentPathIndex = 0;
                    console.log(`Тупичок ${this.colorName} выбирает длинный маршрут`);
                    return;
                }
            }
            
            // Если ничего не сработало, используем стандартный путь к финишу
            this.path = this.findPathToFinish();
            this.currentPathIndex = 0;
            
            // Если путь к финишу не найден, идем случайно
            if (!this.path || this.path.length <= 1) {
                this.path = this.generateRandomPath(2);
                this.currentPathIndex = 0;
            }
        };
        
        // Добавляем метод для поиска тупиков
        Slug.prototype.findNearbyDeadEnds = function() {
            const deadEnds = [];
            const maxDistance = 10; // Максимальное расстояние поиска
            
            // Проходим по лабиринту в радиусе maxDistance от улитки
            for (let row = Math.max(0, this.row - maxDistance); row < Math.min(this.row + maxDistance, this.maze.length); row++) {
                for (let col = Math.max(0, this.col - maxDistance); col < Math.min(this.col + maxDistance, this.maze[row].length); col++) {
                    // Проверяем, что ячейка проходима
                    if (this.isValidMove(row, col)) {
                        // Проверяем, является ли ячейка тупиком
                        const neighbors = this.getValidNeighborsAt(row, col);
                        if (neighbors.length === 1 && row !== this.finishPoint.row && col !== this.finishPoint.col) {
                            deadEnds.push({ row, col });
                        }
                    }
                }
            }
            
            return deadEnds;
        };
        
        // Добавляем метод для поиска длинного пути
        Slug.prototype.findLongPath = function() {
            // Находим обычный путь к финишу
            const directPath = this.findPathToFinish();
            if (!directPath || directPath.length <= 2) return null;
            
            // Выбираем случайную точку на некотором расстоянии от текущей позиции
            const emptyCells = [];
            const maxDistance = 15; // Максимальное расстояние поиска
            
            for (let row = Math.max(0, this.row - maxDistance); row < Math.min(this.row + maxDistance, this.maze.length); row++) {
                for (let col = Math.max(0, this.col - maxDistance); col < Math.min(this.col + maxDistance, this.maze[row].length); col++) {
                    if (this.isValidMove(row, col)) {
                        // Исключаем точки, которые лежат на прямом пути
                        const isOnDirectPath = directPath.some(point => point.row === row && point.col === col);
                        if (!isOnDirectPath) {
                            const distance = Math.abs(row - this.row) + Math.abs(col - this.col);
                            if (distance > 5) { // Минимальное расстояние для обхода
                                emptyCells.push({ row, col });
                            }
                        }
                    }
                }
            }
            
            if (emptyCells.length === 0) return null;
            
            // Выбираем случайную точку и строим путь через нее
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const pathToPoint = this.findPathFrom(this.row, this.col, randomCell.row, randomCell.col);
            
            if (!pathToPoint || pathToPoint.length <= 1) return null;
            
            const pathFromPointToFinish = this.findPathFrom(
                randomCell.row, randomCell.col, 
                this.finishPoint.row, this.finishPoint.col
            );
            
            if (!pathFromPointToFinish || pathFromPointToFinish.length <= 1) return null;
            
            // Объединяем пути, исключая дублирующуюся точку
            return [...pathToPoint, ...pathFromPointToFinish.slice(1)];
        };
        
        console.log("Патч для улитки типа 'Тупичок' успешно применен");
        return true;
    }
}

// Регистрируем патч при загрузке файла
try {
    if (window.patchLoader) {
        window.patchLoader.registerPatch('deadender', DefaultSlug.applyPatch);
        console.log("Патч улитки-тупичка успешно зарегистрирован");
    } else {
        console.error("Загрузчик патчей не найден");
    }
} catch (error) {
    console.error("Ошибка при регистрации патча улитки-тупичка:", error);
} 