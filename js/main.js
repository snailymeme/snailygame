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

// Создание HTML-элементов для отображения гонки
function setupRaceElements() {
    // Создаем контейнер для гонки, если его не существует
    let raceContainer = document.getElementById('race-container');
    if (!raceContainer) {
        raceContainer = document.createElement('div');
        raceContainer.id = 'race-container';
        raceContainer.classList.add('hidden');
        document.body.appendChild(raceContainer);
    }
    
    // Создаем canvas для отрисовки гонки, если его не существует
    let raceCanvas = document.getElementById('race-canvas');
    if (!raceCanvas) {
        raceCanvas = document.createElement('canvas');
        raceCanvas.id = 'race-canvas';
        raceContainer.appendChild(raceCanvas);
    }
    
    // Создаем экран загрузки, если его не существует
    let loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) {
        loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.classList.add('overlay', 'hidden');
        
        const loadingContent = document.createElement('div');
        loadingContent.className = 'overlay-content';
        
        const loadingText = document.createElement('p');
        loadingText.textContent = 'Загрузка гонки...';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        
        loadingContent.appendChild(loadingText);
        loadingContent.appendChild(spinner);
        loadingScreen.appendChild(loadingContent);
        
        document.body.appendChild(loadingScreen);
    }
    
    return {
        raceContainer,
        raceCanvas,
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

// Массив улиток-соперников
const OPPONENTS = [
    { type: 'racer', image: 'images/snail_red.png', name: 'Racer' },
    { type: 'explorer', image: 'images/snail_green.png', name: 'Explorer' },
    { type: 'snake', image: 'images/snail_blue.png', name: 'Snake' },
    { type: 'stubborn', image: 'images/snail_lilac.png', name: 'Stubborn' }
];

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
        let errorCount = 0;
        const totalImages = imagesToLoad.length;
        
        // Функция для отслеживания прогресса загрузки
        const onImageLoad = (path) => {
            loadedCount++;
            console.log(`Загружено изображение (${loadedCount}/${totalImages}): ${path}`);
            
            // Когда все изображения обработаны (загружены или с ошибками), разрешаем промис
            if (loadedCount + errorCount === totalImages) {
                if (errorCount > 0) {
                    console.warn(`Загружено ${loadedCount} изображений, ${errorCount} с ошибками`);
                }
                // Все равно разрешаем промис, даже если были ошибки
                resolve(imageCache);
            }
        };
        
        const onImageError = (path, error) => {
            errorCount++;
            console.warn(`Ошибка загрузки изображения ${path}:`, error);
            
            // Пробуем создать заглушку для отсутствующего изображения
            const img = new Image(40, 40);
            img.width = 40;
            img.height = 40;
            imageCache[path] = img;
            
            // Когда все изображения обработаны, разрешаем промис
            if (loadedCount + errorCount === totalImages) {
                if (errorCount > 0) {
                    console.warn(`Загружено ${loadedCount} изображений, ${errorCount} с ошибками`);
                }
                // Все равно разрешаем промис, даже если были ошибки
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
                onImageError(path, error);
            };
            
            // Добавляем случайное значение для предотвращения кэширования
            img.src = path + '?t=' + Date.now();
        });
        
        // Если нет изображений для загрузки, сразу разрешаем промис
        if (totalImages === 0) {
            resolve(imageCache);
        }
    });
}

// Добавляем улучшенную функцию для добавления улиток на экран выбора
function createSnailOptions() {
    const snailGrid = document.querySelector('.snail-grid');
    
    if (!snailGrid) {
        console.error('Element .snail-grid not found!');
        logError('Не найден элемент .snail-grid для отображения улиток');
        return;
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
            }, 500);
        }
    }, 100);
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

// Адаптация размера canvas
function resizeCanvas() {
    if (!canvas) return;
    
    // Устанавливаем размер canvas в соответствии с его контейнером
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = Math.min(window.innerHeight * 0.7, container.clientWidth);
    
    // Если гонка уже началась, перерисовываем лабиринт
    if (raceStarted && maze && slugManager) {
        drawMaze();
    }
}

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

