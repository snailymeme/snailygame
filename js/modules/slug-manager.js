/**
 * Модуль для управления несколькими улитками в гонке
 * Обеспечивает создание, обновление и отрисовку улиток,
 * а также определение победителя
 */

class SlugManager {
    /**
     * Создает менеджер улиток
     * @param {Object} options - Параметры инициализации
     * @param {HTMLCanvasElement} options.canvas - Canvas для рендеринга
     * @param {Object} options.maze - Объект лабиринта
     * @param {Function} options.onRaceComplete - Коллбек, вызываемый при завершении гонки
     */
    constructor(options) {
        this.slugs = [];
        this.canvas = options.canvas || null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.maze = options.maze || null;
        this.onRaceComplete = options.onRaceComplete || null;
        
        // Состояние гонки
        this.raceInProgress = false;
        this.raceComplete = false;
        this.winnerSlug = null;
        
        console.log('SlugManager: инициализирован');
        
        // Если слаги должны использовать наш функционал модификации путей,
        // делаем SlugManager доступным через глобальный объект
        window.slugManager = this;
        
        this.isRaceStarted = false;
        this.isRaceFinished = false;
        this.winner = null;
        this.lastUpdateTime = 0;
        
        // Для отслеживания всех финишировавших улиток
        this.finishedSlugs = [];
        
        // Callback при завершении гонки
        this.onRaceFinished = null;
        
        // Привязываем метод к контексту
        this._handleSlugFinishedEvent = this._handleSlugFinishedEvent.bind(this);
        
        // Добавляем слушатель события
        window.addEventListener('slug-finished', this._handleSlugFinishedEvent);
    }
    
    /**
     * Добавляет новую улитку в гонку
     * @param {Object} slugOptions - Параметры улитки
     * @returns {Slug} Созданная улитка
     */
    addSlug(slugOptions) {
        try {
            console.log("Добавление улитки с параметрами:", 
                        {type: slugOptions.type, color: slugOptions.color, isPlayer: slugOptions.isPlayer});
            
            const defaultOptions = {
                maze: this.maze,
                canvas: this.canvas
            };
            
            const options = { ...defaultOptions, ...slugOptions };
            
            const slug = new Slug(options);
            this.slugs.push(slug);
            
            console.log(`Улитка типа ${slug.type} успешно добавлена`);
            return slug;
        } catch (error) {
            console.error("Ошибка при добавлении улитки:", error);
            return null;
        }
    }
    
    /**
     * Удаляет улитку из гонки
     * @param {Slug} slug - Улитка для удаления
     */
    removeSlug(slug) {
        this.slugs = this.slugs.filter(s => s !== slug);
    }
    
    /**
     * Запускает гонку улиток
     */
    startRace() {
        try {
            if (this.isRaceStarted) return;
            
            console.log("Запуск гонки улиток...");
            this.isRaceStarted = true;
            this.isRaceFinished = false;
            this.winner = null;
            this.lastUpdateTime = performance.now();
            
            // Проверяем наличие улиток
            if (!this.slugs || this.slugs.length === 0) {
                console.warn("Нет улиток для запуска гонки!");
                return;
            }
            
            // Запускаем движение всех улиток с задержкой
            let startedCount = 0;
            this.slugs.forEach((slug, index) => {
                try {
                    if (!slug) {
                        console.warn("Обнаружена пустая улитка в списке!");
                        return;
                    }
                    
                    if (typeof slug.startMoving !== 'function') {
                        console.warn(`Улитка ${slug.type || 'unknown'} не имеет метода startMoving!`);
                        return;
                    }
                    
                    // Используем задержку, если она установлена
                    const delay = slug.startDelay || index * 100;
                    
                    setTimeout(() => {
                        if (this.isRaceStarted && !this.isRaceFinished) {
                            slug.startMoving();
                            console.log(`Улитка ${slug.type} начала движение`);
                        }
                    }, delay);
                    
                    startedCount++;
                } catch (error) {
                    const errorInfo = {
                        message: error.message,
                        stack: error.stack,
                        type: slug?.type || 'unknown',
                        position: slug?.position ? `(${slug.position.x}, ${slug.position.y})` : 'unknown',
                        maze: slug?.maze ? 'available' : 'missing'
                    };
                    
                    console.error(`Ошибка при запуске улитки ${slug?.type || 'unknown'}:`, 
                                  error.message, 
                                  '\nДополнительная информация:', 
                                  JSON.stringify(errorInfo, null, 2));
                }
            });
            
            if (startedCount === 0) {
                console.warn("Не удалось запустить ни одну улитку!");
                this.isRaceStarted = false;
                return;
            }
            
            console.log(`Гонка начата, участвуют ${startedCount} улиток из ${this.slugs.length}`);
        } catch (error) {
            console.error("Ошибка при запуске гонки:", error.message, '\nСтек:', error.stack);
            this.isRaceStarted = false;
        }
    }
    
