/**
 * Snail to Riches - Главный JavaScript файл
 * Основная логика игры и интеграция с Telegram Mini App
 */

// Код для отображения ошибок в UI
function showError(message, details) {
    console.error(`Error: ${message}`, details);
    
    // Создаем элемент для отображения ошибки
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); color: white; padding: 20px; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;';
    
    const errorTitle = document.createElement('h2');
    errorTitle.textContent = 'An error occurred';
    errorTitle.style.cssText = 'color: #ff5555; margin-bottom: 20px;';
    
    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorMessage.style.cssText = 'margin-bottom: 15px; max-width: 80%;';
    
    const errorDetails = document.createElement('pre');
    errorDetails.textContent = details ? JSON.stringify(details, null, 2) : 'No additional information';
    errorDetails.style.cssText = 'background: rgba(0,0,0,0.5); padding: 10px; border-radius: 5px; max-width: 80%; overflow: auto; text-align: left; margin-bottom: 20px;';
    
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload page';
    reloadButton.style.cssText = 'background: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;';
    reloadButton.onclick = () => window.location.reload();
    
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(errorDetails);
    errorContainer.appendChild(reloadButton);
    
    document.body.appendChild(errorContainer);
}

/**
 * Настраивает элементы для отображения гонки
 * @returns {Object} Объект с созданными элементами
 */
function setupRaceElements() {
    // Создаем контейнер для гонки, если его не существует
    let raceContainer = document.getElementById('race-container');
    if (!raceContainer) {
        raceContainer = document.createElement('div');
        raceContainer.id = 'race-container';
        raceContainer.classList.add('hidden');
        raceContainer.style.cssText = 'width: 100%; height: 80vh; position: relative; margin: 0 auto; overflow: hidden; background-color: #000;';
        document.body.appendChild(raceContainer);
    }
    
    // Создаем canvas для отрисовки гонки, если его не существует
    let raceCanvas = document.getElementById('race-canvas');
    if (!raceCanvas) {
        raceCanvas = document.createElement('canvas');
        raceCanvas.id = 'race-canvas';
        raceCanvas.style.cssText = 'display: block; margin: 0 auto; background-color: #111;';
        raceContainer.appendChild(raceCanvas);
    }
    
    // Создаем панель информации о гонке
    let raceInfo = document.getElementById('race-info');
    if (!raceInfo) {
        raceInfo = document.createElement('div');
        raceInfo.id = 'race-info';
        raceInfo.classList.add('race-info');
        raceInfo.style.cssText = 'position: absolute; top: 10px; left: 10px; padding: 5px 10px; background-color: rgba(0,0,0,0.7); color: white; border-radius: 5px; font-size: 14px; z-index: 10;';
        
        // Добавляем таймер гонки
        const raceTimer = document.createElement('div');
        raceTimer.id = 'race-timer';
        raceTimer.textContent = 'Время: 0.0 сек';
        raceInfo.appendChild(raceTimer);
        
        // Добавляем информацию о выбранной улитке
        const selectedSnailInfo = document.createElement('div');
        selectedSnailInfo.id = 'selected-snail-info';
        selectedSnailInfo.textContent = 'Ваша улитка: Не выбрана';
        raceInfo.appendChild(selectedSnailInfo);
        
        raceContainer.appendChild(raceInfo);
    }
    
    // Создаем экран загрузки, если его не существует
    let loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) {
        loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.classList.add('overlay', 'hidden');
        loadingScreen.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        
        const loadingContent = document.createElement('div');
        loadingContent.className = 'overlay-content';
        loadingContent.style.cssText = 'text-align: center; color: white;';
        
        const loadingText = document.createElement('p');
        loadingText.textContent = 'Загрузка гонки...';
        loadingText.style.cssText = 'font-size: 24px; margin-bottom: 20px;';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = 'width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite;';
        
        // Добавляем стиль для анимации спиннера
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        
        loadingContent.appendChild(loadingText);
        loadingContent.appendChild(spinner);
        loadingScreen.appendChild(loadingContent);
        
        document.body.appendChild(loadingScreen);
    }
    
    return {
        raceContainer,
        raceCanvas,
        raceInfo,
        loadingScreen
    };
}

// Функция для показа экрана загрузки
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

// Функция для скрытия экрана загрузки
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// Глобальные переменные
let selectedSnail = null;
let betAmount = 0.5;
let maze = null;
let slugManager = null;
let canvas = null;
let ctx = null;
let wallet = null;
let raceStarted = false;
let raceFinished = false;
let gameCycle = null;
// Режим отладки (для дополнительной информации)
const DEBUG_MODE = false;

// Настройки изображений
const IMAGE_PATHS = {
    wall: 'images/wall_texture.png',
    start: 'images/start.png',
    finish: 'images/finish.png',
    snail_red: 'images/snail_red.png',
    snail_blue: 'images/snail_blue.png',
    snail_green: 'images/snail_green.png',
    snail_lilac: 'images/snail_lilac.png',
    snail_yellow: 'images/snail_yellow.png'
};

// Массив улиток-соперников
const OPPONENTS = [
    { type: 'racer', image: 'images/snail_red.png', name: 'Racer' },
    { type: 'explorer', image: 'images/snail_green.png', name: 'Explorer' },
    { type: 'snake', image: 'images/snail_blue.png', name: 'Snake' },
    { type: 'stubborn', image: 'images/snail_lilac.png', name: 'Stubborn' }
];

// Кеш загруженных изображений
const imageCache = {};

