/**
 * Модуль для управления улитками (Slug) в гонке
 * Реализует движение, поиск пути и взаимодействие улиток с лабиринтом
 */

/**
 * Класс, представляющий улитку в гонке
 */
class Slug {
    /**
     * Создает новый экземпляр улитки
     * @param {Object} options - Параметры инициализации улитки
     * @param {string} options.type - Тип улитки ('racer', 'explorer', 'snake', 'stubborn', 'deadender')
     * @param {Object} options.startPosition - Начальная позиция улитки {x, y}
     * @param {Object} options.finishPosition - Позиция финиша {x, y}
     * @param {Object} options.maze - Объект лабиринта
     * @param {string} options.color - Цвет улитки (hex или RGB)
     * @param {Object} options.canvas - Элемент canvas для рендеринга
     * @param {Object} options.image - Изображение улитки
     */
    constructor(options) {
        this.type = options.type || 'deadender'; // Тип по умолчанию - "Тупичок"
        this.position = options.startPosition || { x: 0, y: 0 };
        this.startPosition = { ...this.position };
        this.finishPosition = options.finishPosition || { x: 0, y: 0 };
        this.maze = options.maze || null;
        this.color = options.color || '#ff0000';
        this.canvas = options.canvas || null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.image = options.image || null;
        
        // Состояние улитки
        this.isMoving = false;
        this.isFinished = false;
        this.isWinner = false;
        this.path = [];
        this.currentPathIndex = 0;
        this.speed = 0;
        this.baseSpeed = 0.05; // Базовая скорость движения (ячеек в секунду)
        this.rotation = 0; // Угол поворота в радианах
        this.size = options.size || 0.8; // Размер улитки относительно размера ячейки
        
        // Тайминги и визуальные эффекты
        this.lastUpdateTime = 0;
        this.animationState = 0;
        this.animationSpeed = 0.1;
        this.thinking = false;
        this.thinkingTimer = 0;
        
        // Специфичные для типа параметры
        this.initSlugTypeParameters();
        
        // Путь для отладки
        this.debugPath = [];
    }
    
    /**
     * Инициализирует параметры улитки в зависимости от типа
     * Метод будет переопределен в патчах для конкретных типов улиток
     */
    initSlugTypeParameters() {
        // Стандартные параметры для типа "Тупичок"
        this.randomTurnProbability = 0.6;  // Вероятность случайного поворота
        this.deadEndProbability = 0.7;     // Вероятность зайти в тупик
        this.thinkingTime = 2000;          // Время "раздумья" в тупике (мс)
        
        // Установка базовой скорости в зависимости от типа
        switch (this.type) {
            case 'racer':
                this.baseSpeed = 0.15;
                break;
            case 'explorer':
                this.baseSpeed = 0.08;
                break;
            case 'snake':
                this.baseSpeed = 0.12;
                break;
            case 'stubborn':
                this.baseSpeed = 0.1;
                break;
            case 'deadender':
            default:
                this.baseSpeed = 0.05;
                break;
        }
        
        this.speed = this.baseSpeed;
    }
    
    /**
     * Генерирует путь для улитки с учетом ее типа
     * Метод будет переопределен в патчах для конкретных типов улиток
     */
    generatePath() {
        if (!this.maze) {
            console.error('Лабиринт не определен для улитки');
            return [];
        }
        
        try {
            // Проверяем, существует ли SlugManager и имеет ли он метод findPathForSlug
            if (window.slugManager && typeof window.slugManager.findPathForSlug === 'function') {
                const path = window.slugManager.findPathForSlug(this, this.position, this.finishPosition, this.maze);
                if (path && path.length > 0) {
                    console.log(`Улитка типа ${this.type} получила удлиненный путь (${path.length} точек)`);
                    return path;
                }
            }
            
            // Если SlugManager недоступен или вернул пустой путь, используем стандартную логику
            console.log(`Используем стандартную логику генерации пути для улитки типа ${this.type}`);
            
            // Для типа "Тупичок" - шанс пойти в тупик или сгенерировать случайный путь
            if (Math.random() < this.deadEndProbability) {
                return this.findNearestDeadEnd();
            } else if (Math.random() < this.randomTurnProbability) {
                return this.generateRandomPath(5 + Math.floor(Math.random() * 5));
            } else {
                // Иначе пытаемся найти прямой путь к финишу
                const path = this.maze.findPath(this.position, this.finishPosition);
                if (path.length > 0) {
                    return path;
                } else {
                    // Если путь не найден, генерируем случайный
                    return this.generateRandomPath(3 + Math.floor(Math.random() * 3));
                }
            }
        } catch (error) {
            console.error(`Ошибка при генерации пути для улитки типа ${this.type}:`, error);
            // В случае ошибки, возвращаем базовый путь
            return this.maze.findPath(this.position, this.finishPosition) || [];
        }
    }
    