    /**
     * Останавливает гонку
     */
    stopRace() {
        this.isRaceStarted = false;
        
        // Останавливаем все улитки
        this.slugs.forEach(slug => {
            slug.stopMoving();
        });
        
        console.log('Гонка остановлена');
    }
    
    /**
     * Обрабатывает событие финиша улитки
     * @param {CustomEvent} event - Событие финиша
     * @private
     */
    _handleSlugFinishedEvent(event) {
        const { slug, time } = event.detail;
        
        if (slug) {
            this._handleSlugFinish(slug, time);
        }
    }
    
    /**
     * Обрабатывает финиш улитки
     * @param {Slug} slug - Финишировавшая улитка
     * @param {number} [time] - Время финиша
     * @private
     */
    _handleSlugFinish(slug, time = performance.now()) {
        // Если гонка уже завершена, только добавляем в список финишировавших
        if (this.isRaceFinished) {
            this._addFinishedSlug(slug, time);
            return;
        }
        
        // Добавляем в список финишировавших
        this._addFinishedSlug(slug, time);
        
        // Если это первая улитка, пересекшая финиш, то она победитель
        if (!this.winner) {
            this.winner = slug;
            slug.isWinner = true;
            this.isRaceFinished = true;
            
            console.log(`Победитель гонки: ${slug.type} (${slug.colorName || 'unknown'})`);
            
            // Вызываем callback при наличии
            if (typeof this.onRaceFinished === 'function') {
                this.onRaceFinished(slug);
            }
            
            // Уведомляем все улитки о завершении гонки
            this.slugs.forEach(s => {
                if (s !== slug && !s.isFinished) {
                    // Замедляем остальных для лучшего визуального эффекта
                    s.speed = s.speed * 0.5;
                }
            });
            
            // Останавливаем остальных улиток через небольшую задержку
            setTimeout(() => {
                this.slugs.forEach(s => {
                    if (s !== slug && !s.isFinished) {
                        s.stopMoving();
                    }
                });
            }, 2000);
        }
    }
    
    /**
     * Добавляет улитку в список финишировавших
     * @param {Slug} slug - Финишировавшая улитка
     * @param {number} time - Время финиша
     * @private
     */
    _addFinishedSlug(slug, time) {
        // Проверяем, не добавлена ли улитка уже
        if (!this.finishedSlugs.find(fs => fs.slug === slug)) {
            this.finishedSlugs.push({
                slug,
                time,
                position: this.finishedSlugs.length + 1
            });
            
            // Сортируем по времени
            this.finishedSlugs.sort((a, b) => a.time - b.time);
            
            // Обновляем позиции
            this.finishedSlugs.forEach((fs, index) => {
                fs.position = index + 1;
                fs.slug.finishPosition = index + 1;
            });
            
            console.log(`Улитка ${slug.type} финишировала на месте ${this.finishedSlugs.find(fs => fs.slug === slug).position}`);
        }
    }
    