// Константы для типов улиток
const SNAIL_TYPES = {
    racer: {
        name: 'Racer',
        color: '#e53935',
        description: 'Fast, but unpredictable'
    },
    explorer: {
        name: 'Explorer',
        color: '#43a047',
        description: 'Smartly avoids obstacles'
    },
    snake: {
        name: 'Snake',
        color: '#1e88e5',
        description: 'Winding, flexible path'
    },
    stubborn: {
        name: 'Stubborn',
        color: '#8e24aa',
        description: 'Unpredictable stops and bursts'
    },
    deadender: {
        name: 'Default',
        color: '#ffb300',
        description: 'Balanced, standard snail'
    }
};

// Коэффициенты выигрыша для разных типов улиток
const WIN_MULTIPLIERS = {
    racer: 1.5,
    explorer: 2.0,
    snake: 1.8,
    stubborn: 1.6,
    deadender: 1.2
};

// Стили для лабиринта (добавят визуальное разнообразие)
const MAZE_STYLES = [
    {
        name: "Neon Cyber Maze",
        path: {
            name: "NeonBluePath",
            color: "#00FFFF",
            effect: "glow"
        },
        wall: {
            name: "NeonPinkWall",
            color: "#FF69B4", 
            effect: "glow"
        }
    },
    {
        name: "Holographic Grid",
        path: {
            name: "HoloFloor",
            color: "#C0C0C0",
            effect: "flicker"
        },
        wall: {
            name: "HoloWall",
            color: "#00B7EB",
            effect: "transparency"
        }
    },
    {
        name: "Alien Jungle Maze",
        path: {
            name: "BiolumPath",
            color: "#00FF00",
            effect: "glow"
        },
        wall: {
            name: "VineWall",
            color: "#800080",
            effect: "texture"
        }
    },
    {
        name: "Quantum Circuit Board",
        path: {
            name: "CircuitPath",
            color: "#FFFF00",
            effect: "electric"
        },
        wall: {
            name: "CircuitWall",
            color: "#000000",
            effect: "pattern"
        }
    },
    {
        name: "Crystal Cave",
        path: {
            name: "CrystalPath",
            color: "#00CED1",
            effect: "sparkle"
        },
        wall: {
            name: "RockWall",
            color: "#2F4F4F",
            effect: "texture"
        }
    },
    {
        name: "Space Station Corridors",
        path: {
            name: "MetalPath",
            color: "#C0C0C0",
            effect: "metallic"
        },
        wall: {
            name: "RedBarrier",
            color: "#FF0000",
            effect: "glow"
        }
    },
    {
        name: "Underwater Reef",
        path: {
            name: "CoralPath",
            color: "#40E0D0",
            effect: "waves"
        },
        wall: {
            name: "WaterWall",
            color: "#000080",
            effect: "bubbles"
        }
    },
    {
        name: "Robotic Assembly Line",
        path: {
            name: "ConveyorPath",
            color: "#808080",
            effect: "move"
        },
        wall: {
            name: "RobotArmWall",
            color: "#FFA500",
            effect: "metallic"
        }
    }
];

// Функция для получения случайного стиля лабиринта
function getRandomMazeStyle() {
    const styleIndex = Math.floor(Math.random() * MAZE_STYLES.length);
    return MAZE_STYLES[styleIndex];
}

// Когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    try {
        // Проверяем и загружаем ресурсы перед инициализацией
        checkAndLoadResources()
            .then(() => {
                console.log('Resources loaded successfully, initializing app...');
                
                if (typeof logInfo === 'function') {
                    logInfo('Ресурсы успешно загружены, запуск приложения');
                }
                
                // Инициализируем приложение
        initApp();
        
                // Создаем элементы интерфейса
                createSnailOptions();
                
                // Инициализируем обработчики событий
                setupEventListeners();
            })
            .catch(error => {
                console.error('Error loading resources:', error);
                
                if (typeof showError === 'function') {
                    showError('Resource loading error', error);
                }
                
                if (typeof logError === 'function') {
                    logError('Ошибка загрузки ресурсов', error);
                }
            });
    } catch (error) {
        console.error('Critical error during initialization:', error);
        
        if (typeof showError === 'function') {
            showError('Critical initialization error', error);
        }
        
        if (typeof logError === 'function') {
            logError('Критическая ошибка инициализации', error);
        }
    }
});

// Инициализация приложения
function initApp() {
    console.log('Initializing application...');
    
    try {
    // Проверим, в режиме отладки или внутри Telegram
    const isDebugMode = !window.Telegram || !window.Telegram.WebApp;
    
    // Инициализация Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
            try {
        // Сообщаем Telegram, что приложение готово
        tg.ready();
        
                console.log('Telegram WebApp initialized:', tg.initDataUnsafe);
        
        // Расширяем приложение на весь экран
        tg.expand();
        
        // Устанавливаем цвета согласно теме Telegram
        if (tg.colorScheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Добавляем класс для стилизации согласно теме Telegram
        document.body.classList.add('telegram-theme');
            } catch (tgError) {
                console.warn('Error during Telegram WebApp initialization:', tgError);
                // Продолжаем работу даже при ошибке Telegram
            }
    } else {
            console.log('Telegram WebApp not available, working in debug mode');
        // В режиме отладки показываем стартовый экран принудительно
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.remove('hidden');
            startScreen.style.display = 'flex';
        }
    }
    
        // Загружаем все необходимые изображения
        console.log('Загрузка изображений...');
        loadGameImages()
            .then(() => {
                console.log('Все изображения успешно загружены');
                
                // Продолжаем инициализацию после загрузки изображений
    // Создаем снейлов на странице выбора
    createSnailOptions();
    
    // Инициализация UI элементов
    initUI();
    
                // Инициализация кошелька Solana - оборачиваем в try-catch
                try {
    initWallet();
                } catch (walletError) {
                    console.warn('Wallet initialization error:', walletError);
                    // Продолжаем работу даже при ошибке кошелька
                }
                
                console.log('Application initialized');
            })
            .catch(error => {
                console.error('Error loading images:', error);
                showError('Failed to load game images', error);
            });
        
        return true;
    } catch (error) {
        console.error('Error in application initialization:', error);
        showError('Application initialization error', error);
        return false;
    }
}