    /**
     * Находит ближайший тупик и возвращает путь к нему
     * @returns {Array} Массив точек пути к ближайшему тупику
     */
    findNearestDeadEnd() {
        const deadEnds = this.maze.getDeadEnds();
        if (deadEnds.length === 0) {
            return this.generateRandomPath(3 + Math.floor(Math.random() * 3));
        }
        
        // Сортируем тупики по расстоянию от текущей позиции
        deadEnds.sort((a, b) => {
            const distA = Math.abs(a.x - this.position.x) + Math.abs(a.y - this.position.y);
            const distB = Math.abs(b.x - this.position.x) + Math.abs(b.y - this.position.y);
            return distA - distB;
        });
        
        // Выбираем один из ближайших тупиков (случайно из топ-3)
        const maxIndex = Math.min(3, deadEnds.length) - 1;
        const targetDeadEnd = deadEnds[Math.floor(Math.random() * (maxIndex + 1))];
        
        // Находим путь к выбранному тупику
        const path = this.maze.findPath(this.position, targetDeadEnd);
        if (path.length > 0) {
            return path;
        } else {
            // Если путь не найден, генерируем случайный
            return this.generateRandomPath(3 + Math.floor(Math.random() * 3));
        }
    }
    
    /**
     * Генерирует случайный путь от текущей позиции
     * @param {number} length - Желаемая длина пути
     * @returns {Array} Массив точек случайного пути
     */
    generateRandomPath(length) {
        const path = [{ ...this.position }];
        let current = { ...this.position };
        
        for (let i = 0; i < length; i++) {
            const neighbors = this.maze.getNeighbors(current.x, current.y);
            if (neighbors.length === 0) break;
            
            // Выбираем случайного соседа, исключая точки, которые уже в пути
            const availableNeighbors = neighbors.filter(n => 
                !path.some(p => p.x === n.x && p.y === n.y)
            );
            
            if (availableNeighbors.length === 0) {
                if (neighbors.length > 0) {
                    current = neighbors[Math.floor(Math.random() * neighbors.length)];
                    path.push({ ...current });
                }
                break;
            }
            
            current = availableNeighbors[Math.floor(Math.random() * availableNeighbors.length)];
            path.push({ ...current });
        }
        
        return path;
    }
    
    /**
     * Начинает движение улитки
     */
    startMoving() {
        try {
            if (this.isFinished || this.isMoving) {
                console.log(`Улитка типа ${this.type} уже движется или финишировала`);
                return;
            }
            
            if (!this.maze) {
                throw new Error(`Отсутствует лабиринт для улитки типа ${this.type}`);
            }
            
            console.log(`Запуск улитки типа ${this.type}...`);
            
            this.isMoving = true;
            this.lastUpdateTime = performance.now();
            
            // Попытка сгенерировать путь
            try {
                this.path = this.generatePath();
                if (!this.path || !Array.isArray(this.path) || this.path.length === 0) {
                    console.warn(`Не удалось сгенерировать путь для улитки типа ${this.type}, возвращен ${typeof this.path}`);
                    // Создаем простой путь из текущей позиции
                    this.path = [{ ...this.position }];
                }
            } catch (pathError) {
                console.error(`Ошибка при генерации пути для улитки типа ${this.type}:`, pathError);
                // Создаем простой путь из текущей позиции в случае ошибки
                this.path = [{ ...this.position }];
            }
            
            this.currentPathIndex = 0;
            this.debugPath = Array.isArray(this.path) ? [...this.path] : []; // Копия для отладки
            
            console.log(`Улитка типа ${this.type} начала движение с позиции (${this.position.x}, ${this.position.y})`);
            
            // Запускаем цикл обновления
            this.update();
        } catch (error) {
            this.isMoving = false;
            console.error(`Критическая ошибка при запуске улитки типа ${this.type}:`, error);
            throw error; // Перебрасываем ошибку дальше для обработки в SlugManager
        }
    }
    