    /**
     * Обновляет состояние всех улиток
     * @param {number} timestamp - Текущее время анимации в миллисекундах
     */
    update(timestamp) {
        try {
            // Если гонка не запущена или уже закончена, ничего не делаем
            if (!this.isRaceStarted || this.isRaceFinished) return;
            
            // Вычисляем дельту времени
            const currentTime = timestamp || performance.now();
            this.lastUpdateTime = this.lastUpdateTime || currentTime;
            const deltaTime = currentTime - this.lastUpdateTime;
            this.lastUpdateTime = currentTime;
            
            let allFinished = true;
            
            // Обновляем каждую улитку
            for (const slug of this.slugs) {
                if (slug && typeof slug.update === 'function') {
                    try {
                        slug.update(deltaTime);
                        
                        // Проверяем, финишировала ли улитка
                        if (slug.isFinished) {
                            this._handleSlugFinish(slug);
                        } else {
                            allFinished = false;
                        }
                    } catch (error) {
                        console.error(`Ошибка при обновлении улитки ${slug.type}:`, error);
                    }
                }
            }
            
            // Если все улитки финишировали, завершаем гонку
            if (allFinished && !this.isRaceFinished && this.slugs.length > 0) {
                this.isRaceFinished = true;
                
                // Вызываем callback с null, если нет победителя
                if (typeof this.onRaceFinished === 'function' && !this.winner) {
                    this.onRaceFinished(null);
                }
            }
        } catch (error) {
            console.error("Ошибка в методе SlugManager.update:", error);
        }
    }
    
    /**
     * Отрисовывает всех улиток
     * @param {CanvasRenderingContext2D} ctx - Контекст для рисования
     */
    render(ctx) {
        if (!ctx) {
            ctx = this.ctx; // Используем собственный контекст, если не передан
        }
        
        if (!ctx || !this.maze) return;
        
        // Вычисляем размер ячейки в пикселях
        const cellSize = Math.min(
            ctx.canvas.width / this.maze.width,
            ctx.canvas.height / this.maze.height
        );
        
        // Отрисовываем каждую улитку
        this.slugs.forEach(slug => {
            try {
                if (slug && typeof slug.render === 'function') {
                    slug.render(ctx, cellSize);
                }
            } catch (error) {
                console.error(`Ошибка при отрисовке улитки ${slug.type}:`, error);
            }
        });
    }
    
    /**
     * Находит улитку по типу
     * @param {string} type - Тип улитки
     * @returns {Slug|null} Найденная улитка или null
     */
    findSlugByType(type) {
        return this.slugs.find(slug => slug.type === type) || null;
    }
    
    /**
     * Проверяет, выиграла ли улитка определенного типа
     * @param {string} type - Тип улитки
     * @returns {boolean} true, если улитка выиграла
     */
    hasWon(type) {
        return this.winner && this.winner.type === type;
    }
    
    /**
     * Уничтожает менеджер и освобождает ресурсы
     */
    destroy() {
        this.stopRace();
        this.slugs.forEach(slug => {
            if (slug && typeof slug.destroy === 'function') {
                slug.destroy();
            }
        });
        this.slugs = [];
        this.onRaceFinished = null;
        
        // Удаляем слушатель события
        window.removeEventListener('slug-finished', this._handleSlugFinishedEvent);
    }
    
    /**
     * Получает список всех типов улиток в гонке
     * @returns {Array<string>} Массив типов улиток
     */
    getSlugTypes() {
        return [...new Set(this.slugs.map(slug => slug.type))];
    }
    