// Функция для загрузки всех игровых изображений
function loadGameImages() {
    return new Promise((resolve, reject) => {
        const imagesToLoad = [
            // Загрузка изображений лабиринта
            ...Object.values(IMAGE_PATHS),
            // Загрузка изображений улиток
            ...OPPONENTS.map(opponent => opponent.image)
        ];
        
        console.log('Загрузка изображений:', imagesToLoad);
        
        // Добавляем изображение игрока
        const deadenderImage = 'images/snail_yellow.png';
        if (!imagesToLoad.includes(deadenderImage)) {
            imagesToLoad.push(deadenderImage);
        }
        
        let loadedCount = 0;
        const totalImages = imagesToLoad.length;
        
        // Функция для отслеживания прогресса загрузки
        const onImageLoad = (path) => {
            loadedCount++;
            console.log(`Загружено изображение (${loadedCount}/${totalImages}): ${path}`);
            
            // Когда все изображения загружены, разрешаем промис
            if (loadedCount === totalImages) {
                console.log('Все изображения успешно загружены');
                resolve(imageCache);
            }
        };
        
        // Загружаем каждое изображение
        imagesToLoad.forEach(path => {
            // Если изображение уже загружено, просто увеличиваем счетчик
            if (imageCache[path] && imageCache[path].complete) {
                onImageLoad(path);
                return;
            }
            
            const img = new Image();
            
            // Устанавливаем обработчики до установки src!
            img.onload = () => {
                imageCache[path] = img;
                onImageLoad(path);
            };
            
            img.onerror = (error) => {
                console.error(`Ошибка загрузки изображения ${path}:`, error);
                
                // Создаем пустое изображение вместо ошибки
                const emptyImg = new Image(40, 40);
                emptyImg.width = 40;
                emptyImg.height = 40;
                imageCache[path] = emptyImg;
                
                // Продолжаем, несмотря на ошибку
                onImageLoad(path);
            };
            
            // Загружаем изображение напрямую, без кэширования
            img.src = path;
        });
        
        // Если нет изображений для загрузки, сразу разрешаем промис
        if (totalImages === 0) {
            resolve(imageCache);
        }
    });
}

