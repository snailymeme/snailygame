/**
 * Патч для улитки типа "Исследователь"
 * 
 * Характеристики:
 * - Любопытная улитка, которая исследует лабиринт
 * - Хорошо справляется с навигацией в сложных лабиринтах
 * - Умное избегание препятствий
 * - Предпочитает изучать неисследованные области
 * - Иногда делает паузы для "осмотра местности"
 */

class ExplorerSlug {
    /**
     * Применяет патч к классу Slug
     */
    static applyPatch() {
        console.log("Применяем патч для улитки-исследователя...");
        
        // Проверяем, что класс Slug существует
        if (typeof Slug !== 'function') {
            console.error("Не найден класс Slug. Патч не применен.");
            return false;
        }
        
        // Сохраняем оригинальные методы
        const originalGeneratePath = Slug.prototype.generatePath;
        const originalInitSlugTypeParameters = Slug.prototype.initSlugTypeParameters;
        const originalMoveToNextPoint = Slug.prototype.moveToNextPoint;
        const originalUpdate = Slug.prototype.update;
        
        // Переопределяем метод инициализации параметров для типа "Исследователь"
        Slug.prototype.initSlugTypeParameters = function() {
            // Вызываем оригинальный метод
            originalInitSlugTypeParameters.call(this);
            
            // Усиливаем характеристики исследователя, если это исследователь
            if (this.type === 'explorer') {
                console.log("Применение патча для улитки-исследователя:", this.colorName);
                
                // Увеличиваем склонность к исследованию
                this.explorationProbability = 0.65; // Вероятность исследования вместо движения к цели
                this.deadEndProbability = 0.40;     // Вероятность захода в тупик
                this.pauseProbability = 0.20;       // Вероятность паузы
                this.pauseDuration = [500, 1500];   // Диапазон длительности паузы (мс)
                
                // Память о посещенных местах
                this.visitedPositions = new Set();
                
                // Склонность к неизведанному
                this.unexploredPreference = 0.7;     // Предпочтение неисследованных путей
                
                // Карта "интересности" областей
                this.interestMap = {};
                
                // Средняя скорость с хорошей реакцией
                this.BASE_SPEED = 55;
                this.speed = this.BASE_SPEED + (Math.random() * 10 - 5);
            }
        };
        
        // Переопределяем метод generatePath для типа "Исследователь"
        Slug.prototype.generatePath = function() {
            // Если это не исследователь, используем стандартный метод
            if (this.type !== 'explorer') {
                return originalGeneratePath.call(this);
            }
            
            // Если улитка достигла финиша, не меняем путь
            if (this.hasFinished) return;
            
            // Обновляем текущую позицию в списке посещенных
            const posKey = `${this.row},${this.col}`;
            this.visitedPositions.add(posKey);
            
            // Проверяем, не пора ли сделать паузу для "осмотра местности"
            if (Math.random() < this.pauseProbability && this.pauseTimer <= 0) {
                const pauseTime = this.getRandomInRange(this.pauseDuration);
                this.pauseTimer = pauseTime;
                console.log(`Исследователь ${this.colorName} делает паузу на ${pauseTime/1000} сек для осмотра`);
                
                // Анимация "осмотра"
                this.scene.tweens.add({
                    targets: this.sprite,
                    angle: [-10, 10, -5, 5, 0],
                    duration: 500,
                    ease: 'Sine.easeInOut'
                });
                
                // В случае паузы не меняем текущий путь
                if (this.path && this.path.length > 1 && this.currentPathIndex < this.path.length) {
                    return;
                }
            }
            
            // Решаем: исследовать или идти к цели
            if (Math.random() < this.explorationProbability) {
                // Режим исследования: выбираем неизведанные области
                const path = this.findPathToUnexploredArea();
                if (path && path.length > 1) {
                    console.log(`Исследователь ${this.colorName} отправляется исследовать новую область`);
                    this.path = path;
                    this.currentPathIndex = 0;
                    return;
                }
            }
            
            // Если не выбран путь для исследования, идем к финишу
            this.path = this.findPathToFinish();
            this.currentPathIndex = 0;
            
            // Если путь к финишу не найден, идем случайно
            if (!this.path || this.path.length <= 1) {
                this.path = this.generateRandomPath(3);
                this.currentPathIndex = 0;
            }
        };
        
        // Добавляем метод для поиска пути к неисследованным областям
        Slug.prototype.findPathToUnexploredArea = function() {
            // Собираем все возможные неисследованные точки в радиусе видимости
            const unexploredPoints = [];
            const maxDistance = 15; // Максимальное расстояние поиска
            
            for (let row = Math.max(0, this.row - maxDistance); row < Math.min(this.row + maxDistance, this.maze.length); row++) {
                for (let col = Math.max(0, this.col - maxDistance); col < Math.min(this.col + maxDistance, this.maze[row].length); col++) {
                    const posKey = `${row},${col}`;
                    
                    // Проверяем, что точка проходима и еще не посещена
                    if (this.isValidMove(row, col) && !this.visitedPositions.has(posKey)) {
                        // Оцениваем "интересность" точки (например, близость к другим неисследованным областям)
                        const interestScore = this.calculateInterestScore(row, col);
                        unexploredPoints.push({
                            row,
                            col,
                            interestScore,
                            distance: Math.abs(row - this.row) + Math.abs(col - this.col)
                        });
                    }
                }
            }
            
            // Если нет неисследованных точек, вернем null
            if (unexploredPoints.length === 0) {
                return null;
            }
            
            // Сортируем точки по интересу и расстоянию
            unexploredPoints.sort((a, b) => {
                // Предпочитаем высокий интерес и близкое расстояние
                return (b.interestScore * 2) - (a.distance / 3) - (a.interestScore * 2) + (b.distance / 3);
            });
            
            // Берем топ-3 самых интересных точек и выбираем случайную из них
            const topPoints = unexploredPoints.slice(0, Math.min(3, unexploredPoints.length));
            const selectedPoint = topPoints[Math.floor(Math.random() * topPoints.length)];
            
            // Находим путь к выбранной точке
            return this.findPathFrom(this.row, this.col, selectedPoint.row, selectedPoint.col);
        };
        
        // Метод для оценки "интересности" точки
        Slug.prototype.calculateInterestScore = function(row, col) {
            const posKey = `${row},${col}`;
            
            // Если у нас уже есть оценка для этой точки, используем ее
            if (this.interestMap[posKey] !== undefined) {
                return this.interestMap[posKey];
            }
            
            // Базовый интерес
            let interest = 0.5;
            
            // Добавляем случайность
            interest += Math.random() * 0.3;
            
            // Повышаем интерес у точек, которые ведут к большему количеству неисследованных областей
            const neighbors = this.getValidNeighborsAt(row, col);
            const unexploredNeighbors = neighbors.filter(n => {
                const neighborKey = `${n.row},${n.col}`;
                return !this.visitedPositions.has(neighborKey);
            });
            
            interest += unexploredNeighbors.length * 0.1;
            
            // Повышаем интерес к точкам, которые ближе к финишу (но не слишком сильно)
            const distanceToFinish = Math.abs(row - this.finishPoint.row) + Math.abs(col - this.finishPoint.col);
            const normalizedDistance = Math.min(1, distanceToFinish / (this.maze.length + this.maze[0].length));
            interest += (1 - normalizedDistance) * 0.2;
            
            // Сохраняем оценку
            this.interestMap[posKey] = interest;
            
            return interest;
        };
        
        // Переопределяем метод moveToNextPoint для отслеживания посещенных мест
        Slug.prototype.moveToNextPoint = function() {
            const result = originalMoveToNextPoint.call(this);
            
            // Если это исследователь, обновляем карту посещенных мест
            if (this.type === 'explorer' && this.isMoving && !this.hasFinished) {
                const posKey = `${this.row},${this.col}`;
                this.visitedPositions.add(posKey);
            }
            
            return result;
        };
        
        console.log("Патч для улитки типа 'Исследователь' успешно применен");
        return true;
    }
}

// Регистрируем патч при загрузке файла
try {
    if (window.patchLoader) {
        window.patchLoader.registerPatch('explorer', ExplorerSlug.applyPatch);
        console.log("Патч улитки-исследователя успешно зарегистрирован");
    } else {
        console.error("Загрузчик патчей не найден");
    }
} catch (error) {
    console.error("Ошибка при регистрации патча улитки-исследователя:", error);
} 