    /**
     * Проверяет, завершилась ли гонка
     */
    checkRaceFinish() {
        if (!this.isRaceStarted || this.isRaceFinished) return;
        
        // Проверяем, финишировала ли какая-то улитка
        for (const slug of this.slugs) {
            if (slug && slug.isFinished) {
                this._handleSlugFinish(slug);
                return;
            }
        }
        
        // Проверяем, все ли улитки остановились (застряли)
        let allStopped = true;
        for (const slug of this.slugs) {
            if (slug && slug.isMoving && !slug.isFinished) {
                allStopped = false;
                break;
            }
        }
        
        // Если все улитки остановились, но не финишировали, это застревание
        if (allStopped && !this.isRaceFinished) {
            console.log('Все улитки остановились, но никто не финишировал. Гонка завершается.');
            this.isRaceFinished = true;
            
            // Вызываем callback с null, так как нет победителя
            if (typeof this.onRaceFinished === 'function') {
                this.onRaceFinished(null);
            }
        }
    }
    
    /**
     * Устанавливает новый лабиринт для гонки
     * @param {Maze} maze - Объект лабиринта
     */
    setMaze(maze) {
        if (!maze) {
            console.error('SlugManager: нельзя установить пустой лабиринт');
            return;
        }
        
        this.maze = maze;
        console.log('SlugManager: установлен новый лабиринт', maze.width, 'x', maze.height);
    }
    
    /**
     * Подготавливает улиток к гонке
     */
    prepareRace() {
        if (!this.maze) {
            console.error('SlugManager: нельзя подготовить гонку без лабиринта');
            return false;
        }
        
        try {
            // Очищаем предыдущий список улиток
            this.slugs = [];
            this.finishedSlugs = [];
            this.winner = null;
            this.isRaceStarted = false;
            this.isRaceFinished = false;
            
            // Получаем точки старта и финиша из лабиринта
            const startPoint = this.maze.startPoint;
            const finishPoint = this.maze.finishPoint;
            
            // Создаем улитки с разными типами поведения
            const slugTypes = ['racer', 'explorer', 'snake', 'stubborn', 'deadender'];
            
            slugTypes.forEach((type, index) => {
                // Создаем улитку с соответствующим типом
                const slug = new Slug({
                    type: type,
                    startPosition: { x: startPoint.x, y: startPoint.y },
                    finishPosition: { x: finishPoint.x, y: finishPoint.y },
                    maze: this.maze,
                    color: window.SNAIL_TYPES && window.SNAIL_TYPES[type] ? window.SNAIL_TYPES[type].color : '#FFFFFF',
                    canvas: this.canvas,
                    image: window.imageCache ? window.imageCache[`images/snail_${type === 'deadender' ? 'yellow' : type === 'racer' ? 'red' : type === 'explorer' ? 'green' : type === 'snake' ? 'blue' : 'lilac'}.png`] : null
                });
                
                // Устанавливаем небольшую задержку перед стартом для каждой улитки
                slug.startDelay = index * 200;
                
                // Добавляем улитку в список
                this.slugs.push(slug);
            });
            
            console.log(`SlugManager: подготовлено ${this.slugs.length} улиток для гонки`);
            return true;
        } catch (error) {
            console.error('Ошибка при подготовке улиток к гонке:', error);
            return false;
        }
    }
    
