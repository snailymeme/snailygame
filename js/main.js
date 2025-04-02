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

// Показать загрузочный экран
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    } else {
        // Создаем загрузочный экран, если его нет в HTML
        const loadingContainer = document.createElement('div');
        loadingContainer.id = 'loading-screen';
        loadingContainer.className = 'screen';
        loadingContainer.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--background-color, #f0f2f5); z-index: 9998; flex-direction: column; align-items: center; justify-content: center;';
        
        const loadingTitle = document.createElement('h2');
        loadingTitle.textContent = 'Loading game...';
        
        const loadingAnimation = document.createElement('div');
        loadingAnimation.className = 'loading-animation';
        loadingAnimation.style.cssText = 'width: 50px; height: 50px; border: 5px solid #ccc; border-top-color: var(--primary-color, #8367c7); border-radius: 50%; animation: spin 1s infinite linear;';
        
        const loadingStyleTag = document.createElement('style');
        loadingStyleTag.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        
        document.head.appendChild(loadingStyleTag);
        loadingContainer.appendChild(loadingTitle);
        loadingContainer.appendChild(loadingAnimation);
        document.body.appendChild(loadingContainer);
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
    { type: 'racer', image: 'assets/images/red_snail.png', name: 'Racer' },
    { type: 'explorer', image: 'assets/images/green_snail.png', name: 'Explorer' },
    { type: 'snake', image: 'assets/images/blue_snail.png', name: 'Snake' },
    { type: 'stubborn', image: 'assets/images/lilac_snail.png', name: 'Stubborn' }
];

// Настройки изображений
const IMAGE_PATHS = {
    wall: 'assets/images/wall_texture.png',
    start: 'assets/images/start.png',
    finish: 'assets/images/finish.png'
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

// Когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Создаем глобальный обработчик ошибок
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error caught:', message, error);
        showError('Unhandled error occurred', { 
            message, 
            source, 
            line: lineno, 
            column: colno, 
            stack: error?.stack 
        });
        return true; // Предотвращаем стандартную обработку ошибки
    };
    
    // Создаем обработчик необработанных промисов
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showError('Unhandled promise rejection', { 
            reason: event.reason?.message || event.reason,
            stack: event.reason?.stack
        });
    });
    
    try {
        // Показываем экран загрузки сразу
        showLoadingScreen();
        
        // Инициализация приложения - оборачиваем в таймаут для гарантии отображения загрузки
        setTimeout(() => {
            try {
                // Инициализация приложения
                initApp();
                
                // Инициализируем загрузчик патчей
                try {
                    initPatchLoader();
                } catch (patchError) {
                    console.warn('Patch loader error:', patchError);
                    // Продолжаем работу даже если с патчами проблемы
                }
                
                // Инициализация Telegram лаунчера
                try {
                    if (typeof window.initTelegramLauncher === 'function') {
                        window.initTelegramLauncher();
                    } else {
                        console.warn('Telegram launcher not available as global function');
                    }
                } catch (telegramError) {
                    console.warn('Telegram launcher error:', telegramError);
                    // Продолжаем работу даже если с Telegram проблемы
                }
                
                // Скрываем загрузочный экран через 1 секунду
                setTimeout(() => {
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) {
                        loadingScreen.classList.add('hidden');
                    }
                    
                    // Показываем стартовый экран
                    const startScreen = document.getElementById('start-screen');
                    if (startScreen) {
                        startScreen.classList.remove('hidden');
                        startScreen.style.display = 'flex';
                    } else {
                        console.error('Start screen element not found!');
                        showError('UI Error', 'Start screen element not found');
                    }
                }, 1000);
            } catch (innerError) {
                console.error('Error in initialization phase:', innerError);
                showError('Initialization error', innerError);
            }
        }, 100);
    } catch (error) {
        console.error('Critical initialization error:', error);
        showError('Critical initialization error', error);
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
        return true;
    } catch (error) {
        console.error('Error in application initialization:', error);
        showError('Application initialization error', error);
        return false;
    }
}

// Создает элементы выбора улиток на странице
function createSnailOptions() {
    const snailGrid = document.querySelector('.snail-grid');
    
    if (!snailGrid) {
        console.error('Element .snail-grid not found!');
        return;
    }
    
    snailGrid.innerHTML = '';
    
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
        
        // Проверяем, есть ли папка assets/images
        const img = new Image();
        img.onload = () => {
            console.log('Test image loaded successfully, resources available');
            resolve(true);
        };
        img.onerror = () => {
            console.error('Error loading test image');
            reject(new Error('Failed to load images. Check if assets/images folder exists'));
        };
        // Пробуем загрузить любое изображение из папки assets
        img.src = 'assets/images/red_snail.png?' + Date.now();
    });
}