// Добавляем улучшенную функцию для добавления улиток на экран выбора
function createSnailOptions() {
    console.log('Creating snail options...');
    
    try {
        let snailGrid = document.querySelector('.snail-grid');
        
        // Если элемент .snail-grid не найден, попробуем найти start-screen и создать в нем snail-grid
        if (!snailGrid) {
            console.warn('Element .snail-grid not found! Attempting to create it...');
            
            // Логирование для отладки
            if (typeof logWarning === 'function') {
                logWarning('Не найден элемент .snail-grid, пытаемся создать');
            }
            
            const startScreen = document.getElementById('start-screen');
            
            // Если не найден start-screen, проверяем весь DOM и создаем нужные элементы
            if (!startScreen) {
                console.error('Start screen element not found! Attempting to create base structure...');
                
                if (typeof logError === 'function') {
                    logError('Не найден элемент start-screen, создаем базовую структуру');
                }
                
                // Проверяем наличие контейнера app
                let appContainer = document.getElementById('app');
                
                if (!appContainer) {
                    console.warn('App container not found, creating it');
                    appContainer = document.createElement('div');
                    appContainer.id = 'app';
                    document.body.appendChild(appContainer);
                }
                
                // Создаем start-screen
                const newStartScreen = document.createElement('div');
                newStartScreen.id = 'start-screen';
                newStartScreen.className = 'screen';
                newStartScreen.style.display = 'flex';
                
                // Добавляем базовую структуру
                newStartScreen.innerHTML = `
                    <h1>Snail to Riches</h1>
                    <div id="snail-selection">
                        <h2>Choose your snail</h2>
                        <div class="snail-grid"></div>
                    </div>
                    <div id="betting-section">
                        <div class="bet-container">
                            <span class="bet-label">Bet:</span>
                            <input type="number" id="bet-amount" placeholder="Enter bet amount" value="10">
                        </div>
                        <div class="balance-info">
                            <span>Balance: <span id="balance-amount">100</span> coins</span>
                        </div>
                        <button id="start-race" class="buy-button">Start Race</button>
                    </div>
                `;
                
                appContainer.appendChild(newStartScreen);
                
                // Обновляем snailGrid после создания
                snailGrid = newStartScreen.querySelector('.snail-grid');
                
                // Делаем все остальные экраны скрытыми
                const otherScreens = document.querySelectorAll('.screen:not(#start-screen)');
                otherScreens.forEach(screen => {
                    screen.classList.add('hidden');
                    screen.style.display = 'none';
                });
                
                console.log('Created basic screen structure');
                
                // Добавляем обработчик для кнопки старта
                setTimeout(() => {
                    const startRaceBtn = document.getElementById('start-race');
                    if (startRaceBtn) {
                        startRaceBtn.addEventListener('click', startRace);
                        console.log('Added event listener to start race button');
                    }
                }, 100);
            } else {
                // start-screen найден, проверяем наличие заголовка и создаем .snail-grid
                console.log('Start screen found, checking for h2 and creating snail-grid');
                
                let snailSelection = startScreen.querySelector('#snail-selection');
                
                // Если нет контейнера для выбора улиток, создаем его
                if (!snailSelection) {
                    snailSelection = document.createElement('div');
                    snailSelection.id = 'snail-selection';
                    
                    // Находим место для вставки
                    const h1 = startScreen.querySelector('h1');
                    if (h1) {
                        startScreen.insertBefore(snailSelection, h1.nextSibling);
                    } else {
                        startScreen.prepend(snailSelection);
                    }
                }
                
                // Проверяем, есть ли уже заголовок h2 в snail-selection
                let titleExists = snailSelection.querySelector('h2');
                if (!titleExists) {
                    const title = document.createElement('h2');
                    title.textContent = 'Choose your snail';
                    snailSelection.appendChild(title);
                }
                
                // Создаем элемент snail-grid
                snailGrid = document.createElement('div');
                snailGrid.className = 'snail-grid';
                snailSelection.appendChild(snailGrid);
                
                console.log('Created .snail-grid element');
            }
        }
        
        console.log('Creating snail options in grid:', snailGrid);
        snailGrid.innerHTML = '';
        
        // Добавляем логирование для отладки
        if (typeof logInfo === 'function') {
            logInfo('Создание вариантов улиток', {
                gridFound: !!snailGrid,
                snailTypes: Object.keys(SNAIL_TYPES)
            });
        }
        
        // Добавляем стандартную улитку
        const defaultSnail = SNAIL_TYPES.deadender;
        addSnailOption(snailGrid, 'deadender', defaultSnail.name, defaultSnail.color, defaultSnail.description);
        
        // Добавляем остальные типы улиток
        for (const type in SNAIL_TYPES) {
            if (type !== 'deadender') {
                const snail = SNAIL_TYPES[type];
                addSnailOption(snailGrid, type, snail.name, snail.color, snail.description);
            }
        }
        
        // Проверяем, добавились ли улитки
        setTimeout(() => {
            const addedOptions = snailGrid.querySelectorAll('.snail-option');
            console.log(`Added ${addedOptions.length} snail options to the grid`);
            
            if (typeof logInfo === 'function') {
                logInfo(`Добавлено ${addedOptions.length} вариантов улиток`);
            }
            
            if (addedOptions.length === 0) {
                // Если улитки не появились, принудительно добавляем их снова
                console.warn('No snail options were added, trying to fix...');
                
                // Чистим и пробуем снова
                setTimeout(() => {
                    snailGrid.innerHTML = '';
                    
                    // Упрощенное добавление всех улиток
                    Object.entries(SNAIL_TYPES).forEach(([type, snail]) => {
                        const element = document.createElement('div');
                        element.className = 'snail-option';
                        element.dataset.snail = type;
                        
                        element.innerHTML = `
                            <div class="snail-color" style="background-color: ${snail.color}"></div>
                            <div class="snail-info">
                                <h3>${snail.name}</h3>
                                <p>${snail.description}</p>
                            </div>
                        `;
                        
                        element.addEventListener('click', () => selectSnail(element, type));
                        snailGrid.appendChild(element);
                        
                        console.log(`Force-added snail option: ${type}`);
                    });
                    
                    if (typeof logInfo === 'function') {
                        logInfo('Принудительное восстановление улиток завершено');
                    }
                    
                    // Автоматически выбираем первую улитку
                    const firstSnail = snailGrid.querySelector('.snail-option');
                    if (firstSnail) {
                        firstSnail.click();
                    }
                }, 500);
            }
        }, 100);
        
        // Показываем стартовый экран, если он скрыт
        const startScreen = document.getElementById('start-screen');
        if (startScreen && (startScreen.style.display === 'none' || startScreen.classList.contains('hidden'))) {
            console.log('Showing start screen');
            startScreen.style.display = 'flex';
            startScreen.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error creating snail options:', error);
        
        if (typeof logError === 'function') {
            logError('Ошибка создания опций улиток: ' + error.message);
        }
        
        if (typeof showError === 'function') {
            showError('Не удалось создать варианты улиток', error);
        }
    }
}

// Добавляет одну опцию улитки в grid
function addSnailOption(container, type, name, color, description) {
    const snailOption = document.createElement('div');
    snailOption.className = 'snail-option';
    snailOption.dataset.snail = type;
    
    snailOption.innerHTML = `
        <div class="snail-color" style="background-color: ${color}"></div>
        <div class="snail-info">
            <h3>${name}</h3>
            <p>${description}</p>
        </div>
    `;
    
    snailOption.addEventListener('click', () => selectSnail(snailOption, type));
    
    container.appendChild(snailOption);
}

// Обработка выбора улитки
function selectSnail(element, type) {
    // Снимаем выделение со всех улиток
    document.querySelectorAll('.snail-option').forEach(opt => 
        opt.classList.remove('selected'));
    
    // Выделяем выбранную улитку
    element.classList.add('selected');
    
    // Сохраняем выбранный тип улитки
    selectedSnail = type;
    
    console.log('Selected snail:', SNAIL_TYPES[type].name);
    
    // Обновляем UI
    updateRaceButton();
}

// Инициализация UI элементов
function initUI() {
    // Получаем элементы UI
    const connectWalletBtn = document.getElementById('connect-wallet');
    const startRaceBtn = document.getElementById('start-race');
    const betAmountInput = document.getElementById('bet-amount');
    const playAgainBtn = document.getElementById('play-again');
    
    // Инициализация canvas
    canvas = document.getElementById('race-canvas');
    
    if (canvas) {
        ctx = canvas.getContext('2d');
        // Адаптируем размер canvas при изменении размера окна
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }
    
    // Обработчик изменения суммы ставки
    if (betAmountInput) {
        betAmountInput.addEventListener('input', () => {
            betAmount = parseFloat(betAmountInput.value) || 0;
            updateRaceButton();
        });
    }
    
    // Обработчик нажатия кнопки подключения кошелька
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // Обработчик нажатия кнопки начала гонки
    if (startRaceBtn) {
        startRaceBtn.addEventListener('click', startRace);
    }
    
    // Обработчик нажатия кнопки "Play Again"
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', resetGame);
    }
    
    console.log('UI initialized');
}