    /**
     * Находит путь для улитки с учетом ее типа
     * @param {Slug} slug - Объект улитки
     * @param {Object} startPoint - Начальная точка
     * @param {Object} endPoint - Конечная точка
     * @param {Object} maze - Ссылка на лабиринт
     * @returns {Array} Массив точек, представляющих путь
     */
    findPathForSlug(slug, startPoint, endPoint, maze) {
        if (!slug || !maze) {
            console.error('findPathForSlug: не указаны slug или maze');
            return [];
        }
        
        // Получаем базовый путь из лабиринта
        let path = maze.findPath(startPoint, endPoint);
        
        // Для каждого типа улитки применяем свои модификации пути
        switch (slug.type) {
            case 'racer':
                // Гонщики идут по оптимальному пути, без изменений
                break;
                
            case 'explorer':
                // Исследователи могут делать случайные отклонения
                path = this._addRandomDetours(path, 0.3, maze);
                break;
                
            case 'snake':
                // Змейки делают зигзаги
                path = this._addZigzags(path, 0.4, maze);
                break;
                
            case 'stubborn':
                // Упрямые улитки могут иногда идти в неоптимальном направлении
                path = this._reverseSegments(path, 0.2);
                break;
                
            case 'deadender':
                // Тупичковые улитки могут искать тупики
                if (Math.random() < slug.deadEndProbability) {
                    const deadEnds = maze.getDeadEnds();
                    if (deadEnds.length > 0) {
                        // Находим ближайший тупик
                        const randomDeadEnd = deadEnds[Math.floor(Math.random() * deadEnds.length)];
                        const pathToDeadEnd = maze.findPath(startPoint, randomDeadEnd);
                        if (pathToDeadEnd.length > 0) {
                            path = pathToDeadEnd;
                        }
                    }
                } else if (Math.random() < 0.3) {
                    // Иногда добавляем случайные петли
                    path = this._addLoops(path, 0.5, maze);
                }
                break;
                
            default:
                // По умолчанию удлиняем путь с зигзагами
                path = this._extendPath(path, 0.6, maze);
        }
        
        return path;
    }
    
    /**
     * Добавляет случайные отклонения к пути
     * @param {Array} path - Исходный путь
     * @param {number} probability - Вероятность отклонения на каждом шаге
     * @param {Object} maze - Ссылка на лабиринт для проверки проходимости
     * @returns {Array} Модифицированный путь
     * @private
     */
    _addRandomDetours(path, probability, maze) {
        if (!path || path.length < 3) return path;
        
        const newPath = [...path];
        
        // Проходим по пути и добавляем случайные отклонения
        for (let i = 1; i < newPath.length - 1; i++) {
            if (Math.random() < probability) {
                const current = newPath[i];
                const neighbors = this._getAccessibleNeighbors(current, maze);
                
                // Фильтруем соседей, чтобы не возвращаться к предыдущей точке
                const validNeighbors = neighbors.filter(n => 
                    !(n.x === newPath[i-1].x && n.y === newPath[i-1].y) && 
                    !(n.x === newPath[i+1].x && n.y === newPath[i+1].y)
                );
                
                if (validNeighbors.length > 0) {
                    const detour = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    newPath.splice(i + 1, 0, detour);
                    i++; // Пропускаем новую точку
                }
            }
        }
        
        return newPath;
    }
    
    /**
     * Добавляет зигзаги к пути
     * @param {Array} path - Исходный путь
     * @param {number} intensity - Интенсивность зигзагов (0-1)
     * @param {Object} maze - Ссылка на лабиринт для проверки проходимости
     * @returns {Array} Модифицированный путь
     * @private
     */
    _addZigzags(path, intensity, maze) {
        if (!path || path.length < 3) return path;
        
        const newPath = [...path];
        let i = 1;
        
        while (i < newPath.length - 1) {
            if (Math.random() < intensity) {
                const current = newPath[i];
                const next = newPath[i + 1];
                
                // Определяем направление движения
                const dx = next.x - current.x;
                const dy = next.y - current.y;
                
                // Пытаемся создать зигзаг, сначала двигаясь перпендикулярно основному направлению
                let zigzagPoints = [];
                if (dx !== 0 && dy === 0) { // Горизонтальное движение
                    // Пробуем сделать шаг вверх или вниз
                    if (this._isAccessible({x: current.x, y: current.y - 1}, maze)) {
                        zigzagPoints = [
                            {x: current.x, y: current.y - 1},
                            {x: current.x + Math.sign(dx), y: current.y - 1}
                        ];
                    } else if (this._isAccessible({x: current.x, y: current.y + 1}, maze)) {
                        zigzagPoints = [
                            {x: current.x, y: current.y + 1},
                            {x: current.x + Math.sign(dx), y: current.y + 1}
                        ];
                    }
                } else if (dx === 0 && dy !== 0) { // Вертикальное движение
                    // Пробуем сделать шаг влево или вправо
                    if (this._isAccessible({x: current.x - 1, y: current.y}, maze)) {
                        zigzagPoints = [
                            {x: current.x - 1, y: current.y},
                            {x: current.x - 1, y: current.y + Math.sign(dy)}
                        ];
                    } else if (this._isAccessible({x: current.x + 1, y: current.y}, maze)) {
                        zigzagPoints = [
                            {x: current.x + 1, y: current.y},
                            {x: current.x + 1, y: current.y + Math.sign(dy)}
                        ];
                    }
                }
                
                // Проверяем, что все точки зигзага доступны
                if (zigzagPoints.length === 2 && 
                    this._isAccessible(zigzagPoints[0], maze) && 
                    this._isAccessible(zigzagPoints[1], maze)) {
                    // Вставляем зигзаг
                    newPath.splice(i + 1, 0, ...zigzagPoints);
                    i += 2; // Пропускаем вставленные точки
                }
            }
            i++;
        }
        
        return newPath;
    }
    