// Запуск гонки улиток в созданном лабиринте
function startRace() {
    try {
        console.log("Начинаю подготовку гонки...");
        
        // Получаем случайный стиль для лабиринта
        const mazeStyle = getRandomMazeStyle();
        console.log("Выбран стиль лабиринта:", mazeStyle.name);
        
        // Создаем лабиринт, если он не создан
        if (!maze) {
            console.log("Создаю лабиринт...");
            // Инициализируем новый лабиринт с выбранным стилем
            maze = new Maze(15, 15, mazeStyle); // размер лабиринта 15x15
            maze.generate();
            console.log("Лабиринт успешно создан");
        } else {
            // Обновляем стиль существующего лабиринта
            maze.setStyle(mazeStyle);
        }
        
        // Проверяем наличие обязательных компонентов
        if (!maze) {
            throw new Error("Лабиринт не создан. Невозможно начать гонку.");
        }
        
        if (!canvas) {
            throw new Error("Canvas не инициализирован. Невозможно отобразить гонку.");
        }
        
        // Проверка доступности необходимых изображений - асинхронно
        checkImagesExistence().then(checkImagesResult => {
            console.log("Результат проверки изображений:", checkImagesResult);
            
            // Продолжаем даже если есть проблемы с изображениями
            continueStartRace();
        }).catch(error => {
            console.warn("Проблема при проверке изображений:", error);
            // Продолжаем несмотря на ошибки
            continueStartRace();
        });
        
        // Функция для продолжения запуска гонки после проверки изображений
        function continueStartRace() {
            try {
                // Создаем менеджер улиток
                console.log("Создаю менеджер улиток...");
                slugManager = new SlugManager({
                    maze: maze,
                    canvas: canvas
                });
                
                if (!slugManager) {
                    throw new Error("Не удалось создать менеджера улиток");
                }
                
                console.log("Менеджер улиток создан. Загружаю изображения...");
                
                // Добавляем улитку игрока и оппонентов
                if (selectedSnail) {
                    console.log(`Добавляю улитку игрока типа: ${selectedSnail}`);
                    
                    // Используем getSnailImage для получения изображения
                    const playerImage = getSnailImage(selectedSnail);
                    
                    slugManager.addPlayerSlug({
                        type: selectedSnail,
                        color: SNAIL_TYPES[selectedSnail]?.color || '#ffb300',
                        image: playerImage
                    });
                } else {
                    console.warn("Игрок не выбрал улитку, используем стандартную");
                    const defaultType = 'deadender';
                    selectedSnail = defaultType;
                    slugManager.addPlayerSlug({
                        type: defaultType,
                        color: SNAIL_TYPES[defaultType]?.color || '#ffb300',
                        image: getSnailImage(defaultType)
                    });
                }
                
                // Добавляем улиток оппонентов (случайный порядок)
                const shuffledOpponents = [...OPPONENTS].sort(() => Math.random() - 0.5);
                for (let i = 0; i < 3; i++) {
                    if (i < shuffledOpponents.length) {
                        const opponent = shuffledOpponents[i];
                        console.log(`Добавляю улитку оппонента ${i + 1} типа: ${opponent.type}`);
                        
                        // Получаем изображение через getSnailImage
                        const opponentImage = getSnailImage(opponent.type);
                        
                        if (opponent.type) {
                            slugManager.addOpponentSlug({
                                type: opponent.type,
                                color: getColorForType(opponent.type),
                                image: opponentImage
                            });
                        }
                    }
                }
                
                // Регистрируем обработчик для завершения гонки
                slugManager.on('raceFinished', (results) => {
                    onRaceFinished(results);
                });
                
                // Запускаем гонку
                console.log("Все улитки добавлены. Запускаю гонку!");
                slugManager.startRace();
                raceStarted = true;
            } catch (error) {
                console.error("Ошибка при продолжении гонки:", error);
                showError("Не удалось запустить гонку", {
                    message: error.message,
                    stack: error.stack,
                    stage: "continueStartRace"
                });
            }
        }
                
        return true;
    } catch (error) {
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            stage: "startRace"
        };
        console.error("Ошибка при запуске гонки:", errorDetails);
        showError("Не удалось запустить гонку", errorDetails);
        return false;
    }
}

