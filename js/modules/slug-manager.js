/**
 * Модуль для управления несколькими улитками в гонке
 * Обеспечивает создание, обновление и отрисовку улиток,
 * а также определение победителя
 */

class SlugManager {
    /**
     * Создает новый менеджер улиток
     * @param {Object} options - Параметры инициализации
     * @param {Object} options.maze - Лабиринт для гонки
     * @param {HTMLCanvasElement} options.canvas - Canvas для отрисовки
     */
    constructor(options = {}) {
        this.maze = options.maze || null;
        this.canvas = options.canvas || null;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        this.slugs = [];
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
}

// Экспорт класса в глобальную область видимости
window.SlugManager = SlugManager;
