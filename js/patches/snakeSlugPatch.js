/**
 * Патч для улитки типа "Змейка"
 * 
 * Характеристики:
 * - Маневренная улитка, предпочитающая извилистые пути
 * - Движется зигзагами даже по прямым коридорам
 * - Способна быстро выбираться из тупиков
 * - Может выбирать обходные пути
 * - Предпочитает "текучее" движение без резких остановок
 */

class SnakeSlug {
    /**
     * Применяет патч к классу Slug
     */
    static applyPatch() {
        console.log("Применяем патч для улитки-змейки...");
        
        // Проверяем, что класс Slug существует
        if (typeof Slug !== 'function') {
            console.error("Не найден класс Slug. Патч не применен.");
            return false;
        }
        
        // Сохраняем оригинальные методы
        const originalGeneratePath = Slug.prototype.generatePath;
        const originalInitSlugTypeParameters = Slug.prototype.initSlugTypeParameters;
        const originalMoveToNextPoint = Slug.prototype.moveToNextPoint;
        const originalUpdateRotation = Slug.prototype.updateRotation;
        
        // Переопределяем метод инициализации параметров для типа "Змейка"
        Slug.prototype.initSlugTypeParameters = function() {
            // Вызываем оригинальный метод
            originalInitSlugTypeParameters.call(this);
            
            // Усиливаем характеристики змейки, если это змейка
            if (this.type === 'snake') {
                console.log("Применение патча для улитки-змейки:", this.colorName);
                
                // Параметры зигзаг-движения
                this.zigzagProbability = 0.7;       // Вероятность движения зигзагом
                this.longRouteProbability = 0.5;    // Вероятность выбора длинного обходного маршрута
                this.escapeDeadEndSpeed = 1.3;      // Коэффициент скорости выхода из тупика (30% быстрее)
                
                // Параметры для паттерна движения змейкой
                this.snakePattern = { 
                    step: 0,                        // Текущий шаг паттерна
                    direction: 'forward',           // Направление движения
                    maxSteps: 3 + Math.floor(Math.random() * 4) // Количество шагов до смены направления
                };
                
                // Последние выбранные направления для создания плавных поворотов
                this.lastDirections = [];
                
                // Умеренная скорость с хорошей маневренностью
                this.BASE_SPEED = 55;
                this.speed = this.BASE_SPEED + (Math.random() * 15 - 7.5);
            }
        };
        
        // Переопределяем метод generatePath для типа "Змейка"
        Slug.prototype.generatePath = function() {
            // Если это не змейка, используем стандартный метод
            if (this.type !== 'snake') {
                return originalGeneratePath.call(this);
            }
            
            // Если улитка достигла финиша, не меняем путь
            if (this.hasFinished) return;
            
            // Проверяем, находимся ли мы в тупике
            if (this.isInDeadEnd()) {
                console.log(`Змейка ${this.colorName} быстро выбирается из тупика`);
                
                // Временное ускорение для выхода из тупика
                const originalSpeed = this.speed;
                this.speed *= this.escapeDeadEndSpeed;
                
                // Через 1 секунду возвращаем нормальную скорость
                if (this.scene && this.scene.time) {
                    this.scene.time.delayedCall(1000, () => {
                        this.speed = originalSpeed;
                    });
                } else {
                    // Запасной вариант, если scene.time недоступен
                    setTimeout(() => {
                        this.speed = originalSpeed;
                    }, 1000);
                }
                
                // Выбираем путь к выходу из тупика
                const pathToFinish = this.findPathToFinish();
                if (pathToFinish && pathToFinish.length > 0) {
                    this.path = pathToFinish;
                    this.currentPathIndex = 0;
                    return;
                }
            }
            
            // Проверяем, нужно ли применить зигзаг-движение
            if (Math.random() < this.zigzagProbability) {
                // Создаем зигзагообразный путь
                const zigzagPath = this.createZigzagPath();
                if (zigzagPath && zigzagPath.length > 1) {
                    console.log(`Змейка ${this.colorName} движется зигзагом`);
                    this.path = zigzagPath;
                    this.currentPathIndex = 0;
                    return;
                }
            }
            
            // Проверяем, нужно ли выбрать длинный обходной путь
            if (Math.random() < this.longRouteProbability) {
                const longPath = this.findAlternativePath();
                if (longPath && longPath.length > 2) {
                    console.log(`Змейка ${this.colorName} выбирает обходной путь`);
                    this.path = longPath;
                    this.currentPathIndex = 0;
                    return;
                }
            }
            
            // В остальных случаях идем к финишу обычным путем
            const pathToFinish = this.findPathToFinish();
            if (pathToFinish && pathToFinish.length > 0) {
                this.path = pathToFinish;
                this.currentPathIndex = 0;
            } else {
                // Если путь к финишу не найден, идем случайно
                const randomPath = this.generateRandomPath(3);
                if (randomPath && randomPath.length > 0) {
                    this.path = randomPath;
                    this.currentPathIndex = 0;
                }
            }
        };
        
        // Добавляем проверку на наличие ячейки в лабиринте
        Slug.prototype.isValidPosition = function(row, col) {
            if (!this.maze) return false;
            
            // Проверяем границы лабиринта
            return row >= 0 && col >= 0 && row < this.maze.length && col < this.maze[0].length;
        };
        
        // Добавляем метод для проверки типа ячейки
        Slug.prototype.getCellType = function(row, col) {
            if (!this.isValidPosition(row, col)) return null;
            
            // Проверяем, есть ли у maze метод getCell
            if (this.maze.getCell) {
                const cell = this.maze.getCell(row, col);
                return cell ? cell.type : null;
            } else {
                // Альтернативный вариант - напрямую обращаемся к массиву лабиринта
                return this.maze[row][col];
            }
        };
        
        // Обновление метода для проверки, является ли ячейка стеной
        Slug.prototype.isWall = function(row, col) {
            const cellType = this.getCellType(row, col);
            return cellType === 1; // Обычно 1 - это код стены
        };
        
        // Обновление метода для проверки, является ли ячейка проходимой
        Slug.prototype.isPath = function(row, col) {
            const cellType = this.getCellType(row, col);
            // Проходимыми считаются пустые ячейки (0), старт (2) и финиш (3)
            return cellType === 0 || cellType === 2 || cellType === 3;
        };
        
        // Вспомогательный метод для анимации движения змейки
        Slug.prototype.animateSnakeMovement = function() {
            this.safeTweens(tweens => {
                tweens.add({
                    targets: this.sprite,
                    scaleX: 1.2,
                    scaleY: 0.8,
                    duration: 200,
                    yoyo: true,
                    repeat: 0
                });
            });
        };
        
        // Переопределяем метод isInDeadEnd для проверки тупика
        Slug.prototype.isInDeadEnd = function() {
            const neighbors = this.getValidNeighbors();
            // Тупик - это когда есть только один выход
            return neighbors.length === 1;
        };
        
        // Получаем соседние ячейки, в которые можно пойти
        Slug.prototype.getValidNeighbors = function() {
            return this.getValidNeighborsAt(this.row, this.col);
        };
        
        // Получаем соседние ячейки для указанной позиции
        Slug.prototype.getValidNeighborsAt = function(row, col) {
            const neighbors = [];
            
            // Проверяем все четыре направления
            const directions = [
                { dr: -1, dc: 0 }, // Вверх
                { dr: 0, dc: 1 },  // Вправо
                { dr: 1, dc: 0 },  // Вниз
                { dr: 0, dc: -1 }  // Влево
            ];
            
            for (const dir of directions) {
                const newRow = row + dir.dr;
                const newCol = col + dir.dc;
                
                if (this.isValidMove(newRow, newCol)) {
                    neighbors.push({ row: newRow, col: newCol });
                }
            }
            
            return neighbors;
        };
        
        // Проверяем, является ли движение в указанную ячейку допустимым
        Slug.prototype.isValidMove = function(row, col) {
            return this.isValidPosition(row, col) && this.isPath(row, col);
        };
        
        // Метод для поиска пути к финишу
        Slug.prototype.findPathToFinish = function() {
            if (!this.finishRow || !this.finishCol) {
                return [];
            }
            
            return this.findPathFrom(this.row, this.col, this.finishRow, this.finishCol);
        };
        
        // Метод для поиска пути между двумя точками
        Slug.prototype.findPathFrom = function(startRow, startCol, endRow, endCol) {
            // Реализация поиска пути методом BFS
            const queue = [{ row: startRow, col: startCol, path: [] }];
            const visited = {};
            
            while (queue.length > 0) {
                const current = queue.shift();
                const key = `${current.row},${current.col}`;
                
                if (visited[key]) continue;
                visited[key] = true;
                
                // Если достигли цели, возвращаем путь
                if (current.row === endRow && current.col === endCol) {
                    return [...current.path, { row: current.row, col: current.col }];
                }
                
                // Получаем соседние ячейки
                const neighbors = this.getValidNeighborsAt(current.row, current.col);
                
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.row},${neighbor.col}`;
                    if (!visited[neighborKey]) {
                        queue.push({
                            row: neighbor.row,
                            col: neighbor.col,
                            path: [...current.path, { row: current.row, col: current.col }]
                        });
                    }
                }
            }
            
            return []; // Путь не найден
        };
        
        // Метод для обновления турбо-ускорения
        Slug.prototype.updateTurboBoost = function(deltaTime) {
            // Реализация обновления турбо-ускорения
            if (this.turboBoostActive) {
                this.turboBoostTimer -= deltaTime;
                if (this.turboBoostTimer <= 0) {
                    this.turboBoostActive = false;
                    this.speed = this.BASE_SPEED;
                }
            }
            
            // Случайный шанс получить ускорение
            if (!this.turboBoostActive && Math.random() < this.turboBoostProbability) {
                this.turboBoostActive = true;
                this.turboBoostTimer = this.turboBoostDuration[0] + Math.random() * (this.turboBoostDuration[1] - this.turboBoostDuration[0]);
                this.speed = this.BASE_SPEED * this.turboBoostMultiplier;
                
                this.safeTweens(tweens => {
                    tweens.add({
                        targets: this.sprite,
                        scaleX: 1.3,
                        scaleY: 0.7,
                        duration: 200,
                        yoyo: true,
                        repeat: 0
                    });
                });
            }
        };
        
        console.log("Патч для улитки типа 'Змейка' успешно применен");
        return true;
    }
}

// Регистрируем патч при загрузке файла
try {
    if (window.patchLoader) {
        window.patchLoader.registerPatch('snake', SnakeSlug.applyPatch);
        console.log("Патч улитки-змейки успешно зарегистрирован");
    } else {
        console.error("Загрузчик патчей не найден");
    }
} catch (error) {
    console.error("Ошибка при регистрации патча улитки-змейки:", error);
} 