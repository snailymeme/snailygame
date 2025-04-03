/**
 * Модуль для генерации лабиринтов для гонок улиток
 * Использует алгоритм "Recursive Backtracking" для создания случайных лабиринтов
 */

class MazeGenerator {
    /**
     * Создает генератор лабиринтов
     * @param {number} width - Ширина лабиринта (в ячейках)
     * @param {number} height - Высота лабиринта (в ячейках)
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
    }

    /**
     * Генерирует новый случайный лабиринт с указанными параметрами
     * @param {Object} options - Параметры генерации лабиринта
     * @param {number} options.complexity - Сложность лабиринта (0-1)
     * @param {number} options.branchFactor - Коэффициент ветвления (0-1)
     * @param {boolean} options.randomStart - Случайная позиция старта
     * @param {boolean} options.randomFinish - Случайная позиция финиша
     * @returns {Object} Объект лабиринта с сеткой и позициями старта/финиша
     */
    generate(options = {}) {
        const defaultOptions = {
            complexity: 0.5,
            branchFactor: 0.5, 
            randomStart: true,
            randomFinish: true
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Инициализация сетки с закрытыми стенами
        this._initializeGrid();
        
        // Выбор стартовой точки
        let startX = config.randomStart ? Math.floor(Math.random() * this.width) : 0;
        let startY = config.randomStart ? Math.floor(Math.random() * this.height) : 0;
        
        // Генерация лабиринта с помощью рекурсивного алгоритма
        this._carvePathFrom(startX, startY, config);
        
        // Определение точки старта (всегда в левом верхнем углу)
        const start = { x: 0, y: 0 };
        
        // Определение точки финиша (обычно в правом нижнем, но может быть случайной)
        let finish;
        if (config.randomFinish) {
            // Выбрать случайную точку на краю лабиринта
            const isRightEdge = Math.random() > 0.5;
            if (isRightEdge) {
                finish = { x: this.width - 1, y: Math.floor(Math.random() * this.height) };
            } else {
                finish = { x: Math.floor(Math.random() * this.width), y: this.height - 1 };
            }
        } else {
            // Стандартное расположение в правом нижнем углу
            finish = { x: this.width - 1, y: this.height - 1 };
        }
        
        // Убедимся, что у старта и финиша есть проходы
        this._ensureAccessibility(start, finish);
        
        return {
            grid: this.grid,
            startPoint: start,
            finishPoint: finish,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Инициализирует сетку с закрытыми стенами
     * @private
     */
    _initializeGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push({
                    x,
                    y,
                    walls: {
                        top: true,
                        right: true,
                        bottom: true,
                        left: true
                    },
                    visited: false
                });
            }
            this.grid.push(row);
        }
    }