    /**
     * Останавливает движение улитки
     */
    stopMoving() {
        this.isMoving = false;
        this.thinking = false;
    }
    
    /**
     * Обновляет состояние улитки каждый кадр
     * @param {number} [deltaTime] - Время в миллисекундах, прошедшее с последнего кадра
     */
    update(deltaTime) {
        try {
            if (!this.isMoving || this.isFinished) return;
            
            // Если deltaTime не передан, вычисляем его
            if (!deltaTime) {
                const currentTime = performance.now();
                deltaTime = currentTime - (this.lastUpdateTime || currentTime);
                this.lastUpdateTime = currentTime;
            } else {
                // Если deltaTime передан, обновляем lastUpdateTime
                this.lastUpdateTime = performance.now();
            }
            
            // Обновляем анимацию
            this.animationState += this.animationSpeed * (deltaTime / 1000);
            if (this.animationState > 1) this.animationState = 0;
            
            // Если улитка "думает" в тупике
            if (this.thinking) {
                this.thinkingTimer -= deltaTime;
                if (this.thinkingTimer <= 0) {
                    this.thinking = false;
                    this.path = this.generatePath();
                    this.currentPathIndex = 0;
                    this.debugPath = [...this.path]; // Копия для отладки
                } else {
                    this.render();
                    requestAnimationFrame(() => this.update());
                    return;
                }
            }
            
            // Проверяем, что у нас есть действительный путь
            if (!this.path || this.path.length === 0) {
                console.warn(`Улитка типа ${this.type}: нет действительного пути, генерируем новый`);
                this.path = this.generatePath();
                this.currentPathIndex = 0;
                this.debugPath = [...this.path];
                
                // Если путь все равно отсутствует, останавливаем движение
                if (!this.path || this.path.length === 0) {
                    console.error(`Улитка типа ${this.type}: не удалось сгенерировать путь`);
                    this.stopMoving();
                    return;
                }
            }
            
            // Передвигаем улитку к следующей точке пути
            if (this.currentPathIndex < this.path.length) {
                this.moveToNextPoint(deltaTime);
            } else {
                // Проверяем, достигли ли финиша
                if (this.position.x === this.finishPosition.x && this.position.y === this.finishPosition.y) {
                    this.isFinished = true;
                    this.isMoving = false;
                    console.log(`Улитка типа ${this.type} достигла финиша!`);
                } else {
                    // Генерируем новый путь
                    this.path = this.generatePath();
                    this.currentPathIndex = 0;
                    this.debugPath = [...this.path]; // Копия для отладки
                    
                    // Если мы пришли в тупик, "думаем"
                    if (this.path.length === 1 || 
                        (this.path.length > 1 && this.path[0].x === this.position.x && this.path[0].y === this.position.y)) {
                        this.thinking = true;
                        this.thinkingTimer = this.thinkingTime;
                    }
                }
            }
            
            // Отрисовываем улитку
            this.render();
            
            // Продолжаем анимацию
            if (this.isMoving) {
                requestAnimationFrame(() => this.update());
            }
        } catch (error) {
            console.error(`Ошибка в методе update улитки типа ${this.type}:`, error);
            // Пытаемся продолжить анимацию, несмотря на ошибку
            if (this.isMoving) {
                requestAnimationFrame(() => this.update());
            }
        }
    }
    