// Функция запуска гонки
function startRace() {
    try {
        console.log('Starting race...');
        
        // Автоматический выбор улитки, если она не выбрана
        if (!selectedSnail) {
            console.log('No snail selected, auto-selecting a default snail');
            const randomType = 'deadender'; // Используем стандартную улитку как запасной вариант
            selectedSnail = randomType;
            console.log(`Auto-selected snail: ${randomType}`);
            
            // Визуально выделяем выбранную улитку на UI
            const snailOptions = document.querySelectorAll('.snail-option');
            snailOptions.forEach(option => {
                if (option.dataset.snail === randomType) {
                    option.classList.add('selected');
                }
            });
        }
        
        // Расширенная проверка наличия изображений
        checkImagesExistence().then(imagesResult => {
            if (!imagesResult.success) {
                throw new Error(`Missing required images: ${imagesResult.missingImages.join(', ')}`);
            }
            
            // Проверяем, что все необходимые параметры существуют
            if (!selectedSnail) {
                throw new Error('No snail selected for race');
            }
            
            // Скрываем стартовый экран
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.classList.add('hidden');
            } else {
                console.warn('Start screen element not found');
            }
            
            // Показываем экран загрузки
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.remove('hidden');
            } else {
                console.warn('Loading screen element not found');
            }
            
            raceStarted = true;
            
            // Создаем холст для гонки
            const raceScreen = document.getElementById('race-screen');
            if (!raceScreen) {
                throw new Error('Race screen element not found');
            }
            
            raceScreen.classList.remove('hidden');
            
            canvas = document.getElementById('race-canvas');
            if (!canvas) {
                throw new Error('Race canvas element not found');
            }
            
            // Настраиваем размер холста
            canvas.width = raceScreen.clientWidth * 0.9;
            canvas.height = window.innerHeight * 0.6;
            
            ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            
            // Создаем лабиринт
            console.log('Creating maze...');
            maze = new Maze(15, 15); // размер лабиринта
            maze.generate();
            console.log('Maze created successfully');
            
            // Создаем менеджер улиток
            console.log('Creating slug manager...');
            try {
                slugManager = new SlugManager({
                    maze: maze,
                    canvas: canvas
                });
                console.log('Slug manager created successfully');
            } catch (slugManagerError) {
                console.error('Error creating slug manager:', slugManagerError);
                throw new Error('Failed to create slug manager: ' + slugManagerError.message);
            }
            
            // Загружаем изображения с обработкой ошибок
            console.log('Loading images...');
            loadImages()
                .then(() => {
                    try {
                        console.log('Images loaded, adding slugs...');
                        
                        // Добавляем выбранную улитку игрока
                        console.log(`Adding player slug of type: ${selectedSnail}`);
                        const playerSlug = slugManager.addSlug({
                            type: selectedSnail,
                            startPosition: maze.startPoint,
                            finishPosition: maze.finishPoint,
                            color: SNAIL_TYPES[selectedSnail]?.color || '#ffb300',
                            isPlayer: true,
                            image: getSnailImage(selectedSnail)
                        });
                        
                        if (!playerSlug) {
                            console.error('Failed to add player slug');
                        } else {
                            console.log('Player slug added successfully');
                        }
                        
                        // Добавляем улиток соперников
                        console.log('Adding opponent slugs...');
                        const shuffledOpponents = [...OPPONENTS].sort(() => 0.5 - Math.random());
                        
                        for (let i = 0; i < Math.min(3, shuffledOpponents.length); i++) {
                            const opponent = shuffledOpponents[i];
                            if (!opponent || !opponent.type) {
                                console.warn(`Invalid opponent at index ${i}`);
                                continue;
                            }
                            
                            const opponentType = opponent.type;
                            console.log(`Adding opponent slug of type: ${opponentType}`);
                            const opponentSlug = slugManager.addSlug({
                                type: opponentType,
                                startPosition: maze.startPoint,
                                finishPosition: maze.finishPoint,
                                color: (SNAIL_TYPES[opponentType]?.color) || '#cccccc',
                                isPlayer: false,
                                image: getSnailImage(opponentType)
                            });
                            
                            if (!opponentSlug) {
                                console.warn(`Failed to add opponent slug of type ${opponentType}`);
                            }
                        }
                        
                        // Настраиваем обработчик окончания гонки
                        console.log('Setting up race finished handler...');
                        slugManager.onRaceFinished = handleRaceFinished;
                        
                        // Скрываем экран загрузки
                        if (loadingScreen) {
                            loadingScreen.classList.add('hidden');
                        }
                        
                        // Запускаем гонку
                        console.log('Starting race with slugs');
                        slugManager.startRace();
                        
                        // Запускаем основной игровой цикл
                        requestAnimationFrame(gameLoop);
                    } catch (innerError) {
                        console.error('Error setting up race after images loaded:', innerError);
                        showError('Failed to setup race', {
                            message: innerError.message,
                            stack: innerError.stack,
                            stage: 'after_images_loaded'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading images:', error);
                    showError('Failed to load images', {
                        message: error.message,
                        stack: error.stack
                    });
                });
        }).catch(error => {
            console.error('Error checking images:', error);
            showError('Failed to check required images', {
                message: error.message,
                stack: error.stack
            });
        });
    } catch (error) {
        console.error('Error starting race:', error);
        showError('Failed to start race', {
            message: error.message,
            stack: error.stack,
            stage: 'initial_setup'
        });
        
        // Показываем стартовый экран снова
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.remove('hidden');
        }
        
        // Скрываем экран загрузки
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        raceStarted = false;
    }
}

