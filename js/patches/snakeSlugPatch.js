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
                this.scene.time.delayedCall(1000, () => {
                    this.speed = originalSpeed;
                });
                
                // Выбираем путь к выходу из тупика
                this.path = this.findPathToFinish();
                this.currentPathIndex = 0;
                return;
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
            this.path = this.findPathToFinish();
            this.currentPathIndex = 0;
            
            // Если путь к финишу не найден, идем случайно
            if (!this.path || this.path.length <= 1) {
                this.path = this.generateRandomPath(3);
                this.currentPathIndex = 0;
            }
        };
        
        // Метод для создания зигзагообразного пути
        Slug.prototype.createZigzagPath = function() {
            // Находим базовый путь к финишу
            const directPath = this.findPathToFinish();
            if (!directPath || directPath.length <= 2) {
                return null;
            }
            
            // Создаем новый путь с зигзагами
            const zigzagPath = [{ row: this.row, col: this.col }];
            let currentRow = this.row;
            let currentCol = this.col;
            
            // Берем только первые несколько шагов (3-5) для зигзага
            const steps = Math.min(directPath.length - 1, 3 + Math.floor(Math.random() * 3));
            const target = directPath[steps];
            
            // Общее направление к цели
            const mainDirRow = Math.sign(target.row - currentRow);
            const mainDirCol = Math.sign(target.col - currentCol);
            
            // Делаем зигзаги на пути к цели
            while ((currentRow !== target.row || currentCol !== target.col) && zigzagPath.length < 10) {
                const possibleMoves = [];
                
                // Приоритезируем движение в основном направлении
                if (currentRow !== target.row) {
                    const newRow = currentRow + mainDirRow;
                    if (this.isValidMove(newRow, currentCol)) {
                        possibleMoves.push({ row: newRow, col: currentCol, priority: 2 });
                    }
                }
                
                if (currentCol !== target.col) {
                    const newCol = currentCol + mainDirCol;
                    if (this.isValidMove(currentRow, newCol)) {
                        possibleMoves.push({ row: currentRow, col: newCol, priority: 2 });
                    }
                }
                
                // Добавляем возможность отклониться от прямого пути для создания зигзага
                const directions = [
                    { dRow: 0, dCol: 1 },
                    { dRow: 1, dCol: 0 },
                    { dRow: 0, dCol: -1 },
                    { dRow: -1, dCol: 0 }
                ];
                
                for (const dir of directions) {
                    const newRow = currentRow + dir.dRow;
                    const newCol = currentCol + dir.dCol;
                    
                    // Проверяем, что это валидное движение и оно не отдаляет нас от цели слишком сильно
                    if (this.isValidMove(newRow, newCol)) {
                        const currentDist = Math.abs(target.row - currentRow) + Math.abs(target.col - currentCol);
                        const newDist = Math.abs(target.row - newRow) + Math.abs(target.col - newCol);
                        
                        // Если новое расстояние не сильно больше текущего
                        if (newDist <= currentDist + 2) {
                            // Проверяем, не повторяем ли мы предыдущий ход (избегаем движения вперед-назад)
                            const lastPos = zigzagPath[zigzagPath.length - 1];
                            if (!(lastPos && lastPos.row === newRow && lastPos.col === newCol)) {
                                // Приоритет в зависимости от того, уменьшается ли расстояние до цели
                                const priority = newDist < currentDist ? 3 : 1;
                                possibleMoves.push({ row: newRow, col: newCol, priority });
                            }
                        }
                    }
                }
                
                if (possibleMoves.length === 0) {
                    // Если нет возможных ходов, заканчиваем построение пути
                    break;
                }
                
                // Сортируем ходы по приоритету
                possibleMoves.sort((a, b) => b.priority - a.priority);
                
                // Выбираем ход с учетом приоритета, но с элементом случайности
                const topPriority = possibleMoves[0].priority;
                const topMoves = possibleMoves.filter(move => move.priority === topPriority);
                const chosenMove = topMoves[Math.floor(Math.random() * topMoves.length)];
                
                // Обновляем текущую позицию
                currentRow = chosenMove.row;
                currentCol = chosenMove.col;
                
                // Добавляем точку в путь
                zigzagPath.push({ row: currentRow, col: currentCol });
            }
            
            // Если не удалось достичь цели, добавляем путь от последней точки зигзага до цели
            if (currentRow !== target.row || currentCol !== target.col) {
                const remainingPath = this.findPathFrom(currentRow, currentCol, target.row, target.col);
                if (remainingPath && remainingPath.length > 1) {
                    // Добавляем путь, исключая первую точку (она уже есть в zigzagPath)
                    zigzagPath.push(...remainingPath.slice(1));
                }
            }
            
            // Если путь слишком короткий, добавляем путь до финиша
            if (zigzagPath.length < 3) {
                return directPath;
            }
            
            return zigzagPath;
        };
        
        // Метод для поиска альтернативного (обходного) пути
        Slug.prototype.findAlternativePath = function() {
            // Получаем прямой путь к финишу
            const directPath = this.findPathToFinish();
            if (!directPath || directPath.length <= 3) {
                return null;
            }
            
            // Выбираем промежуточную точку, которая не лежит на прямом пути
            const maxExplorationDistance = 10;
            const candidatePoints = [];
            
            for (let row = Math.max(0, this.row - maxExplorationDistance); 
                 row < Math.min(this.row + maxExplorationDistance, this.maze.length); 
                 row++) {
                for (let col = Math.max(0, this.col - maxExplorationDistance); 
                     col < Math.min(this.col + maxExplorationDistance, this.maze[0].length); 
                     col++) {
                    
                    // Проверяем, что точка проходима
                    if (this.isValidMove(row, col)) {
                        // Проверяем, что точка не лежит на прямом пути
                        const isOnDirectPath = directPath.some(point => point.row === row && point.col === col);
                        
                        if (!isOnDirectPath) {
                            // Рассчитываем расстояние от текущей позиции и от финиша
                            const distFromCurrent = Math.abs(row - this.row) + Math.abs(col - this.col);
                            const distFromFinish = Math.abs(row - this.finishPoint.row) + Math.abs(col - this.finishPoint.col);
                            
                            // Отбираем точки, которые не слишком далеки от пути к финишу
                            const directDistance = Math.abs(this.row - this.finishPoint.row) + Math.abs(this.col - this.finishPoint.col);
                            const detourDistance = distFromCurrent + distFromFinish;
                            
                            // Отклонение не должно быть слишком большим
                            if (detourDistance < directDistance * 1.8) {
                                candidatePoints.push({
                                    row,
                                    col,
                                    score: directDistance / detourDistance // Чем ближе к 1, тем лучше
                                });
                            }
                        }
                    }
                }
            }
            
            if (candidatePoints.length === 0) {
                return null;
            }
            
            // Сортируем точки по оценке (предпочитаем те, что не сильно отклоняются от прямого пути)
            candidatePoints.sort((a, b) => b.score - a.score);
            
            // Выбираем одну из лучших точек с небольшой случайностью
            const bestPoints = candidatePoints.slice(0, Math.min(5, candidatePoints.length));
            const randomPoint = bestPoints[Math.floor(Math.random() * bestPoints.length)];
            
            // Строим путь через выбранную точку
            const pathToPoint = this.findPathFrom(this.row, this.col, randomPoint.row, randomPoint.col);
            if (!pathToPoint || pathToPoint.length <= 1) {
                return null;
            }
            
            const pathFromPointToFinish = this.findPathFrom(
                randomPoint.row, randomPoint.col,
                this.finishPoint.row, this.finishPoint.col
            );
            
            if (!pathFromPointToFinish || pathFromPointToFinish.length <= 1) {
                return null;
            }
            
            // Объединяем пути, исключая повторяющуюся точку
            return [...pathToPoint, ...pathFromPointToFinish.slice(1)];
        };
        
        // Переопределяем метод moveToNextPoint для обновления паттерна движения
        Slug.prototype.moveToNextPoint = function() {
            const result = originalMoveToNextPoint.call(this);
            
            // Если это змейка, обновляем паттерн движения
            if (this.type === 'snake' && this.isMoving && !this.hasFinished) {
                // Обновляем счетчик шагов паттерна
                this.snakePattern.step++;
                
                // Проверяем, не пора ли сменить направление паттерна
                if (this.snakePattern.step >= this.snakePattern.maxSteps) {
                    this.snakePattern.direction = this.snakePattern.direction === 'forward' ? 'backward' : 'forward';
                    this.snakePattern.step = 0;
                    this.snakePattern.maxSteps = 3 + Math.floor(Math.random() * 4);
                }
            }
            
            return result;
        };
        
        // Переопределяем метод updateRotation для более плавного поворота
        Slug.prototype.updateRotation = function() {
            // Если это не змейка, используем стандартный метод
            if (this.type !== 'snake') {
                return originalUpdateRotation.call(this);
            }
            
            // Получаем текущее направление
            let targetAngle = 0;
            
            switch (this.currentDirection) {
                case 'right':
                    targetAngle = 0;
                    break;
                case 'down':
                    targetAngle = 90;
                    break;
                case 'left':
                    targetAngle = 180;
                    break;
                case 'up':
                    targetAngle = 270;
                    break;
            }
            
            // Добавляем небольшой наклон в зависимости от паттерна движения
            if (this.isMoving && !this.hasFinished) {
                const oscillation = Math.sin(this.snakePattern.step * 0.5) * 15;
                targetAngle += this.snakePattern.direction === 'forward' ? oscillation : -oscillation;
            }
            
            // Более плавное вращение для змейки
            if (this.sprite) {
                // Используем Phaser tweens для плавного поворота
                this.scene.tweens.add({
                    targets: this.sprite,
                    angle: targetAngle,
                    duration: 200,
                    ease: 'Sine.easeInOut'
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