    /**
     * Передвижение к следующей точке на пути
     * @param {number} deltaTime - Время, прошедшее с последнего обновления (мс)
     */
    moveToNextPoint(deltaTime) {
        try {
            // Проверка корректности пути и индекса
            if (!this.path || !this.path.length || this.currentPathIndex >= this.path.length) {
                console.warn(`Ошибка в moveToNextPoint для улитки ${this.type}: некорректный путь или индекс`);
                return;
            }
            
            const target = this.path[this.currentPathIndex];
            
            // Проверка корректности цели
            if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
                console.warn(`Ошибка в moveToNextPoint для улитки ${this.type}: некорректная целевая точка`, target);
                this.currentPathIndex++;
                return;
            }
            
            // Вычисляем расстояние и направление к цели
            const dx = target.x - this.position.x;
            const dy = target.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Если мы достаточно близко к целевой точке
            if (distance < 0.05) {
                this.position.x = target.x;
                this.position.y = target.y;
                this.currentPathIndex++;
            } else {
                // Иначе, двигаемся по направлению к цели
                const moveDistance = this.speed * (deltaTime / 1000);
                const ratio = moveDistance / distance;
                
                this.position.x += dx * ratio;
                this.position.y += dy * ratio;
                
                // Обновляем угол поворота
                this.updateRotation(dx, dy);
            }
        } catch (error) {
            console.error(`Ошибка в методе moveToNextPoint улитки типа ${this.type}:`, error);
            // Увеличиваем индекс, чтобы перейти к следующей точке в следующий раз
            this.currentPathIndex++;
        }
    }
    
    /**
     * Обновляет угол поворота улитки в зависимости от направления движения
     * @param {number} dx - Изменение по X
     * @param {number} dy - Изменение по Y
     */
    updateRotation(dx, dy) {
        // Вычисляем новый угол поворота
        const targetRotation = Math.atan2(dy, dx);
        
        // Плавно поворачиваем к цели
        const rotationDiff = targetRotation - this.rotation;
        
        // Обрабатываем переход через 2π
        let shortestRotation = rotationDiff;
        if (rotationDiff > Math.PI) {
            shortestRotation = rotationDiff - 2 * Math.PI;
        } else if (rotationDiff < -Math.PI) {
            shortestRotation = rotationDiff + 2 * Math.PI;
        }
        
        // Плавно меняем угол
        this.rotation += shortestRotation * 0.1;
        
        // Нормализуем угол в пределах [0, 2π)
        while (this.rotation < 0) this.rotation += 2 * Math.PI;
        while (this.rotation >= 2 * Math.PI) this.rotation -= 2 * Math.PI;
    }
    
    /**
     * Отрисовывает улитку на канвасе
     * @param {CanvasRenderingContext2D} ctx - Контекст для рисования
     * @param {number} cellSize - Размер ячейки в пикселях
     */
    render(ctx, cellSize) {
        if (!ctx) {
            if (!this.canvas || !this.ctx) return;
            ctx = this.ctx;
        }
        
        // Позиция улитки в пикселях
        const x = this.position.x * cellSize + cellSize / 2;
        const y = this.position.y * cellSize + cellSize / 2;
        
        // Размер улитки
        const slugSize = cellSize * this.size;
        
        // Сохраняем состояние контекста
        ctx.save();
        
        // Перемещаем к позиции улитки
        ctx.translate(x, y);
        
        // Поворачиваем по направлению движения
        ctx.rotate(this.rotation);
        
        // Рисуем улитку
        if (this.image && this.image.complete) {
            // Если есть изображение, рисуем его
            ctx.drawImage(
                this.image,
                -slugSize / 2,
                -slugSize / 2,
                slugSize,
                slugSize
            );
        } else {
            // Иначе рисуем цветной круг
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, slugSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Добавляем "глазки"
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(slugSize / 4, -slugSize / 6, slugSize / 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(slugSize / 4, slugSize / 6, slugSize / 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Если это победитель, рисуем корону или другой индикатор
        if (this.isWinner) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-slugSize / 4, -slugSize / 2 - 10);
            ctx.lineTo(0, -slugSize / 2 - 20);
            ctx.lineTo(slugSize / 4, -slugSize / 2 - 10);
            ctx.closePath();
            ctx.fill();
        }
        
        // Восстанавливаем состояние контекста
        ctx.restore();
        
        // Отладочная информация (если включена)
        if (window.DEBUG_MODE) {
            this._renderDebugInfo(ctx, x, y, cellSize);
        }
    }
    
    /**
     * Отрисовывает заглушку улитки, если изображение недоступно
     * @param {number} size - Размер улитки
     */
    drawFallbackSlug(size) {
        if (!this.ctx) return;
        
        // Рисуем тело улитки
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Рисуем глаза
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(size / 4, -size / 6, size / 10, 0, Math.PI * 2);
        this.ctx.arc(size / 4, size / 6, size / 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(size / 4 + size / 20, -size / 6, size / 20, 0, Math.PI * 2);
        this.ctx.arc(size / 4 + size / 20, size / 6, size / 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Рисуем панцирь
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Добавляем спираль на панцире
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 6, 0, Math.PI * 4);
        this.ctx.stroke();
    }
    
    /**
     * Задает новую позицию улитки
     * @param {Object} position - Новая позиция {x, y}
     */
    setPosition(position) {
        this.position = { ...position };
        this.render();
    }
    
    /**
     * Сбрасывает состояние улитки к начальным значениям
     */
    reset() {
        this.isMoving = false;
        this.isFinished = false;
        this.isWinner = false;
        this.position = { ...this.startPosition };
        this.path = [];
        this.currentPathIndex = 0;
        this.thinking = false;
        this.speed = this.baseSpeed;
        this.debugPath = [];
        
        // Рендерим улитку в начальной позиции
        this.render();
    }
    
    /**
     * Объявляет улитку победителем
     */
    setAsWinner() {
        this.isWinner = true;
        this.isFinished = true;
        this.isMoving = false;
    }
    
    /**
     * Проверяет, находится ли улитка в заданной позиции
     * @param {Object} position - Позиция для проверки {x, y}
     * @returns {boolean} - True, если улитка находится в указанной позиции
     */
    isAtPosition(position) {
        const dx = this.position.x - position.x;
        const dy = this.position.y - position.y;
        return Math.sqrt(dx * dx + dy * dy) < 0.5;
    }
    
    resetData() {
        // Сбрасываем данные улитки для новой гонки
        this.isMoving = false;
        this.isFinished = false;
        this.isWinner = false;
        this.path = [];
        this.currentPathIndex = 0;
        this.position = { ...this.startPosition };
        
        console.log(`Данные улитки ${this.type} сброшены`);
    }
    
    /**
     * Уничтожает улитку и освобождает ресурсы
     */
    destroy() {
        this.stopMoving();
        this.resetData();
        
        // Очищаем ссылки на объекты
        this.path = null;
        this.maze = null;
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        
        console.log(`Улитка ${this.type} уничтожена`);
    }
    
    /**
     * Проверяет, находится ли улитка в тупике
     * @returns {boolean} true если улитка в тупике, иначе false
     */
    isInDeadEnd() {
        if (!this.maze) return false;
        
        const neighbors = this.getValidNeighbors();
        // Тупик - это точка, из которой можно двигаться только в одном направлении
        // и это не финишная точка
        return neighbors.length === 1 && 
               (this.position.x !== this.finishPosition.x || 
                this.position.y !== this.finishPosition.y);
    }

    /**
     * Получает допустимые соседние ячейки для текущей позиции
     * @returns {Array} Массив объектов с координатами доступных соседних клеток
     */
    getValidNeighbors() {
        return this.getValidNeighborsAt(this.position.x, this.position.y);
    }
    
    /**
     * Получает допустимые соседние ячейки для указанной позиции
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {Array} Массив объектов с координатами доступных соседних клеток
     */
    getValidNeighborsAt(x, y) {
        if (!this.maze) return [];
        
        const directions = [
            { dx: 0, dy: -1 }, // верх
            { dx: 1, dy: 0 },  // право
            { dx: 0, dy: 1 },  // низ
            { dx: -1, dy: 0 }  // лево
        ];
        
        const neighbors = [];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (this.isValidMove(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }
    
    /**
     * Проверяет, является ли ход в указанную ячейку допустимым
     * @param {number} x - Координата X целевой ячейки
     * @param {number} y - Координата Y целевой ячейки
     * @returns {boolean} true если ход допустим, иначе false
     */
    isValidMove(x, y) {
        if (!this.maze) return false;
        
        // Проверяем, что координаты в пределах лабиринта
        if (x < 0 || y < 0 || x >= this.maze.width || y >= this.maze.height) {
            return false;
        }
        
        // Проверяем, что между текущей позицией и новой нет стены
        const currentCell = this.maze.getCell(this.position.x, this.position.y);
        if (!currentCell) return false;
        
        // Проверяем, что целевая клетка является соседней
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        
        // Разрешены только ходы на 1 клетку по вертикали или горизонтали
        if (Math.abs(dx) + Math.abs(dy) !== 1) {
            return false;
        }
        
        // Проверяем стены
        if (dx === 1 && currentCell.walls.right) return false; // Движение вправо
        if (dx === -1 && currentCell.walls.left) return false; // Движение влево
        if (dy === 1 && currentCell.walls.bottom) return false; // Движение вниз
        if (dy === -1 && currentCell.walls.top) return false; // Движение вверх
        
        return true;
    }
    
    /**
     * Находит путь от текущей позиции до финиша
     * @returns {Array} Массив точек пути к финишу
     */
    findPathToFinish() {
        return this.findPathFrom(
            this.position.x, 
            this.position.y, 
            this.finishPosition.x, 
            this.finishPosition.y
        );
    }
    
    /**
     * Находит путь между двумя точками
     * @param {number} startX - Начальная координата X
     * @param {number} startY - Начальная координата Y
     * @param {number} endX - Конечная координата X
     * @param {number} endY - Конечная координата Y
     * @returns {Array} Массив точек пути
     */
    findPathFrom(startX, startY, endX, endY) {
        if (!this.maze) return [];
        
        return this.maze.findPath(
            { x: startX, y: startY }, 
            { x: endX, y: endY }
        );
    }
    
    /**
     * Обновляет состояние ускорения (turbo boost) для гоночной улитки
     * @param {number} deltaTime - Время с последнего обновления
     */
    updateTurboBoost(deltaTime) {
        // Будет реализовано в патче для гоночной улитки
    }
    
    /**
     * Проверяет, достигла ли улитка финиша
     * @returns {boolean} True, если улитка достигла финиша
     */
    isAtFinish() {
        if (!this.maze || !this.finishPosition) {
            return false;
        }
        
        const distance = Math.sqrt(
            Math.pow(this.position.x - this.finishPosition.x, 2) +
            Math.pow(this.position.y - this.finishPosition.y, 2)
        );
        
        // Улитка достигла финиша, если расстояние меньше заданного порога
        return distance < 0.5;
    }
    
    /**
     * Обновляет состояние улитки
     * @param {number} deltaTime - Прошедшее время с последнего обновления в миллисекундах
     */
    update(deltaTime) {
        // Если улитка не двигается или уже финишировала, ничего не делаем
        if (!this.isMoving || this.isFinished) {
            return;
        }
        
        // Проверка достижения финиша
        if (this.isAtFinish()) {
            this.finish();
            
            // Создаем событие для оповещения других компонентов
            const finishEvent = new CustomEvent('slug-finished', {
                detail: {
                    slug: this,
                    time: performance.now()
                }
            });
            window.dispatchEvent(finishEvent);
            
            return;
        }
        
        // ... остальной существующий код метода update ...
    }

    /**
     * Отрисовывает отладочную информацию
     * @param {CanvasRenderingContext2D} ctx - Контекст для рисования
     * @param {number} x - X координата улитки
     * @param {number} y - Y координата улитки
     * @param {number} cellSize - Размер ячейки
     * @private
     */
    _renderDebugInfo(ctx, x, y, cellSize) {
        ctx.save();
        
        // Отображаем тип и скорость улитки
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.type} (${this.speed.toFixed(2)})`, x, y - cellSize / 2 - 5);
        
        // Отображаем путь улитки, если он есть
        if (this.path && this.path.length > 0) {
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Начинаем с текущей позиции
            const startX = this.position.x * cellSize + cellSize / 2;
            const startY = this.position.y * cellSize + cellSize / 2;
            ctx.moveTo(startX, startY);
            
            // Рисуем линию через все точки пути
            for (let i = this.currentPathIndex; i < this.path.length; i++) {
                const pathPoint = this.path[i];
                const pathX = pathPoint.x * cellSize + cellSize / 2;
                const pathY = pathPoint.y * cellSize + cellSize / 2;
                ctx.lineTo(pathX, pathY);
            }
            
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Делаем класс доступным глобально
window.Slug = Slug;