    /**
     * Добавляет петли к пути
     * @param {Array} path - Исходный путь
     * @param {number} probability - Вероятность создания петли
     * @param {Object} maze - Ссылка на лабиринт для проверки проходимости
     * @returns {Array} Модифицированный путь
     * @private
     */
    _addLoops(path, probability, maze) {
        if (!path || path.length < 3) return path;
        
        const newPath = [...path];
        
        // Пробуем добавить петли несколько раз
        const attempts = Math.floor(path.length / 3);
        for (let attempt = 0; attempt < attempts; attempt++) {
            if (Math.random() < probability) {
                // Выбираем случайную точку, не начало и не конец
                const index = 1 + Math.floor(Math.random() * (newPath.length - 2));
                const point = newPath[index];
                
                // Получаем доступные соседние клетки
                const neighbors = this._getAccessibleNeighbors(point, maze);
                
                // Фильтруем, чтобы не двигаться по основному пути
                const validNeighbors = neighbors.filter(n => 
                    !newPath.some(p => p.x === n.x && p.y === n.y)
                );
                
                if (validNeighbors.length > 0) {
                    // Выбираем случайного соседа для петли
                    const loopPoint = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    
                    // Создаем простую петлю - туда и обратно
                    newPath.splice(index + 1, 0, loopPoint, {...point});
                }
            }
        }
        
        return newPath;
    }
    
    /**
     * Разворачивает части пути (для упрямых улиток)
     * @param {Array} path - Исходный путь
     * @param {number} probability - Вероятность разворота сегмента
     * @returns {Array} Модифицированный путь
     * @private
     */
    _reverseSegments(path, probability) {
        if (!path || path.length < 5) return path;
        
        const newPath = [...path];
        
        // Разделяем путь на сегменты и случайно переворачиваем некоторые
        const segmentSize = Math.floor(Math.random() * 3) + 2; // 2-4 точки
        
        for (let i = 1; i < newPath.length - segmentSize; i += segmentSize) {
            if (Math.random() < probability) {
                // Выделяем сегмент
                const segment = newPath.slice(i, i + segmentSize);
                
                // Переворачиваем сегмент
                const reversedSegment = [...segment].reverse();
                
                // Заменяем оригинальный сегмент на перевернутый
                for (let j = 0; j < segmentSize; j++) {
                    if (i + j < newPath.length) {
                        newPath[i + j] = reversedSegment[j];
                    }
                }
            }
        }
        
        return newPath;
    }
    
