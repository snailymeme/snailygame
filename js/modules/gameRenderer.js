/**
 * Модуль для отрисовки игровой графики с оптимизацией производительности
 * Использует двойную буферизацию для улучшения производительности
 */

// Размеры ячеек лабиринта в пикселях
const DEFAULT_CELL_SIZE = 32;

/**
 * Класс для рендеринга игры
 */
export class GameRenderer {
    /**
     * Создает новый экземпляр GameRenderer
     * @param {HTMLCanvasElement} canvas - Canvas элемент для рендеринга
     * @param {Object} options - Дополнительные настройки
     * @param {number} options.cellSize - Размер ячейки лабиринта в пикселях
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = options.cellSize || DEFAULT_CELL_SIZE;
        this.images = {};
        
        // Создаем буферный canvas для двойной буферизации
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d');
        
        // Устанавливаем размеры canvas
        this.resize();
        
        // Привязываем обработчик изменения размера окна
        window.addEventListener('resize', () => this.resize());
    }
    
    /**
     * Изменяет размеры canvas в соответствии с размерами окна
     */
    resize() {
        // Получаем размеры контейнера
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Устанавливаем размеры для основного canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Устанавливаем такие же размеры для буферного canvas
        this.bufferCanvas.width = width;
        this.bufferCanvas.height = height;
        
        // Сохраняем соотношение сторон для масштабирования
        this.aspectRatio = width / height;
        
        console.log(`Canvas размер: ${width}x${height}`);
    }
    
    /**
     * Устанавливает изображения для рендеринга
     * @param {Object} images - Объект с предзагруженными изображениями
     */
    setImages(images) {
        this.images = images;
    }
    
    /**
     * Очищает canvas
     * @param {CanvasRenderingContext2D} context - Контекст для очистки
     */
    clear(context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    
    /**
     * Рисует лабиринт
     * @param {Object} maze - Объект лабиринта с сеткой, стартовой и финишной точками
     */
    drawMaze(maze) {
        const ctx = this.bufferCtx;
        this.clear(ctx);
        
        // Получаем размеры лабиринта
        const mazeWidth = maze.width;
        const mazeHeight = maze.height;
        
        // Расчет масштаба для автоматического размещения лабиринта на canvas
        const scale = Math.min(
            this.canvas.width / (mazeWidth * this.cellSize),
            this.canvas.height / (mazeHeight * this.cellSize)
        ) * 0.9; // Оставляем небольшой отступ
        
        // Рассчитываем смещение для центрирования лабиринта
        const offsetX = (this.canvas.width - mazeWidth * this.cellSize * scale) / 2;
        const offsetY = (this.canvas.height - mazeHeight * this.cellSize * scale) / 2;
        
        // Сохраняем смещение и масштаб для использования при отрисовке улиток
        this.mazeOffsetX = offsetX;
        this.mazeOffsetY = offsetY;
        this.mazeScale = scale;
        
        // Сохраняем текущее состояние контекста
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        // Отрисовываем фон
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, mazeWidth * this.cellSize, mazeHeight * this.cellSize);
        
        // Отрисовываем каждую ячейку лабиринта
        for (let y = 0; y < mazeHeight; y++) {
            for (let x = 0; x < mazeWidth; x++) {
                const cell = maze.grid[y][x];
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                // Рисуем стены ячейки
                ctx.fillStyle = '#222';
                
                if (cell.walls.top) {
                    ctx.fillRect(cellX, cellY, this.cellSize, 2);
                }
                if (cell.walls.right) {
                    ctx.fillRect(cellX + this.cellSize - 2, cellY, 2, this.cellSize);
                }
                if (cell.walls.bottom) {
                    ctx.fillRect(cellX, cellY + this.cellSize - 2, this.cellSize, 2);
                }
                if (cell.walls.left) {
                    ctx.fillRect(cellX, cellY, 2, this.cellSize);
                }
                
                // Если есть изображение стены, используем его
                if (this.images.wall) {
                    if (cell.walls.top) {
                        ctx.drawImage(this.images.wall, cellX, cellY, this.cellSize, 2);
                    }
                    if (cell.walls.right) {
                        ctx.drawImage(this.images.wall, cellX + this.cellSize - 2, cellY, 2, this.cellSize);
                    }
                    if (cell.walls.bottom) {
                        ctx.drawImage(this.images.wall, cellX, cellY + this.cellSize - 2, this.cellSize, 2);
                    }
                    if (cell.walls.left) {
                        ctx.drawImage(this.images.wall, cellX, cellY, 2, this.cellSize);
                    }
                }
            }
        }
        
        // Отрисовываем стартовую точку
        const startX = maze.startPoint.x * this.cellSize;
        const startY = maze.startPoint.y * this.cellSize;
        
        if (this.images.start) {
            ctx.drawImage(this.images.start, startX, startY, this.cellSize, this.cellSize);
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(startX + 5, startY + 5, this.cellSize - 10, this.cellSize - 10);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText('S', startX + this.cellSize/2 - 5, startY + this.cellSize/2 + 5);
        }
        
        // Отрисовываем финишную точку
        const finishX = maze.finishPoint.x * this.cellSize;
        const finishY = maze.finishPoint.y * this.cellSize;
        
        if (this.images.finish) {
            ctx.drawImage(this.images.finish, finishX, finishY, this.cellSize, this.cellSize);
        } else {
            ctx.fillStyle = '#F44336';
            ctx.fillRect(finishX + 5, finishY + 5, this.cellSize - 10, this.cellSize - 10);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText('F', finishX + this.cellSize/2 - 5, finishY + this.cellSize/2 + 5);
        }
        
        // Восстанавливаем состояние контекста
        ctx.restore();
    }
    