// Функция для проверки существования изображений
function checkImagesExistence() {
    return new Promise((resolve, reject) => {
        try {
            const requiredImages = [
                ...Object.values(IMAGE_PATHS),
                ...OPPONENTS.map(o => o.image),
                selectedSnail ? selectedSnail.image : null
            ].filter(Boolean);
            
            console.log("Проверка наличия изображений:", requiredImages);
            
            const missingImages = [];
            for (const imagePath of requiredImages) {
                if (!imageCache[imagePath]) {
                    console.warn(`Отсутствует изображение: ${imagePath}`);
                    
                    // Создаем пустое изображение вместо отсутствующего
                    const placeholderImg = new Image(40, 40);
                    placeholderImg.width = 40;
                    placeholderImg.height = 40;
                    imageCache[imagePath] = placeholderImg;
                    
                    missingImages.push(imagePath);
                } else {
                    console.log(`Изображение найдено: ${imagePath}`);
                }
            }
            
            if (missingImages.length > 0) {
                console.warn("Некоторые изображения отсутствуют, но игра будет продолжена", missingImages);
            }
            
            // Всегда разрешаем промис, даже если некоторые изображения отсутствуют
            resolve({
                status: missingImages.length === 0 ? "success" : "partial", 
                message: missingImages.length === 0 ? "Все изображения загружены" : "Загружены не все изображения",
                missingImages
            });
        } catch (error) {
            console.error("Ошибка при проверке изображений:", error);
            // Все равно продолжаем, не блокируем игру
            resolve({
                status: "error",
                message: "Ошибка при проверке изображений",
                error
            });
        }
    });
}