    /**
     * Рекурсивно проходит по сетке, убирая стены и создавая лабиринт
     * @param {number} x - Координата X текущей ячейки
     * @param {number} y - Координата Y текущей ячейки
     * @param {Object} config - Параметры генерации
     * @private
     */
    _carvePathFrom(x, y, config) {
        // Помечаем текущую клетку как посещенную
        this.grid[y][x].visited = true;

        // Направления для перемещения (верх, право, низ, лево)
        const directions = [
            { dx: 0, dy: -1, wall: 'top', oppositeWall: 'bottom' }, // верх
            { dx: 1, dy: 0, wall: 'right', oppositeWall: 'left' },  // право
            { dx: 0, dy: 1, wall: 'bottom', oppositeWall: 'top' },  // низ
            { dx: -1, dy: 0, wall: 'left', oppositeWall: 'right' }  // лево
        ];

        // Перемешиваем направления для случайности
        this._shuffleArray(directions);

        // Проверяем каждое направление
        for (const dir of directions) {
            // Новые координаты
            const newX = x + dir.dx;
            const newY = y + dir.dy;

            // Проверка, что новые координаты в пределах сетки
            if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                // Если клетка не посещена
                if (!this.grid[newY][newX].visited) {
                    // Убираем стену между текущей клеткой и следующей
                    this.grid[y][x].walls[dir.wall] = false;
                    this.grid[newY][newX].walls[dir.oppositeWall] = false;
                    
                    // Создание дополнительных проходов для увеличения сложности
                    if (Math.random() < config.branchFactor) {
                        this._addExtraPassages(x, y, config);
                    }

                    // Рекурсивно продолжаем из новой клетки
                    this._carvePathFrom(newX, newY, config);
                }
            }
        }
    }

    /**
     * Добавляет дополнительные проходы для увеличения сложности
     * @param {number} x - Координата X текущей ячейки
     * @param {number} y - Координата Y текущей ячейки
     * @param {Object} config - Параметры генерации
     * @private
     */
    _addExtraPassages(x, y, config) {
        // Добавляем дополнительные проходы для более сложного лабиринта
        // с вероятностью, зависящей от сложности
        if (Math.random() < config.complexity) {
            const directions = [
                { dx: 0, dy: -1, wall: 'top', oppositeWall: 'bottom' },
                { dx: 1, dy: 0, wall: 'right', oppositeWall: 'left' },
                { dx: 0, dy: 1, wall: 'bottom', oppositeWall: 'top' },
                { dx: -1, dy: 0, wall: 'left', oppositeWall: 'right' }
            ];
            
            this._shuffleArray(directions);
            
            // Пробуем добавить дополнительный проход
            for (const dir of directions) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
                    // Добавляем проход только если клетка уже была посещена
                    // и между ними еще есть стена
                    if (this.grid[newY][newX].visited && this.grid[y][x].walls[dir.wall]) {
                        this.grid[y][x].walls[dir.wall] = false;
                        this.grid[newY][newX].walls[dir.oppositeWall] = false;
                        break; // Только один дополнительный проход
                    }
                }
            }
        }
    }

    /**
     * Обеспечивает доступность старта и финиша
     * @param {Object} start - Координаты старта
     * @param {Object} finish - Координаты финиша
     * @private
     */
    _ensureAccessibility(start, finish) {
        // Убеждаемся, что у старта есть хотя бы один проход
        const startCell = this.grid[start.y][start.x];
        let hasExit = !startCell.walls.top || !startCell.walls.right || 
                      !startCell.walls.bottom || !startCell.walls.left;
        
        if (!hasExit) {
            // Убираем случайную стену
            const walls = ['top', 'right', 'bottom', 'left'];
            const randomWall = walls[Math.floor(Math.random() * walls.length)];
            
            startCell.walls[randomWall] = false;
            
            // Обновляем соответствующую стену в соседней клетке, если она существует
            if (randomWall === 'top' && start.y > 0) {
                this.grid[start.y - 1][start.x].walls.bottom = false;
            } else if (randomWall === 'right' && start.x < this.width - 1) {
                this.grid[start.y][start.x + 1].walls.left = false;
            } else if (randomWall === 'bottom' && start.y < this.height - 1) {
                this.grid[start.y + 1][start.x].walls.top = false;
            } else if (randomWall === 'left' && start.x > 0) {
                this.grid[start.y][start.x - 1].walls.right = false;
            }
        }
        
        // То же самое для финиша
        const finishCell = this.grid[finish.y][finish.x];
        hasExit = !finishCell.walls.top || !finishCell.walls.right || 
                  !finishCell.walls.bottom || !finishCell.walls.left;
        
        if (!hasExit) {
            const walls = ['top', 'right', 'bottom', 'left'];
            const randomWall = walls[Math.floor(Math.random() * walls.length)];
            
            finishCell.walls[randomWall] = false;
            
            if (randomWall === 'top' && finish.y > 0) {
                this.grid[finish.y - 1][finish.x].walls.bottom = false;
            } else if (randomWall === 'right' && finish.x < this.width - 1) {
                this.grid[finish.y][finish.x + 1].walls.left = false;
            } else if (randomWall === 'bottom' && finish.y < this.height - 1) {
                this.grid[finish.y + 1][finish.x].walls.top = false;
            } else if (randomWall === 'left' && finish.x > 0) {
                this.grid[finish.y][finish.x - 1].walls.right = false;
            }
        }
    }

    /**
     * Случайно перемешивает массив
     * @param {Array} array - Массив для перемешивания
     * @private
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Возвращает соседние точки, в которые можно попасть из текущей
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {Array} Массив доступных соседних точек
     */
    getNeighbors(x, y) {
        try {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                console.warn(`getNeighbors: недопустимые координаты (${x}, ${y})`);
                return [];
            }
            return this._getAccessibleNeighbors(x, y);
        } catch (error) {
            console.error('Ошибка в методе getNeighbors:', error);
            return [];
        }
    }

    /**
     * Находит путь от начальной точки до конечной с использованием алгоритма A*
     * @param {Object} start - Начальная точка {x, y}
     * @param {Object} end - Конечная точка {x, y}
     * @returns {Array} Массив точек, представляющих путь
     */
    findPath(start, end) {
        try {
            if (!start || !end) {
                console.error('findPath: не указаны start или end');
                return [];
            }
            
            // Проверяем, что точки находятся в пределах лабиринта
            if (start.x < 0 || start.x >= this.width || start.y < 0 || start.y >= this.height ||
                end.x < 0 || end.x >= this.width || end.y < 0 || end.y >= this.height) {
                console.error('findPath: start или end вне границ лабиринта');
                return [];
            }
            
            // Реализация алгоритма A* для поиска кратчайшего пути
            const openSet = [start];
            const closedSet = [];
            const gScore = {}; // Стоимость пути от начала до данной точки
            const fScore = {}; // Предполагаемая полная стоимость пути
            const cameFrom = {}; // Для восстановления пути
            
            const startKey = `${start.x},${start.y}`;
            const endKey = `${end.x},${end.y}`;
            
            gScore[startKey] = 0;
            fScore[startKey] = this._heuristic(start, end);
            
            while (openSet.length > 0) {
                // Находим точку с наименьшим fScore
                let current = openSet[0];
                let lowestFScore = fScore[`${current.x},${current.y}`];
                let currentIndex = 0;
                
                for (let i = 1; i < openSet.length; i++) {
                    const key = `${openSet[i].x},${openSet[i].y}`;
                    if (fScore[key] < lowestFScore) {
                        lowestFScore = fScore[key];
                        current = openSet[i];
                        currentIndex = i;
                    }
                }
                
                // Если достигли конечной точки, восстанавливаем путь
                if (current.x === end.x && current.y === end.y) {
                    const path = [current];
                    let currentKey = `${current.x},${current.y}`;
                    
                    while (cameFrom[currentKey]) {
                        const prev = cameFrom[currentKey];
                        path.unshift(prev);
                        currentKey = `${prev.x},${prev.y}`;
                    }
                    
                    return path;
                }
                
                // Удаляем текущую точку из openSet и добавляем в closedSet
                openSet.splice(currentIndex, 1);
                closedSet.push(current);
                
                // Получаем соседей текущей точки
                const neighbors = this._getAccessibleNeighbors(current.x, current.y);
                
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.x},${neighbor.y}`;
                    
                    // Если сосед уже в закрытом наборе, пропускаем его
                    if (closedSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
                        continue;
                    }
                    
                    // Вычисляем новый gScore через текущую точку
                    const tentativeGScore = (gScore[`${current.x},${current.y}`] || 0) + 1;
                    
                    // Если сосед не в открытом наборе или новый путь лучше, обновляем
                    const inOpenSet = openSet.some(p => p.x === neighbor.x && p.y === neighbor.y);
                    if (!inOpenSet || tentativeGScore < (gScore[neighborKey] || Infinity)) {
                        cameFrom[neighborKey] = current;
                        gScore[neighborKey] = tentativeGScore;
                        fScore[neighborKey] = tentativeGScore + this._heuristic(neighbor, end);
                        
                        if (!inOpenSet) {
                            openSet.push(neighbor);
                        }
                    }
                }
            }
            
            // Если путь не найден, возвращаем пустой массив
            console.warn(`findPath: путь от (${start.x},${start.y}) до (${end.x},${end.y}) не найден`);
            return [];
        } catch (error) {
            console.error('Ошибка в методе findPath:', error);
            return [];
        }
    }
    
    /**
     * Возвращает соседние точки, в которые можно попасть из текущей
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {Array} Массив доступных соседних точек
     * @private
     */
    _getAccessibleNeighbors(x, y) {
        const neighbors = [];
        const cell = this.grid[y][x];
        
        // Проверяем все направления
        if (!cell.walls.top && y > 0) {
            neighbors.push({ x, y: y - 1 });
        }
        
        if (!cell.walls.right && x < this.width - 1) {
            neighbors.push({ x: x + 1, y });
        }
        
        if (!cell.walls.bottom && y < this.height - 1) {
            neighbors.push({ x, y: y + 1 });
        }
        
        if (!cell.walls.left && x > 0) {
            neighbors.push({ x: x - 1, y });
        }
        
        return neighbors;
    }
    
    /**
     * Эвристическая функция для оценки расстояния между точками
     * @param {Object} a - Первая точка
     * @param {Object} b - Вторая точка
     * @returns {number} Оценка расстояния
     * @private
     */
    _heuristic(a, b) {
        // Используем манхэттенское расстояние
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    /**
     * Получает тупики в лабиринте (ячейки с только одним выходом)
     * @returns {Array} Массив объектов с координатами тупиков
     */
    getDeadEnds() {
        const deadEnds = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = this.grid[y][x];
                let wallCount = 0;
                
                if (cell.walls.top) wallCount++;
                if (cell.walls.right) wallCount++;
                if (cell.walls.bottom) wallCount++;
                if (cell.walls.left) wallCount++;
                
                // Если у ячейки три стены - это тупик
                if (wallCount === 3) {
                    deadEnds.push({ x, y });
                }
            }
        }
        
        return deadEnds;
    }
}

// Добавляем класс Maze для совместимости с остальным кодом
class Maze {
    /**
     * Создает новый лабиринт
     * @param {number} width - Ширина лабиринта в ячейках
     * @param {number} height - Высота лабиринта в ячейках
     * @param {Object} style - Визуальный стиль лабиринта (опционально)
     */
    constructor(width, height, style = null) {
        this.width = width;
        this.height = height;
        this.generator = new MazeGenerator(width, height);
        this.grid = [];
        this.startPoint = { x: 0, y: 0 };
        this.finishPoint = { x: width - 1, y: height - 1 };
        this.style = style; // Стиль оформления лабиринта
    }

    /**
     * Генерирует новый лабиринт
     * @param {Object} options - Дополнительные параметры для генерации
     */
    generate(options = {}) {
        console.log('Генерируем лабиринт...');
        const maze = this.generator.generate(options);
        this.grid = maze.grid;
        this.startPoint = maze.startPoint;
        this.finishPoint = maze.finishPoint;
        
        // Если не задан стиль, и доступны глобальные стили - выберем случайный
        if (!this.style && typeof getRandomMazeStyle === 'function') {
            try {
                this.style = getRandomMazeStyle();
                console.log(`Применен стиль лабиринта: ${this.style.name}`);
            } catch (error) {
                console.warn('Ошибка при выборе случайного стиля лабиринта:', error);
            }
        }
        
        console.log('Лабиринт успешно сгенерирован');
        return this;
    }

    /**
     * Устанавливает визуальный стиль лабиринта
     * @param {Object} style - Объект стиля
     * @returns {Maze} Возвращает текущий экземпляр для цепочки вызовов
     */
    setStyle(style) {
        this.style = style;
        return this;
    }

    /**
     * Получает цвет для пути с учетом текущего стиля
     * @returns {string} Цвет для пути
     */
    getPathColor() {
        return this.style && this.style.path ? this.style.path.color : '#FFFFFF';
    }

    /**
     * Получает цвет для стены с учетом текущего стиля
     * @returns {string} Цвет для стены
     */
    getWallColor() {
        return this.style && this.style.wall ? this.style.wall.color : '#333333';
    }

    /**
     * Проверяет, есть ли у стиля определенный эффект
     * @param {string} elementType - Тип элемента (path или wall)
     * @param {string} effectName - Имя эффекта
     * @returns {boolean} Есть ли указанный эффект
     */
    hasEffect(elementType, effectName) {
        return this.style && 
               this.style[elementType] && 
               this.style[elementType].effect === effectName;
    }

    /**
     * Находит путь от указанной начальной точки до указанной конечной точки
     * @param {Object} start - Начальная точка {x, y}
     * @param {Object} end - Конечная точка {x, y}
     * @returns {Array} Массив точек пути
     */
    findPath(start, end) {
        return this.generator.findPath(start || this.startPoint, end || this.finishPoint);
    }

    /**
     * Получает ячейку лабиринта по координатам
     * @param {number} row - Координата строки (y)
     * @param {number} col - Координата столбца (x)
     * @returns {Object|null} Ячейка лабиринта или null, если координаты некорректны
     */
    getCell(row, col) {
        // Проверяем, что координаты в пределах лабиринта
        if (row < 0 || col < 0 || row >= this.height || col >= this.width) {
            console.warn(`getCell: некорректные координаты (${row}, ${col})`);
            return null;
        }
        
        // Проверяем, есть ли grid и правильного ли он размера
        if (!this.grid || !this.grid[row]) {
            console.warn(`getCell: сетка не определена или неполная`);
            return null;
        }
        
        return this.grid[row][col];
    }

    /**
     * Получает соседние ячейки для указанной позиции
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @returns {Array} Массив соседних ячеек, куда можно пройти
     */
    getNeighbors(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            console.warn(`getNeighbors: некорректные координаты (${x}, ${y})`);
            return [];
        }
        
        const cell = this.grid[y][x];
        const neighbors = [];
        
        // Проверяем каждое направление
        if (!cell.walls.top && y > 0) {
            neighbors.push({ x, y: y - 1 });
        }
        
        if (!cell.walls.right && x < this.width - 1) {
            neighbors.push({ x: x + 1, y });
        }
        
        if (!cell.walls.bottom && y < this.height - 1) {
            neighbors.push({ x, y: y + 1 });
        }
        
        if (!cell.walls.left && x > 0) {
            neighbors.push({ x: x - 1, y });
        }
        
        return neighbors;
    }

    /**
     * Получает все тупики в лабиринте
     * @returns {Array} Массив координат тупиков
     */
    getDeadEnds() {
        return this.generator.getDeadEnds();
    }
}

// Делаем классы доступными глобально
window.MazeGenerator = MazeGenerator;
window.Maze = Maze; 