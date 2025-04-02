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
     * Получает список всех соседних ячеек для данной позиции
     * @param {number} x - Координата X ячейки
     * @param {number} y - Координата Y ячейки
     * @returns {Array} Массив объектов с координатами соседних ячеек
     */
    getNeighbors(x, y) {
        const neighbors = [];
        const cell = this.grid[y][x];
        
        // Верхний сосед
        if (!cell.walls.top && y > 0) {
            neighbors.push({ x, y: y - 1 });
        }
        
        // Правый сосед
        if (!cell.walls.right && x < this.width - 1) {
            neighbors.push({ x: x + 1, y });
        }
        
        // Нижний сосед
        if (!cell.walls.bottom && y < this.height - 1) {
            neighbors.push({ x, y: y + 1 });
        }
        
        // Левый сосед
        if (!cell.walls.left && x > 0) {
            neighbors.push({ x: x - 1, y });
        }
        
        return neighbors;
    }

    /**
     * Находит кратчайший путь из начальной точки в конечную используя алгоритм BFS
     * @param {Object} start - Начальная точка {x, y}
     * @param {Object} finish - Конечная точка {x, y}
     * @returns {Array} Массив координат точек, составляющих путь
     */
    findPath(start, finish) {
        // Очередь для BFS
        const queue = [start];
        
        // Посещенные ячейки
        const visited = {};
        const key = pos => `${pos.x},${pos.y}`;
        visited[key(start)] = true;
        
        // Информация для восстановления пути
        const cameFrom = {};
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Достигли цели
            if (current.x === finish.x && current.y === finish.y) {
                return this._reconstructPath(cameFrom, start, finish);
            }
            
            // Проверяем всех соседей
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const neighborKey = key(neighbor);
                
                // Если соседа еще не посещали
                if (!visited[neighborKey]) {
                    visited[neighborKey] = true;
                    cameFrom[neighborKey] = current;
                    queue.push(neighbor);
                }
            }
        }
        
        // Если путь не найден
        return [];
    }

    /**
     * Восстанавливает путь от финиша к старту
     * @param {Object} cameFrom - Карта, показывающая откуда пришли в каждую ячейку
     * @param {Object} start - Начальная точка
     * @param {Object} finish - Конечная точка
     * @returns {Array} Массив координат точек, составляющих путь
     * @private
     */
    _reconstructPath(cameFrom, start, finish) {
        const path = [];
        let current = finish;
        const key = pos => `${pos.x},${pos.y}`;
        
        // Добавляем финиш в путь
        path.push(current);
        
        // Идем по пути в обратном направлении до старта
        while (!(current.x === start.x && current.y === start.y)) {
            current = cameFrom[key(current)];
            path.unshift(current);
        }
        
        return path;
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
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.generator = new MazeGenerator(width, height);
        this.grid = [];
        this.startPoint = { x: 0, y: 0 };
        this.finishPoint = { x: width - 1, y: height - 1 };
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
        console.log('Лабиринт успешно сгенерирован');
        return this;
    }

    /**
     * Находит путь от старта до финиша
     * @returns {Array} Массив точек пути
     */
    findPath() {
        return this.generator.findPath(this.startPoint, this.finishPoint);
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