// Функция для проверки наличия всех необходимых изображений
function checkImagesExistence() {
    return new Promise((resolve) => {
        const requiredImages = [
            'assets/images/red_snail.png',
            'assets/images/green_snail.png',
            'assets/images/blue_snail.png',
            'assets/images/lilac_snail.png',
            'assets/images/yellow_snail.png',
            'assets/images/wall_texture.png',
            'assets/images/start.png',
            'assets/images/finish.png'
        ];
        
        const missingImages = [];
        let checkedCount = 0;
        let allImagesStartedLoading = false;
        
        console.log('Checking for required images...');
        
        // Создаем таймаут для контроля времени проверки
        const timeoutId = setTimeout(() => {
            console.warn('Image check timeout - resolving anyway');
            if (!allImagesStartedLoading) {
                resolve({
                    success: true, // Предполагаем, что изображения доступны
                    missingImages: []
                });
            }
        }, 3000);
        
        // Кешируем изображения для быстрого доступа в будущем
        for (const imagePath of requiredImages) {
            const img = new Image();
            
            img.onload = () => {
                console.log(`✅ Изображение загружено: ${imagePath}`);
                // Кешируем успешно загруженное изображение
                const imgKey = imagePath.split('/').pop().split('.')[0];
                if (imgKey.includes('snail')) {
                    const snailType = imgKey.replace('_snail', '');
                    imageCache[`snail_${snailType}`] = img;
                } else {
                    imageCache[imgKey] = img;
                }
                
                checkedCount++;
                if (checkedCount === requiredImages.length) {
                    clearTimeout(timeoutId);
                    allImagesStartedLoading = true;
                    resolve({
                        success: missingImages.length === 0,
                        missingImages: missingImages
                    });
                }
            };
            
            img.onerror = () => {
                console.error(`❌ Отсутствует изображение: ${imagePath}`);
                missingImages.push(imagePath);
                checkedCount++;
                
                if (checkedCount === requiredImages.length) {
                    clearTimeout(timeoutId);
                    allImagesStartedLoading = true;
                    resolve({
                        success: missingImages.length === 0,
                        missingImages: missingImages
                    });
                }
            };
            
            // Запрещаем кеширование запроса для точной проверки
            img.src = imagePath + '?nocache=' + new Date().getTime();
            console.log(`🔍 Проверка изображения: ${imagePath}`);
        }
    });
}