// Инициализация кошелька Solana
function initWallet() {
    // Создаем экземпляр кошелька Solana
    if (typeof SolanaWallet === 'function') {
        wallet = new SolanaWallet({
            network: 'devnet', // Using devnet for testing
            telegram: window.Telegram && window.Telegram.WebApp
        });
        
        console.log('Wallet initialized');
    } else {
        console.error('SolanaWallet not defined!');
    }
}

// Инициализация загрузчика патчей
function initPatchLoader() {
    if (window.patchLoader) {
        // Уже существующие патчи будут применены
        console.log('Registered patches:', window.patchLoader.getRegisteredTypes());
        const results = window.patchLoader.applyAllPatches();
        console.log('Applying all patches:', results);
    } else {
        console.error('PatchLoader not defined!');
    }
}

// Подключение кошелька Solana
function connectWallet() {
    if (!wallet) {
        console.error('Error: Wallet not initialized');
        return;
    }
    
    const connectWalletBtn = document.getElementById('connect-wallet');
    
    if (connectWalletBtn) {
        connectWalletBtn.disabled = true;
        connectWalletBtn.textContent = 'Connecting...';
    }
    
    wallet.connect()
        .then(info => {
            console.log('Wallet connected:', info);
            
            // Обновляем UI
            if (connectWalletBtn) {
                connectWalletBtn.textContent = `${wallet.getShortPublicKey()} (${wallet.formatSOL(info.balance)})`;
            }
            
            document.getElementById('balance-amount').textContent = info.balance;
            
            updateRaceButton();
        })
        .catch(error => {
            console.error('Error connecting wallet:', error);
            
            if (connectWalletBtn) {
                connectWalletBtn.textContent = 'Connect Wallet';
            }
        })
        .finally(() => {
            if (connectWalletBtn) {
                connectWalletBtn.disabled = false;
            }
        });
}

// Обновление состояния кнопки начала гонки
function updateRaceButton() {
    const startRaceBtn = document.getElementById('start-race');
    
    if (!startRaceBtn) return;
    
    // Проверяем условия для активации кнопки
    const hasValidBet = betAmount > 0;
    const hasSelectedSnail = selectedSnail !== null;
    
    // ИЗМЕНЕНО: Не требуем подключения кошелька для начала игры
    // Активируем кнопку, если улитка выбрана и ставка введена
    startRaceBtn.disabled = !(hasValidBet && hasSelectedSnail);
    
    // Показываем подсказку, почему кнопка неактивна
    if (!hasSelectedSnail) {
        startRaceBtn.title = 'Choose a snail';
    } else if (!hasValidBet) {
        startRaceBtn.title = 'Enter bet amount';
    } else {
        startRaceBtn.title = 'Start Race';
    }
}

/**
 * Изменяет размер canvas в соответствии с размером окна
 */
function resizeCanvas() {
    if (!canvas) return;
    
    // Получаем размер контейнера
    const container = document.getElementById('race-container');
    if (!container) return;
    
    // Устанавливаем полный размер контейнера
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Если есть лабиринт и менеджер улиток, перерисовываем сцену
    if (maze && slugManager) {
        // Перерисовываем сцену с новым размером
        render();
    }
    
    console.log(`Canvas размер установлен: ${canvas.width} x ${canvas.height}`);
}

// Добавляем слушатель события изменения размера окна
window.addEventListener('resize', resizeCanvas);

// Проверка доступности ресурсов
function checkResourcesAvailability() {
    return new Promise((resolve, reject) => {
        // Проверяем доступность изображений
        console.log('Checking resources availability...');
        
        // Проверяем, есть ли папка images
        const img = new Image();
        img.onload = () => {
            console.log('Test image loaded successfully, resources available');
            resolve(true);
        };
        img.onerror = () => {
            console.error('Error loading test image');
            reject(new Error('Failed to load images. Check if images folder exists'));
        };
        // Пробуем загрузить любое изображение из папки images
        img.src = 'images/snail_red.png?' + Date.now();
    });
}

// Инициализирует игровой цикл
function initGameCycle() {
    if (!slugManager || !canvas) {
        console.error('Не удалось инициализировать игровой цикл: не определены slugManager или canvas');
        return false;
    }
    
    // Создаем новый экземпляр GameCycle
    gameCycle = new GameCycle({
        slugManager: slugManager,
        canvas: canvas
    });
    
    // Устанавливаем обработчики событий
    gameCycle.setOnRaceStart(() => {
        console.log('Гонка началась!');
        showRaceScreen();
    });
    
    gameCycle.setOnRaceUpdate((data) => {
        updateRaceUI(data.elapsedTime);
    });
    
    gameCycle.setOnWinnerDetermined((winner) => {
        console.log('Победитель определен:', winner?.type);
        highlightWinner(winner);
    });
    
    gameCycle.setOnRaceFinish((raceData) => {
        console.log('Гонка завершена!', raceData);
        processRaceResults(raceData);
    });
    
    console.log('Игровой цикл инициализирован');
    return true;
}

/**
 * Обновляет интерфейс гонки на основе данных
 * @param {number} elapsedTime - Прошедшее время гонки
 */
