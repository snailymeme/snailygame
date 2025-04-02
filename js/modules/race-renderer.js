/**
 * Модуль для рендеринга гонки улиток
 * Отвечает за визуализацию движения улиток на холсте
 */

// Настройки гонки
const config = {
    canvasWidth: 1000,
    canvasHeight: 600,
    trackWidth: 100,
    finishLinePosition: 900,
    snailWidth: 50,
    snailHeight: 30,
    fps: 60
};

// Хранит данные о состоянии гонки
let raceState = {
    snails: [],
    started: false,
    finished: false,
    winner: null,
    elapsedTime: 0,
    zoomLevel: 1,
    followSelectedSnail: false,
    selectedSnailId: null,
    cameraOffset: { x: 0, y: 0 }
};

// Canvas и контекст рисования
let canvas, ctx;

// Анимация
let animationFrameId;
let lastFrameTime;

/**
 * Инициализация рендерера гонки
 * @param {HTMLCanvasElement} raceCanvas - холст для отрисовки гонки
 * @param {Array} snailsData - данные улиток (id, цвет, скорость и т.д.)
 * @param {String} selectedSnailId - ID выбранной улитки
 */
export function initRaceRenderer(raceCanvas, snailsData, selectedSnailId) {
    canvas = raceCanvas;
    ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры холста
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    
    // Создаем улиток для гонки
    raceState.snails = snailsData.map((snail, index) => {
        return {
            id: snail.id,
            name: snail.name,
            color: snail.color,
            x: 50, // начальная позиция
            y: 50 + index * config.trackWidth, // вертикальное положение в зависимости от индекса
            speed: snail.speed,
            distance: 0,
            finished: false,
            finishTime: 0,
            position: 0
        };
    });
    
    // Запоминаем выбранную улитку
    raceState.selectedSnailId = selectedSnailId;
    
    // Добавляем обработчики событий для зума и прокрутки
    setupEventListeners();
    
    // Первоначальная отрисовка
    drawRaceTrack();
}

/**
 * Настройка обработчиков событий для управления отображением
 */