    /**
     * Рисует улиток на лабиринте
     * @param {Array} slugs - Массив улиток для отрисовки
     */
    drawSlugs(slugs) {
        const ctx = this.bufferCtx;
        
        // Применяем трансформации для соответствия лабиринту
        ctx.save();
        ctx.translate(this.mazeOffsetX, this.mazeOffsetY);
        ctx.scale(this.mazeScale, this.mazeScale);
        
        // Отрисовываем каждую улитку
        slugs.forEach(slug => {
            const x = slug.position.x * this.cellSize;
            const y = slug.position.y * this.cellSize;
            
            // Если есть путь для отладки и включен режим отладки
            if (slug.debugPath && slug.debugPath.length > 0 && slug.showDebugPath) {
                ctx.strokeStyle = slug.color + '80'; // Полупрозрачность
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                // Рисуем линию пути
                ctx.moveTo(
                    slug.startPosition.x * this.cellSize + this.cellSize / 2,
                    slug.startPosition.y * this.cellSize + this.cellSize / 2
                );
                
                slug.debugPath.forEach(point => {
                    ctx.lineTo(
                        point.x * this.cellSize + this.cellSize / 2,
                        point.y * this.cellSize + this.cellSize / 2
                    );
                });
                
                ctx.stroke();
            }
            
            // Определяем изображение улитки по типу
            let slugImage;
            switch (slug.type) {
                case 'racer':
                    slugImage = this.images.snail_red;
                    break;
                case 'explorer':
                    slugImage = this.images.snail_green;
                    break;
                case 'snake':
                    slugImage = this.images.snail_blue;
                    break;
                case 'stubborn':
                    slugImage = this.images.snail_lilac;
                    break;
                default:
                    slugImage = this.images.snail_yellow;
            }
            
            // Сохраняем контекст для вращения
            ctx.save();
            
            // Перемещаем центр координат в центр улитки
            const centerX = x + this.cellSize / 2;
            const centerY = y + this.cellSize / 2;
            ctx.translate(centerX, centerY);
            
            // Вращаем контекст в соответствии с направлением улитки
            ctx.rotate(slug.rotation);
            
            // Рисуем улитку с центром в начале координат
            const size = this.cellSize * slug.size;
            if (slugImage) {
                ctx.drawImage(
                    slugImage,
                    -size / 2,
                    -size / 2,
                    size,
                    size
                );
            } else {
                // Рисуем базовую форму, если изображение недоступно
                ctx.fillStyle = slug.color;
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Если улитка "думает" (остановилась), рисуем индикатор
            if (slug.thinking) {
                ctx.fillStyle = '#ffffff';
                const bubbleSize = 10;
                ctx.beginPath();
                ctx.arc(size / 2, -size / 2, bubbleSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Добавляем многоточие внутри пузыря
                ctx.fillStyle = '#000000';
                const dotSize = 2;
                const dotSpacing = 3;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(
                        size / 2 - dotSpacing * (1 - i),
                        -size / 2,
                        dotSize,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
            }
            
            // Восстанавливаем контекст после вращения
            ctx.restore();
        });
        
        // Восстанавливаем общий контекст
        ctx.restore();
    }
    
    /**
     * Копирует содержимое буферного canvas на основной canvas
     * Это основная оптимизация для повышения производительности
     */
    swapBuffers() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.bufferCanvas, 0, 0);
    }
    
    /**
     * Обновляет отображение с учетом лабиринта и улиток
     * @param {Object} maze - Объект лабиринта
     * @param {Array} slugs - Массив улиток
     */
    render(maze, slugs) {
        // Рисуем лабиринт и улиток на буферном canvas
        this.drawMaze(maze);
        this.drawSlugs(slugs);
        
        // Переносим результат на видимый canvas
        this.swapBuffers();
    }
} 