// Загрузка изображений
function loadImages() {
    return new Promise((resolve) => {
        try {
            // Защита от ошибок, если объекты не определены
            if (!IMAGE_PATHS || typeof IMAGE_PATHS !== 'object') {
                console.error('IMAGE_PATHS is not defined or not an object');
                IMAGE_PATHS = {};
            }
            
            if (!SNAIL_TYPES || typeof SNAIL_TYPES !== 'object') {
                console.error('SNAIL_TYPES is not defined or not an object');
                SNAIL_TYPES = {};
            }
            
            const imgPathKeys = Object.keys(IMAGE_PATHS || {});
            const snailTypeKeys = Object.keys(SNAIL_TYPES || {});
            
            let loadedCount = 0;
            const totalImages = imgPathKeys.length + snailTypeKeys.length;
            
            // Если нет изображений для загрузки, сразу резолвим промис
            if (totalImages === 0) {
                console.warn('No images to load');
                return resolve();
            }
            
            console.log('Starting image loading. Total images:', totalImages);
            
            // Функция для обработки завершения загрузки
            const checkCompletion = () => {
                loadedCount++;
                if (loadedCount >= totalImages) {
                    console.log('All images loaded successfully');
                    resolve();
                }
            };
            
            // Загружаем общие изображения
            for (const key of imgPathKeys) {
                if (!IMAGE_PATHS[key]) {
                    console.warn(`Path for image ${key} is missing`);
                    checkCompletion();
                    continue;
                }
                
                const img = new Image();
                img.onload = () => {
                    console.log(`Image ${key} loaded successfully: ${IMAGE_PATHS[key]}`);
                    imageCache[key] = img;
                    checkCompletion();
                };
                img.onerror = () => {
                    console.error(`Error loading image: ${IMAGE_PATHS[key]}`);
                    checkCompletion();
                };
                img.src = IMAGE_PATHS[key];
                console.log(`Request to load image: ${IMAGE_PATHS[key]}`);
            }
            
            // Загружаем изображения улиток
            for (const type of snailTypeKeys) {
                const img = new Image();
                // Сопоставление между типами улиток и именами файлов
                const snailImageMapping = {
                    'racer': 'red_snail.png',
                    'explorer': 'green_snail.png',
                    'snake': 'blue_snail.png',
                    'stubborn': 'lilac_snail.png',
                    'deadender': 'yellow_snail.png'
                };
                
                const filename = snailImageMapping[type] || `${type === 'deadender' ? 'yellow' : type}_snail.png`;
                const snailSrc = `assets/images/${filename}`;
                
                img.onload = () => {
                    console.log(`Snail image ${type} loaded successfully: ${snailSrc}`);
                    imageCache[`snail_${type}`] = img;
                    checkCompletion();
                };
                img.onerror = () => {
                    console.error(`Error loading snail image: ${type} from ${snailSrc}`);
                    checkCompletion();
                };
                img.src = snailSrc;
                console.log(`Request to load snail image: ${snailSrc}`);
            }
        } catch (error) {
            console.error('Error in loadImages function:', error);
            resolve(); // Резолвим промис, даже если возникла ошибка
        }
    });
}

// Получение изображения улитки из кеша
function getSnailImage(type) {
    try {
        // Проверяем, что imageCache существует
        if (!imageCache || typeof imageCache !== 'object') {
            console.error('imageCache is not defined or not an object');
            return null;
        }
        
        // Сопоставление между типами улиток и цветами изображений
        const snailColorMapping = {
            'racer': 'red',
            'explorer': 'green',
            'snake': 'blue',
            'stubborn': 'lilac',
            'deadender': 'yellow'
        };
        
        // Проверяем наличие изображения по типу
        if (imageCache[`snail_${type}`]) {
            return imageCache[`snail_${type}`];
        }
        
        // Проверяем наличие изображения по цвету
        const color = snailColorMapping[type];
        if (color && imageCache[`${color}_snail`]) {
            console.log(`Using color-based snail image for type ${type}: ${color}_snail`);
            return imageCache[`${color}_snail`];
        }
        
        console.warn(`Snail image for type ${type} not found in cache`);
        
        // Пытаемся вернуть дефолтное изображение, если оно есть
        if (imageCache[`snail_deadender`]) {
            console.log(`Using default snail image for type ${type}`);
            return imageCache[`snail_deadender`];
        }
        
        if (imageCache[`yellow_snail`]) {
            console.log(`Using yellow snail image for type ${type}`);
            return imageCache[`yellow_snail`];
        }
        
        // Ищем любое доступное изображение улитки
        for (const key in imageCache) {
            if (key.startsWith('snail_') || key.includes('_snail')) {
                console.log(`Using fallback snail image ${key} for type ${type}`);
                return imageCache[key];
            }
        }
        
        console.error(`No suitable snail image found for type ${type}`);
        return null;
    } catch (error) {
        console.error('Error in getSnailImage function:', error);
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
    
    // Рисуем сетку и стены
    for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
            const cell = maze.grid[y][x];
            const cellX = x * cellSize;
            const cellY = y * cellSize;
            
            // Рисуем фон ячейки
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(cellX, cellY, cellSize, cellSize);
            
            // Рисуем стены
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            
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
        }
    }
    
    // Рисуем старт и финиш
    const startImg = imageCache['start'];
    const finishImg = imageCache['finish'];
    
    if (startImg) {
        ctx.drawImage(
            startImg,
            maze.startPoint.x * cellSize,
            maze.startPoint.y * cellSize,
            cellSize,
            cellSize
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