function setupEventListeners() {
    // Кнопка зума
    document.getElementById('zoom-in').addEventListener('click', () => {
        raceState.zoomLevel = Math.min(raceState.zoomLevel * 1.2, 3);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        raceState.zoomLevel = Math.max(raceState.zoomLevel / 1.2, 0.5);
    });
    
    // Кнопка следования за улиткой
    document.getElementById('follow-snail').addEventListener('click', () => {
        raceState.followSelectedSnail = !raceState.followSelectedSnail;
        const button = document.getElementById('follow-snail');
        if (raceState.followSelectedSnail) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

/**
 * Запуск гонки
 */
export function startRace() {
    if (raceState.started) return;
    
    raceState.started = true;
    raceState.finished = false;
    raceState.winner = null;
    raceState.elapsedTime = 0;
    
    // Сбрасываем позиции улиток
    raceState.snails.forEach((snail, index) => {
        snail.x = 50;
        snail.y = 50 + index * config.trackWidth;
        snail.distance = 0;
        snail.finished = false;
        snail.finishTime = 0;
        snail.position = 0;
    });
    
    // Запускаем анимацию
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(updateRace);
}

/**
 * Остановка гонки
 */
export function stopRace() {
    if (!raceState.started) return;
    
    raceState.started = false;
    cancelAnimationFrame(animationFrameId);
}

/**
 * Обновление состояния гонки (вызывается каждый кадр)
 * @param {number} timestamp - текущее время для расчета анимации
 */
function updateRace(timestamp) {
    // Расчет времени между кадрами
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    
    // Обновление времени гонки
    raceState.elapsedTime += deltaTime;
    
    // Обновление позиций улиток
    let finishedCount = 0;
    
    raceState.snails.forEach(snail => {
        if (snail.finished) {
            finishedCount++;
            return;
        }
        
        // Случайное движение улитки с разными скоростями
        const randomFactor = 0.5 + Math.random();
        const baseSpeed = snail.speed * 50; // базовая скорость улитки
        const speedThisFrame = baseSpeed * randomFactor * deltaTime;
        
        // У некоторых улиток есть шанс "застрять"
        const stuckChance = snail.id === 'stubborn' ? 0.1 : 0.01;
        if (Math.random() > stuckChance) {
            snail.distance += speedThisFrame;
            snail.x = 50 + snail.distance;
        }
        
        // Если улитка достигла финиша
        if (snail.x >= config.finishLinePosition) {
            snail.finished = true;
            snail.finishTime = raceState.elapsedTime;
            snail.position = finishedCount + 1; // Позиция в гонке
            
            // Если это первая улитка на финише - она победитель
            if (finishedCount === 0) {
                raceState.winner = snail.id;
            }
        }
    });
    
    // Проверка окончания гонки (все улитки финишировали или прошло максимальное время)
    if (finishedCount === raceState.snails.length || raceState.elapsedTime > 30) {
        raceState.finished = true;
        // Если гонка завершена, создаем событие для оповещения основного кода
        const isWinner = raceState.winner === raceState.selectedSnailId;
        
        // Находим данные выбранной улитки
        const selectedSnail = raceState.snails.find(s => s.id === raceState.selectedSnailId);
        const position = selectedSnail ? selectedSnail.position : 0;
        const time = Math.round(raceState.elapsedTime * 10) / 10;
        
        const raceFinishedEvent = new CustomEvent('race-finished', {
            detail: {
                winner: isWinner,
                position: position,
                time: time
            }
        });
        window.dispatchEvent(raceFinishedEvent);
        
        // Останавливаем анимацию
        stopRace();
    } else {
        // Отрисовка
        drawRaceTrack();
        
        // Продолжаем анимацию, если гонка не завершена
        animationFrameId = requestAnimationFrame(updateRace);
    }
}

/**
 * Отрисовка трассы и улиток
 */
function drawRaceTrack() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Применяем масштабирование и смещение камеры
    ctx.save();
    
    // Расчет смещения камеры при следовании за улиткой
    if (raceState.followSelectedSnail) {
        const selectedSnail = raceState.snails.find(s => s.id === raceState.selectedSnailId);
        if (selectedSnail) {
            // Центрируем камеру на выбранной улитке
            raceState.cameraOffset.x = canvas.width / (2 * raceState.zoomLevel) - selectedSnail.x;
            raceState.cameraOffset.y = canvas.height / (2 * raceState.zoomLevel) - selectedSnail.y;
        }
    }
    
    // Применяем масштабирование и смещение
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(raceState.zoomLevel, raceState.zoomLevel);
    ctx.translate(-canvas.width / 2 + raceState.cameraOffset.x, -canvas.height / 2 + raceState.cameraOffset.y);
    
    // Рисуем фоновую трассу
    drawBackground();
    
    // Рисуем линию финиша
    drawFinishLine();
    
    // Рисуем улиток
    raceState.snails.forEach(snail => {
        drawSnail(snail);
    });
    
    // Рисуем информацию о ходе гонки
    drawRaceInfo();
    
    ctx.restore();
}

/**
 * Отрисовка фона трассы
 */
function drawBackground() {
    // Рисуем полосы трассы
    raceState.snails.forEach((snail, index) => {
        const y = 50 + index * config.trackWidth;
        
        // Дорожка
        ctx.fillStyle = index % 2 === 0 ? '#f0f0f0' : '#e0e0e0';
        ctx.fillRect(0, y - config.trackWidth / 2, config.canvasWidth, config.trackWidth);
        
        // Линия дорожки
        ctx.strokeStyle = '#d0d0d0';
        ctx.beginPath();
        ctx.moveTo(0, y + config.trackWidth / 2);
        ctx.lineTo(config.canvasWidth, y + config.trackWidth / 2);
        ctx.stroke();
        
        // Номер дорожки
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.fillText(`${index + 1}`, 10, y);
    });
}

/**
 * Отрисовка финишной линии
 */
function drawFinishLine() {
    const finishX = config.finishLinePosition;
    
    // Финишная черта
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(finishX, 0);
    ctx.lineTo(finishX, canvas.height);
    ctx.stroke();
    
    // Флаг финиша
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(finishX, 0);
    ctx.lineTo(finishX + 20, 10);
    ctx.lineTo(finishX, 20);
    ctx.fill();
    
    // Текст "Финиш"
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('ФИНИШ', finishX + 10, 40);
}

/**
 * Отрисовка улитки
 * @param {Object} snail - данные улитки
 */
function drawSnail(snail) {
    // Тело улитки
    ctx.fillStyle = getColorForEmoji(snail.color);
    ctx.beginPath();
    ctx.ellipse(snail.x, snail.y, config.snailWidth / 2, config.snailHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Панцирь улитки
    ctx.fillStyle = getShellColorForEmoji(snail.color);
    ctx.beginPath();
    ctx.ellipse(snail.x - 5, snail.y - 5, config.snailWidth / 3, config.snailHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Рожки
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Левый рожок
    ctx.beginPath();
    ctx.moveTo(snail.x + config.snailWidth / 2 - 5, snail.y - config.snailHeight / 3);
    ctx.lineTo(snail.x + config.snailWidth / 2 + 5, snail.y - config.snailHeight / 2 - 5);
    ctx.stroke();
    
    // Правый рожок
    ctx.beginPath();
    ctx.moveTo(snail.x + config.snailWidth / 2 + 5, snail.y - config.snailHeight / 3);
    ctx.lineTo(snail.x + config.snailWidth / 2 + 15, snail.y - config.snailHeight / 2 - 5);
    ctx.stroke();
    
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(snail.x + config.snailWidth / 2 + 5, snail.y - config.snailHeight / 3, 2, 0, Math.PI * 2);
    ctx.arc(snail.x + config.snailWidth / 2 - 5, snail.y - config.snailHeight / 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Имя улитки
    ctx.fillStyle = snail.id === raceState.selectedSnailId ? '#FF0000' : '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(snail.name, snail.x - config.snailWidth / 2, snail.y - config.snailHeight);
    
    // Если улитка финишировала, показываем ее позицию
    if (snail.finished) {
        ctx.fillStyle = '#FF5500';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`#${snail.position}`, snail.x + config.snailWidth / 2 + 5, snail.y + 5);
    }
    
    // Выделение выбранной улитки
    if (snail.id === raceState.selectedSnailId) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(snail.x, snail.y, config.snailWidth / 2 + 5, config.snailHeight / 2 + 5, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

/**
 * Отрисовка информации о гонке
 */
function drawRaceInfo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 60);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText(`Время: ${raceState.elapsedTime.toFixed(1)} сек`, 20, 30);
    
    if (raceState.winner) {
        ctx.fillText(`Победитель: ${raceState.snails.find(s => s.id === raceState.winner).name}`, 20, 50);
    } else if (raceState.started) {
        ctx.fillText('Гонка идет!', 20, 50);
    } else {
        ctx.fillText('Ожидание старта...', 20, 50);
    }
}

/**
 * Получение цвета для эмодзи
 * @param {string} emoji - эмодзи цвета
 * @returns {string} - цвет в формате CSS
 */
function getColorForEmoji(emoji) {
    switch (emoji) {
        case '🔴': return '#FF5555';
        case '🟢': return '#55CC55';
        case '🔵': return '#5555FF';
        case '🟣': return '#AA55AA';
        case '🟡': return '#FFCC44';
        default: return '#AAAAAA';
    }
}

/**
 * Получение цвета панциря для эмодзи
 * @param {string} emoji - эмодзи цвета
 * @returns {string} - цвет в формате CSS
 */
function getShellColorForEmoji(emoji) {
    switch (emoji) {
        case '🔴': return '#AA3333';
        case '🟢': return '#338833';
        case '🔵': return '#3333AA';
        case '🟣': return '#772277';
        case '🟡': return '#BB9933';
        default: return '#777777';
    }
} 