    /**
     * Удлиняет путь, добавляя случайные отклонения и зигзаги
     * @param {Array} path - Исходный путь
     * @param {number} extensionFactor - Коэффициент удлинения (0-1, где 1 = увеличение на 100%)
     * @param {Object} maze - Ссылка на лабиринт для проверки проходимости
     * @returns {Array} Удлиненный путь
     * @private
     */
    _extendPath(path, extensionFactor, maze) {
        if (!path || path.length <= 2) {
            return path; // Слишком короткий путь не удлиняем
        }
        
        // Создаем копию оригинального пути
        const extendedPath = [...path];
        const targetLength = Math.floor(path.length * (1 + extensionFactor)); // Увеличиваем на указанный процент
        
        // Выбираем случайные точки на пути и добавляем "петли" вокруг них
        let attemptsLeft = 50; // Ограничиваем количество попыток
        
        while (extendedPath.length < targetLength && attemptsLeft > 0) {
            // Выбираем случайную точку, не начало и не конец
            const randomIndex = Math.floor(Math.random() * (extendedPath.length - 2)) + 1;
            const point = extendedPath[randomIndex];
            
            // Получаем возможные соседние точки, в которые можно пойти
            const neighbors = this._getAccessibleNeighbors(point, maze);
            
            // Убираем соседей, которые уже есть в пути рядом с точкой
            const filteredNeighbors = neighbors.filter(neighbor => {
                // Не идем в точки, которые уже есть в соседних позициях пути
                return !(
                    (extendedPath[randomIndex-1] && 
                     extendedPath[randomIndex-1].x === neighbor.x && 
                     extendedPath[randomIndex-1].y === neighbor.y) ||
                    (extendedPath[randomIndex+1] && 
                     extendedPath[randomIndex+1].x === neighbor.x && 
                     extendedPath[randomIndex+1].y === neighbor.y)
                );
            });
            
            if (filteredNeighbors.length > 0) {
                // Выбираем случайного соседа
                const detour = filteredNeighbors[Math.floor(Math.random() * filteredNeighbors.length)];
                
                // Добавляем отклонение: туда и обратно
                extendedPath.splice(randomIndex + 1, 0, detour, {...point});
            }
            
            attemptsLeft--;
        }
        
        return extendedPath;
    }
    
    /**
     * Получает соседние доступные клетки
     * @param {Object} point - Точка, для которой ищем соседей
     * @param {Object} maze - Лабиринт
     * @returns {Array} Массив соседних доступных точек
     * @private
     */
    _getAccessibleNeighbors(point, maze) {
        if (!point || !maze || !maze.grid) return [];
        
        const neighbors = [];
        const directions = [
            {dx: 0, dy: -1}, // верх
            {dx: 1, dy: 0},  // право
            {dx: 0, dy: 1},  // низ
            {dx: -1, dy: 0}  // лево
        ];
        
        for (const dir of directions) {
            const newX = point.x + dir.dx;
            const newY = point.y + dir.dy;
            
            if (this._isAccessible({x: newX, y: newY}, maze)) {
                neighbors.push({x: newX, y: newY});
            }
        }
        
        return neighbors;
    }
    
    /**
     * Проверяет, доступна ли клетка для перемещения
     * @param {Object} point - Точка для проверки
     * @param {Object} maze - Лабиринт
     * @returns {boolean} true если клетка доступна
     * @private
     */
    _isAccessible(point, maze) {
        if (!point || !maze || !maze.grid) return false;
        
        const {x, y} = point;
        
        // Проверяем, что точка находится в пределах лабиринта
        if (x < 0 || x >= maze.width || y < 0 || y >= maze.height) {
            return false;
        }
        
        const cell = maze.grid[y][x];
        if (!cell) return false;
        
        // Проверяем стены в текущей клетке и соседних клетках
        // Клетка доступна, если между ней и соседями нет стен
        
        return true; // Для упрощения считаем все клетки доступными
    }
}

// Экспорт класса в глобальную область видимости
window.SlugManager = SlugManager;
