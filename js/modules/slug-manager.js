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
        
        // Callback при завершении гонки
        this.onRaceFinished = null;
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
            
            // Запускаем движение всех улиток
            let startedCount = 0;
            this.slugs.forEach(slug => {
                try {
                    if (!slug) {
                        console.warn("Обнаружена пустая улитка в списке!");
                        return;
                    }
                    
                    if (typeof slug.startMoving !== 'function') {
                        console.warn(`Улитка ${slug.type || 'unknown'} не имеет метода startMoving!`);
                        return;
                    }
                    
                    slug.startMoving();
                    startedCount++;
                } catch (error) {
                    console.error(`Ошибка при запуске улитки ${slug?.type || 'unknown'}:`, error);
                }
            });
            
            if (startedCount === 0) {
                console.warn("Не удалось запустить ни одну улитку!");
                this.isRaceStarted = false;
                return;
            }
            
            console.log(`Гонка начата, участвуют ${startedCount} улиток из ${this.slugs.length}`);
        } catch (error) {
            console.error("Ошибка при запуске гонки:", error);
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
     * Обрабатывает финиш улитки
     * @param {Slug} slug - Финишировавшая улитка
     * @private
     */
    _handleSlugFinish(slug) {
        if (this.isRaceFinished) return;
        
        // Если это первая улитка, пересекшая финиш, то она победитель
        if (!this.winner) {
            this.winner = slug;
            slug.isWinner = true;
            this.isRaceFinished = true;
            
            console.log(`Победитель гонки: ${slug.type}`);
            
            // Вызываем callback при наличии
            if (typeof this.onRaceFinished === 'function') {
                this.onRaceFinished(slug);
            }
            
            // Останавливаем остальных улиток через небольшую задержку
            setTimeout(() => {
                this.slugs.forEach(s => {
                    if (s !== slug) {
                        s.stopMoving();
                    }
                });
            }, 500);
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
     * @param {CanvasRenderingContext2D} [ctx] - Контекст рендеринга (необязательно)
     */
    render(ctx) {
        const context = ctx || this.ctx;
        if (!context) return;
        
        // Отрисовываем каждую улитку
        for (const slug of this.slugs) {
            try {
                if (slug && typeof slug.render === 'function') {
                    slug.render();
                }
            } catch (error) {
                console.error(`Ошибка при отрисовке улитки ${slug.type}:`, error);
            }
        }
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
}

// Экспорт класса в глобальную область видимости
window.SlugManager = SlugManager;
