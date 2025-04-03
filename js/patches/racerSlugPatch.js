/**
 * Патч для улитки типа "Гонщик"
 * 
 * Характеристики:
 * - Хаотичная улитка с периодическими мощными ускорениями
 * - Самое большое ускорение
 * - Часто рискует, что может принести победу
 * - Быстрый старт
 * - Может внезапно останавливаться
 * - Непредсказуемые смены маршрута
 * - Нестабильна на длинных дистанциях
 */

class RacerSlug {
    /**
     * Применяет патч к классу Slug
     */
    static applyPatch() {
        console.log("Применяем патч для улитки-гонщика...");
        
        // Проверяем, что класс Slug существует
        if (typeof Slug !== 'function') {
            console.error("Не найден класс Slug. Патч не применен.");
            return false;
        }
        
        // Сохраняем оригинальные методы
        const originalGeneratePath = Slug.prototype.generatePath;
        const originalInitSlugTypeParameters = Slug.prototype.initSlugTypeParameters;
        const originalStartMoving = Slug.prototype.startMoving;
        const originalMoveToNextPoint = Slug.prototype.moveToNextPoint;
        
        // Переопределяем метод инициализации параметров для типа "Гонщик"
        Slug.prototype.initSlugTypeParameters = function() {
            // Вызываем оригинальный метод
            originalInitSlugTypeParameters.call(this);
            
            // Усиливаем характеристики гонщика, если это гонщик
            if (this.type === 'racer') {
                console.log("Применение патча для улитки-гонщика:", this.colorName);
                
                // Увеличиваем вероятность ускорения
                this.turboBoostProbability = 0.35;  // Увеличиваем с 0.2 до 0.35
                
                // Делаем более мощное ускорение
                this.turboBoostMultiplier = 1.5;    // Увеличиваем с 1.3 до 1.5
                
                // Увеличиваем длительность ускорения
                this.turboBoostDuration = [2500, 4000]; // Увеличиваем верхнюю границу
                
                // Увеличиваем вероятность внезапной остановки
                this.suddenStopProbability = 0.20;  // Увеличиваем с 0.15 до 0.20
                
                // Увеличиваем вероятность смены маршрута
                this.randomRouteChangeProbability = 0.45; // Увеличиваем с 0.3 до 0.45
                
                // Эффект нестабильности на длинных дистанциях
                this.longDistanceUnstabilityDistance = 0;
                this.longDistanceUnstabilityThreshold = 15; // После 15 шагов активируется нестабильность
                this.longDistanceUnstabilityFactor = 0.3;   // Вероятность сбиться с пути
                
                // Улучшаем скорость для быстрого старта
                this.BASE_SPEED = 65; // Увеличиваем с 50 до 65
            }
        };
        
        // Переопределяем метод generatePath для типа "Гонщик"
        Slug.prototype.generatePath = function() {
            // Если это не гонщик, используем стандартный метод
            if (this.type !== 'racer') {
                return originalGeneratePath.call(this);
            }
            
            // Если улитка достигла финиша, не меняем путь
            if (this.hasFinished) return;
            
            // Обновляем турбо-ускорение
            this.updateTurboBoost();
            
            // Проверяем, не пора ли сделать внезапную остановку
            if (Math.random() < this.suddenStopProbability && this.pauseTimer <= 0) {
                this.pauseTimer = this.suddenStopDuration;
                console.log(`Гонщик ${this.colorName} внезапно останавливается на ${this.suddenStopDuration/1000} сек`);
                
                // Анимация остановки с проверкой доступности tweens
                this.safeTweens(tweens => {
                    tweens.add({
                        targets: this.sprite,
                        scaleY: 0.8,
                        scaleX: 1.2,
                        duration: 200,
                        yoyo: true,
                        repeat: 2
                    });
                });
                
                // В случае остановки не меняем текущий путь
                if (this.path && this.path.length > 1 && this.currentPathIndex < this.path.length) {
                    return;
                }
            }
            
            // Проверяем, не пора ли случайно сменить маршрут
            if (Math.random() < this.randomRouteChangeProbability) {
                const randomPath = this.generateRandomPath(2 + Math.floor(Math.random() * 3));
                if (randomPath && randomPath.length > 1) {
                    console.log(`Гонщик ${this.colorName} непредсказуемо меняет маршрут`);
                    this.path = randomPath;
                    this.currentPathIndex = 0;
                    return;
                }
            }
            
            // Проверяем, нет ли нестабильности на длинных дистанциях
            if (this.longDistanceUnstabilityDistance > this.longDistanceUnstabilityThreshold && 
                Math.random() < this.longDistanceUnstabilityFactor) {
                console.log(`Гонщик ${this.colorName} теряет стабильность на длинной дистанции`);
                
                // Теряем стабильность - делаем резкие повороты
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
            
            // В остальных случаях идем к финишу
            this.path = this.findPathToFinish();
            this.currentPathIndex = 0;
            
            // Если путь к финишу не найден, идем случайно
            if (!this.path || this.path.length <= 1) {
                this.path = this.generateRandomPath(2);
                this.currentPathIndex = 0;
            }
        };
        
        // Переопределяем метод startMoving для быстрого старта
        Slug.prototype.startMoving = function() {
            if (this.hasFinished) return;
            
            this.isMoving = true;
            this.generatePath();
            
            // Дополнительное ускорение на старте для гонщика
            if (this.type === 'racer') {
                // Временное увеличение скорости на старте
                const originalSpeed = this.speed;
                this.speed = this.speed * 1.3;
                
                // Более динамичная анимация старта с проверкой доступности tweens
                this.safeTweens(tweens => {
                    tweens.add({
                        targets: this.sprite,
                        scaleX: 1.3,
                        scaleY: 0.7,
                        duration: 250,
                        yoyo: true,
                        onComplete: () => {
                            // Возвращаем скорость к нормальной через 2 секунды
                            if (this.scene && this.scene.time) {
                                this.scene.time.delayedCall(2000, () => {
                                    this.speed = originalSpeed;
                                });
                            } else {
                                // Запасной вариант, если scene.time недоступен
                                setTimeout(() => {
                                    this.speed = originalSpeed;
                                }, 2000);
                            }
                            
                            this.moveToNextPoint();
                        }
                    });
                });
                
                console.log(`Гонщик ${this.colorName} делает стремительный старт!`);
            } else {
                // Стандартная анимация для других типов
                originalStartMoving.call(this);
            }
        };
        
        // Переопределяем метод moveToNextPoint для учета длины пройденного пути
        Slug.prototype.moveToNextPoint = function() {
            const result = originalMoveToNextPoint.call(this);
            
            // Увеличиваем счетчик длинной дистанции для гонщика
            if (this.type === 'racer' && this.isMoving && !this.hasFinished) {
                if (!this.longDistanceUnstabilityDistance) {
                    this.longDistanceUnstabilityDistance = 0;
                }
                this.longDistanceUnstabilityDistance++;
            }
            
            return result;
        };
        
        console.log("Патч для улитки типа 'Гонщик' успешно применен");
        return true;
    }
}

// Регистрируем патч при загрузке файла
try {
    if (window.patchLoader) {
        window.patchLoader.registerPatch('racer', RacerSlug.applyPatch);
        console.log("Патч улитки-гонщика успешно зарегистрирован");
    } else {
        console.error("Загрузчик патчей не найден");
    }
} catch (error) {
    console.error("Ошибка при регистрации патча улитки-гонщика:", error);
} 