function updateRaceUI(elapsedTime) {
    // Обновляем таймер гонки
    const timerElement = document.getElementById('race-timer');
    if (timerElement) {
        timerElement.textContent = `Время: ${elapsedTime.toFixed(1)} сек`;
    }
}

/**
 * Выделяет победителя на экране
 * @param {Slug} winner - Улитка-победитель
 */
function highlightWinner(winner) {
    if (!winner) return;
    
    // Здесь можно добавить анимацию или выделение победителя
    console.log(`Выделяем победителя: ${winner.type}`);
    
    // Например, добавить эффект свечения для победителя
    if (winner.sprite) {
        // ... код для добавления визуального эффекта ...
    }
}

/**
 * Обрабатывает результаты гонки
 * @param {Object} raceData - Данные о результатах гонки
 */
function processRaceResults(raceData) {
    raceFinished = true;
    
    // Показываем экран результатов с небольшой задержкой
    setTimeout(() => {
        showResultsScreen(raceData.winner?.type === selectedSnail?.type);
    }, 1500);
    
    // Обрабатываем выигрыш/проигрыш
    if (raceData.winner?.type === selectedSnail?.type) {
        // Игрок выиграл
        processWin();
    } else {
        // Игрок проиграл
        processLoss();
    }
}

/**
 * Запускает гонку
 */