// Функция для получения изображения улитки по типу
function getSnailImage(type) {
    try {
        // Проверка на тип улитки и соответствие изображению
        switch (type) {
            case 'deadender':
                return imageCache['images/snail_yellow.png'] || null;
            case 'racer':
                return imageCache['images/snail_red.png'] || null;
            case 'explorer':
                return imageCache['images/snail_green.png'] || null;
            case 'snake':
                return imageCache['images/snail_blue.png'] || null;
            case 'stubborn':
                return imageCache['images/snail_lilac.png'] || null;
            default:
                console.warn(`No image mapping for slug type: ${type}`);
                return null;
        }
    } catch (error) {
        console.error(`Error getting snail image for type ${type}:`, error);
        return null;
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

// Обработка окончания гонки
function handleRaceFinished(winner) {
    raceFinished = true;
    
    console.log('Race completed, winner:', winner ? winner.type : 'no winner');
    
    // Показываем экран результатов
    setTimeout(() => {
        document.getElementById('race-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');
        
        // Обновляем результаты
        const resultMessage = document.getElementById('result-message');
        const winningsAmount = document.getElementById('winnings-amount');
        
        if (winner && winner.isPlayer) {
            // Игрок победил
            resultMessage.textContent = `Your snail ${SNAIL_TYPES[selectedSnail].name} won!`;
            
            // Рассчитываем выигрыш
            const winnings = betAmount * WIN_MULTIPLIERS[selectedSnail];
            winningsAmount.textContent = `Winnings: ${winnings.toFixed(2)} SOL`;
            
            // Имитируем зачисление выигрыша
            if (wallet) {
                wallet.balance += winnings - betAmount;
            }
        } else if (winner) {
            // Улитка-соперник победила
            resultMessage.textContent = `The ${SNAIL_TYPES[winner.type].name} snail won. You lost.`;
            winningsAmount.textContent = `Bet lost: ${betAmount.toFixed(2)} SOL`;
        } else {
            // Никто не победил
            resultMessage.textContent = `Draw! Race ended without a winner.`;
            winningsAmount.textContent = `Bet returned: ${betAmount.toFixed(2)} SOL`;
        }
    }, 1000);
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
    
    if (typeof logInfo === 'function') {
        logInfo('Проверка ресурсов приложения');
    }
    
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
    loadingStatus.innerHTML = '<h3>Загрузка ресурсов...</h3><div id="resourceList"></div><div id="progress">0%</div>';
    document.body.appendChild(loadingStatus);
    
    const resourceList = loadingStatus.querySelector('#resourceList');
    const progressElement = loadingStatus.querySelector('#progress');
    
    // Функция для обновления статуса загрузки
    const updateStatus = (image, status) => {
        const statusElement = document.getElementById(`status-${btoa(image)}`);
        if (statusElement) {
            statusElement.innerHTML = status === 'success' ? 
                '<span style="color:#4CAF50;">✓</span>' : 
                '<span style="color:#f44336;">✗</span>';
        } else {
            const newElement = document.createElement('div');
            newElement.style.cssText = 'text-align:left; font-size:12px; margin:5px 0;';
            newElement.innerHTML = `${image.split('/').pop()}: <span id="status-${btoa(image)}">${
                status === 'success' ? 
                '<span style="color:#4CAF50;">✓</span>' : 
                '<span style="color:#f44336;">✗</span>'
            }</span>`;
            resourceList.appendChild(newElement);
        }
    };
    
    // Загружаем изображения
    let loadedCount = 0;
    const totalImages = requiredImages.length;
    
    // Возвращаем Promise для последовательного выполнения
    return new Promise((resolve, reject) => {
        // Предварительная проверка доступности каталога с изображениями
        const testImg = new Image();
        testImg.onload = () => {
            // Каталог доступен, продолжаем загрузку всех изображений
            requiredImages.forEach((imagePath, index) => {
                const img = new Image();
                
                img.onload = () => {
                    loadedCount++;
                    updateStatus(imagePath, 'success');
                    imageCache[imagePath] = img;
                    
                    const progress = Math.round((loadedCount / totalImages) * 100);
                    progressElement.textContent = `${progress}%`;
                    
                    if (loadedCount === totalImages) {
                        // Все изображения загружены
                        setTimeout(() => {
                            loadingStatus.remove();
                            resolve();
                        }, 500);
                    }
                };
                
                img.onerror = () => {
                    updateStatus(imagePath, 'error');
                    console.error(`Ошибка загрузки изображения: ${imagePath}`);
                    
                    if (typeof logError === 'function') {
                        logError(`Не удалось загрузить изображение: ${imagePath}`);
                    }
                    
                    // Увеличиваем счетчик, даже если изображение не загрузилось
                    loadedCount++;
                    
                    const progress = Math.round((loadedCount / totalImages) * 100);
                    progressElement.textContent = `${progress}%`;
                    
                    if (loadedCount === totalImages) {
                        // Завершаем даже при наличии ошибок
                        setTimeout(() => {
                            loadingStatus.remove();
                            reject(new Error('Failed to load images. Check if images folder exists'));
                        }, 500);
                    }
                };
                
                // Добавляем случайный параметр для предотвращения кеширования
                img.src = `${imagePath}?t=${Date.now()}`;
            });
        };
        
        testImg.onerror = () => {
            // Каталог недоступен или проблемы с доступом
            loadingStatus.innerHTML = '<h3 style="color:#f44336;">Ошибка загрузки ресурсов</h3><p>Не удалось получить доступ к каталогу изображений</p><button id="retry-button" style="background:#4CAF50;">Повторить</button>';
            
            document.getElementById('retry-button').onclick = () => {
                loadingStatus.remove();
                checkAndLoadResources().then(resolve).catch(reject);
            };
            
            if (typeof logError === 'function') {
                logError('Недоступен каталог с изображениями images/');
            }
        };
        
        // Проверяем доступность каталога
        testImg.src = `images/snail_red.png?t=${Date.now()}`;
    });
} 