function startRace() {
    console.log('Запуск гонки...');
    
    try {
        // Инициализируем canvas и контекст, если они еще не инициализированы
        if (!canvas) {
            canvas = document.getElementById('race-canvas');
            if (!canvas) {
                console.error('Ошибка: canvas не найден');
                showError('Ошибка при запуске гонки', 'Элемент race-canvas не найден в DOM');
                return;
            }
        }
        
        if (!ctx && canvas) {
            ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Ошибка: не удалось получить контекст canvas');
                showError('Ошибка при запуске гонки', 'Не удалось получить 2D контекст для canvas');
                return;
            }
        }
        
        // Показываем экран гонки
        showRaceScreen();
        
        // Адаптируем размер canvas к окну
        resizeCanvas();
        
        // Проверяем доступность класса Maze
        if (typeof Maze !== 'function') {
            console.error('Ошибка: класс Maze не найден!');
            showError('Ошибка при подготовке гонки', 'Не удалось найти класс лабиринта (Maze). Возможно, модуль не загружен.');
            return;
        }
        
        // Проверяем доступность класса SlugManager
        if (typeof SlugManager !== 'function') {
            console.error('Ошибка: класс SlugManager не найден!');
            showError('Ошибка при подготовке гонки', 'Не удалось найти класс менеджера улиток (SlugManager). Возможно, модуль не загружен.');
            return;
        }
        
        // Проверяем доступность класса GameCycle
        if (typeof GameCycle !== 'function') {
            console.error('Ошибка: класс GameCycle не найден!');
            showError('Ошибка при подготовке гонки', 'Не удалось найти класс игрового цикла (GameCycle). Возможно, модуль не загружен.');
            return;
        }
        
        // Создаем SlugManager, если он не существует
        if (!slugManager) {
            console.log('Инициализация SlugManager...');
            try {
                slugManager = new SlugManager({
                    canvas: canvas
                });
            } catch (error) {
                console.error('Ошибка при создании SlugManager:', error);
                showError('Ошибка при подготовке гонки', {
                    message: 'Не удалось создать менеджер улиток',
                    error: error.message,
                    stack: error.stack
                });
                return;
            }
        }
        
        // Инициализируем игровой цикл, если он еще не инициализирован
        if (!gameCycle && !initGameCycle()) {
            console.error('Не удалось инициализировать игровой цикл');
            showError('Ошибка при подготовке гонки', 'Не удалось инициализировать игровой цикл. Проверьте консоль для получения дополнительной информации.');
            return;
        }
        
        console.log('Подготовка к гонке...');
        
        // Подготавливаем гонку к запуску
        try {
            if (gameCycle.prepare({
                mazeWidth: 20,
                mazeHeight: 15
            })) {
                console.log('Гонка успешно подготовлена, показываю экран загрузки...');
                showLoadingScreen();
                
                // Запускаем гонку после небольшой задержки
                setTimeout(() => {
                    hideLoadingScreen();
                    console.log('Запуск гонки...');
                    
                    try {
                        gameCycle.start();
                        raceStarted = true;
                        // Запускаем игровой цикл обновления
                        requestAnimationFrame(gameLoop);
                    } catch (error) {
                        console.error('Ошибка при запуске гонки:', error);
                        hideLoadingScreen();
                        showError('Ошибка при запуске гонки', {
                            message: error.message,
                            stack: error.stack
                        });
                    }
                }, 1500);
            } else {
                console.error('Ошибка при подготовке гонки: prepare() вернул false');
                showError('Ошибка при подготовке гонки', 'Не удалось корректно подготовить гонку. Возможно, проблема с созданием лабиринта или настройкой улиток.');
            }
        } catch (error) {
            console.error('Ошибка при подготовке гонки:', error);
            showError('Ошибка при подготовке гонки', {
                message: error.message,
                stack: error.stack
            });
        }
        
    } catch (error) {
        console.error('Критическая ошибка при запуске гонки:', error);
        showError('Критическая ошибка', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Основной игровой цикл
function gameLoop(timestamp) {
    if (!raceStarted || raceFinished) return;
    
    // Обновляем и отрисовываем
    update(timestamp);
    render();
    
    // Продолжаем цикл
    requestAnimationFrame(gameLoop);
}

// Обновление игровой логики
function update(timestamp) {
    if (slugManager) {
        slugManager.update(timestamp);
    }
}

// Отрисовка игрового состояния
function render() {
    if (ctx && canvas && maze && slugManager) {
        // Очищаем холст
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовываем лабиринт
        drawMaze();
        
        // Отрисовываем улиток
        slugManager.render(ctx);
    }
}

// Отрисовка лабиринта
function drawMaze() {
    if (!maze || !ctx || !canvas) return;
    
    const cellSize = Math.min(
        canvas.width / maze.width,
        canvas.height / maze.height
    );
    
    // Получаем цвета из стиля лабиринта
    const pathColor = maze.getPathColor();
    const wallColor = maze.getWallColor();
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Добавляем фоновый эффект в зависимости от стиля
    if (maze.style && maze.style.name) {
        const style = maze.style;
        
        // Специальные фоновые эффекты для определенных стилей
        if (style.name === "Neon Cyber Maze") {
            // Неоновый градиентный фон
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 40, 0.8)');
            gradient.addColorStop(1, 'rgba(40, 0, 40, 0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (style.name === "Underwater Reef") {
            // Фон с эффектом воды
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 50, 90, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 70, 120, 0.6)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    // Рисуем сетку и стены
    for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
            const cell = maze.grid[y][x];
            const cellX = x * cellSize;
            const cellY = y * cellSize;
            
            // Рисуем фон ячейки с использованием цвета пути из стиля
            ctx.fillStyle = pathColor;
            ctx.fillRect(cellX, cellY, cellSize, cellSize);
            
            // Добавляем эффекты для пути, если они определены
            if (maze.hasEffect('path', 'glow')) {
                ctx.shadowColor = pathColor;
                ctx.shadowBlur = 5;
                ctx.fillRect(cellX, cellY, cellSize, cellSize);
                ctx.shadowBlur = 0;
            } else if (maze.hasEffect('path', 'flicker')) {
                // Эффект мерцания - меняем прозрачность в зависимости от времени
                const flickerAmount = 0.7 + 0.3 * Math.sin(Date.now() / 500);
                ctx.globalAlpha = flickerAmount;
                ctx.fillRect(cellX, cellY, cellSize, cellSize);
                ctx.globalAlpha = 1.0;
            } else if (maze.hasEffect('path', 'sparkle')) {
                // Эффект блеска - добавляем случайные блики
                if (Math.random() < 0.05) {
                    ctx.fillStyle = '#FFFFFF';
                    const sparkleSize = cellSize / 5;
                    const sparkleX = cellX + Math.random() * (cellSize - sparkleSize);
                    const sparkleY = cellY + Math.random() * (cellSize - sparkleSize);
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, sparkleSize/2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.fillStyle = pathColor;
                }
            }
            
            // Рисуем стены с использованием цвета стен из стиля
            ctx.strokeStyle = wallColor;
            ctx.lineWidth = 2;
            
            // Добавляем эффекты для стен, если они определены
            if (maze.hasEffect('wall', 'glow')) {
                ctx.shadowColor = wallColor;
                ctx.shadowBlur = 5;
            } else if (maze.hasEffect('wall', 'transparency')) {
                ctx.globalAlpha = 0.7;
            } else if (maze.hasEffect('wall', 'texture') && imageCache[IMAGE_PATHS.wall]) {
                // Если есть текстура стены и стиль поддерживает текстуры
                ctx.createPattern(imageCache[IMAGE_PATHS.wall], 'repeat');
            }
            
            if (cell.walls.top) {
                ctx.beginPath();
                ctx.moveTo(cellX, cellY);
                ctx.lineTo(cellX + cellSize, cellY);
                ctx.stroke();
            }
            
            if (cell.walls.right) {
                ctx.beginPath();
                ctx.moveTo(cellX + cellSize, cellY);
                ctx.lineTo(cellX + cellSize, cellY + cellSize);
                ctx.stroke();
            }
            
            if (cell.walls.bottom) {
                ctx.beginPath();
                ctx.moveTo(cellX, cellY + cellSize);
                ctx.lineTo(cellX + cellSize, cellY + cellSize);
                ctx.stroke();
            }
            
            if (cell.walls.left) {
                ctx.beginPath();
                ctx.moveTo(cellX, cellY);
                ctx.lineTo(cellX, cellY + cellSize);
                ctx.stroke();
            }
            
            // Восстанавливаем значения по умолчанию
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Рисуем старт и финиш
    const startImg = imageCache[IMAGE_PATHS.start];
    const finishImg = imageCache[IMAGE_PATHS.finish];
    
    if (startImg) {
        ctx.drawImage(
            startImg,
            maze.startPoint.x * cellSize,
            maze.startPoint.y * cellSize,
            cellSize,
            cellSize
        );
    } else {
        // Резервный вариант для старта, если изображение не загружено
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(
            maze.startPoint.x * cellSize + cellSize * 0.1,
            maze.startPoint.y * cellSize + cellSize * 0.1,
            cellSize * 0.8,
            cellSize * 0.8
        );
    }
    
    if (finishImg) {
        ctx.drawImage(
            finishImg,
            maze.finishPoint.x * cellSize,
            maze.finishPoint.y * cellSize,
            cellSize,
            cellSize
        );
    } else {
        // Резервный вариант для финиша, если изображение не загружено
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(
            maze.finishPoint.x * cellSize + cellSize * 0.1,
            maze.finishPoint.y * cellSize + cellSize * 0.1,
            cellSize * 0.8,
            cellSize * 0.8
        );
    }
}

// Сброс игры для повторной игры
function resetGame() {
    console.log('Resetting game...');
    
    // Сбрасываем состояние
    raceStarted = false;
    raceFinished = false;
    maze = null;
    
    if (slugManager) {
        slugManager.destroy();
        slugManager = null;
    }
    
    // Показываем начальный экран
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    
    // Обновляем баланс
    if (wallet) {
        document.getElementById('balance-amount').textContent = wallet.balance.toFixed(2);
    }
    
    console.log('Game reset, ready to start again');
}

// Патчим window.Slug для исправления ошибок с tweens
if (typeof window.Slug === 'function') {
    console.log("Применяю патч для класса Slug...");
    
    // Оригинальный метод обновления ротации
    const originalUpdateRotation = window.Slug.prototype.updateRotation;
    
    // Безопасная версия метода обновления ротации
    window.Slug.prototype.updateRotation = function(dx, dy) {
        try {
            if (originalUpdateRotation) {
                return originalUpdateRotation.call(this, dx, dy);
            }
            
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
        } catch (error) {
            console.error("Ошибка в методе updateRotation:", error);
        }
    };
    
    // Патч для безопасного доступа к tweens
    const safeTweens = function(callback) {
        try {
            if (!this.scene) {
                console.warn("scene недоступна для анимации");
                return;
            }
            
            if (!this.scene.tweens) {
                console.warn("tweens недоступны в текущей сцене");
                return;
            }
            
            return callback(this.scene.tweens);
        } catch (error) {
            console.error("Ошибка при доступе к tweens:", error);
        }
    };
    
    // Добавляем метод для безопасной работы с tweens
    window.Slug.prototype.safeTweens = safeTweens;
}

// Добавляем функцию проверки и загрузки ресурсов перед стартом приложения
function checkAndLoadResources() {
    console.log('Checking and loading resources...');
    
    // Проверяем наличие необходимых изображений
    const requiredImages = [
        'images/snail_red.png',
        'images/snail_green.png',
        'images/snail_blue.png',
        'images/snail_lilac.png',
        'images/snail_yellow.png',
        'images/wall_texture.png',
        'images/start.png',
        'images/finish.png'
    ];
    
    // Создаем HTML для отображения статуса загрузки
    const loadingStatus = document.createElement('div');
    loadingStatus.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.8); color:white; padding:20px; border-radius:10px; z-index:9999; max-width:80%; text-align:center;';
    loadingStatus.innerHTML = '<h3>Загрузка ресурсов...</h3><div id="progress">0%</div>';
    document.body.appendChild(loadingStatus);
    
    const progressElement = loadingStatus.querySelector('#progress');
    
    // Возвращаем Promise для последовательного выполнения
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = requiredImages.length;
        
        // Функция для обработки загрузки изображения
        const onImageLoad = (path) => {
            loadedCount++;
            const progress = Math.round((loadedCount / totalImages) * 100);
            progressElement.textContent = `${progress}%`;
            
            console.log(`Загружено изображение ${loadedCount}/${totalImages}: ${path}`);
            
            // Когда все изображения обработаны, разрешаем промис
            if (loadedCount === totalImages) {
                console.log('Все ресурсы проверены');
                
                // Скрываем индикатор загрузки после небольшой задержки
                setTimeout(() => {
                    loadingStatus.style.display = 'none';
                    resolve({ success: true });
                }, 500);
            }
        };
        
        // Проверяем каждое изображение
        requiredImages.forEach(path => {
            const img = new Image();
            
            img.onload = () => {
                // Изображение успешно загружено
                onImageLoad(path);
            };
            
            img.onerror = () => {
                console.warn(`Не удалось загрузить изображение: ${path}`);
                // Продолжаем даже при ошибках
                onImageLoad(path);
            };
            
            // Начинаем загрузку
            img.src = path;
        });
        
        // Если список пуст, сразу разрешаем промис
        if (totalImages === 0) {
            loadingStatus.style.display = 'none';
            resolve({ success: true });
        }
    });
}

/**
 * Показывает экран гонки
 */
function showRaceScreen() {
    console.log('Показываю экран гонки...');
    
    // Скрываем начальный экран
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('hidden');
        startScreen.style.display = 'none';
    }
    
    // Показываем экран гонки
    const raceContainer = document.getElementById('race-container');
    if (raceContainer) {
        raceContainer.classList.remove('hidden');
        raceContainer.style.display = 'block';
    } else {
        console.error('Ошибка: race-container не найден в DOM');
        showError('Ошибка отображения', 'Элемент race-container не найден в DOM');
        return;
    }
    
    // Обновляем информацию о выбранной улитке
    const selectedSnailInfo = document.getElementById('selected-snail-info');
    if (selectedSnailInfo && selectedSnail) {
        const snailType = SNAIL_TYPES[selectedSnail];
        if (snailType) {
            selectedSnailInfo.textContent = `Ваша улитка: ${snailType.name}`;
            selectedSnailInfo.style.color = snailType.color;
        } else {
            selectedSnailInfo.textContent = `Ваша улитка: ${selectedSnail}`;
        }
    }
    
    // Адаптируем размер canvas
    resizeCanvas();
    
    console.log('Экран гонки отображен');
}

/**
 * Показывает сообщение об ошибке
 * @param {string} message - Сообщение об ошибке
 * @param {Error} [error] - Объект ошибки (необязательно)
 */
function showError(message, error) {
    console.error(message, error);
    
    // Создаем элемент для отображения ошибки
    let errorEl = document.getElementById('error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'error-message';
        errorEl.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background-color: #f44336; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000; max-width: 80%; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
        document.body.appendChild(errorEl);
    }
    
    // Устанавливаем текст ошибки
    errorEl.textContent = message;
    
    // Показываем на 5 секунд
    errorEl.classList.remove('hidden');
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000);
} 