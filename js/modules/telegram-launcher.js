/**
 * Module for integration with Telegram Mini App
 * Provides Telegram WebApp initialization and interaction with its API
 */

// Function to initialize the Telegram launcher
function initTelegramLauncher() {
    try {
        console.log('Initializing Telegram launcher...');
        
        // Check for Telegram WebApp existence
        if (!window.Telegram || !window.Telegram.WebApp) {
            console.warn('Telegram WebApp not available. Running in standalone mode.');
            return false;
        }
        
        const tg = window.Telegram.WebApp;
        
        // Check if the game is launched from Telegram
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
            console.log('Game launched from Telegram with parameters:', tg.initDataUnsafe.start_param);
            
            // If 'autostart' parameter exists, start the game automatically
            if (tg.initDataUnsafe.start_param === 'autostart') {
                console.log('Auto-start enabled');
                setTimeout(autoStartGame, 1000);
            }
        }
        
        // Check if the game is running through ngrok
        const isNgrok = window.location.hostname.includes('ngrok') || 
                       window.location.href.includes('ngrok');
                       
        if (isNgrok) {
            console.log('Game launched through ngrok, enabling auto-start');
            // Delay is needed to ensure DOM is fully loaded
            setTimeout(autoStartGame, 1500);
        } else {
            console.log('Game not launched through ngrok:', window.location.href);
        }
        
        // Tell Telegram the app is ready
        if (typeof tg.ready === 'function') {
            tg.ready();
        }
        
        // Expand the app to full screen
        if (typeof tg.expand === 'function') {
            tg.expand();
        }
        
        // Set up event handlers
        if (typeof tg.onEvent === 'function') {
            tg.onEvent('viewportChanged', handleViewportChanged);
            tg.onEvent('mainButtonClicked', handleMainButtonClicked);
        }
        
        // Set up back button handler
        if (tg.BackButton) {
            setupBackButton(tg.BackButton);
        }
        
        console.log('Telegram launcher initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Telegram launcher:', error);
        return false;
    }
}

// Function to automatically start the game
function autoStartGame() {
    console.log('Auto-start function called');
    
    // Find the start race button
    const startRaceBtn = document.getElementById('start-race');
    
    if (!startRaceBtn) {
        console.warn('Start race button not found in DOM');
        // Если кнопка не найдена, попробуем снова через секунду
        return setTimeout(autoStartGame, 1000);
    }
    
    // Проверяем, есть ли уже выбранная улитка
    const hasSelectedSnail = document.querySelector('.snail-option.selected') !== null;
    
    if (!hasSelectedSnail) {
        console.log('No snail selected, choosing one automatically');
        
        // Находим все доступные улитки
        const snailOptions = document.querySelectorAll('.snail-option');
        
        if (snailOptions && snailOptions.length > 0) {
            // Предпочитаем стандартную улитку, если она есть
            let defaultSnail = null;
            let randomSnail = null;
            
            snailOptions.forEach(option => {
                if (option.dataset.snail === 'deadender') {
                    defaultSnail = option;
                }
                // Сохраняем первую улитку как запасной вариант
                if (!randomSnail) {
                    randomSnail = option;
                }
            });
            
            // Выбираем стандартную улитку или любую доступную
            const snailToSelect = defaultSnail || randomSnail;
            
            if (snailToSelect && typeof snailToSelect.click === 'function') {
                console.log(`Auto-selecting snail: ${snailToSelect.dataset.snail}`);
                snailToSelect.click();
                
                // Устанавливаем сумму ставки, если необходимо
                const betInput = document.getElementById('bet-amount');
                if (betInput && (!betInput.value || parseFloat(betInput.value) <= 0)) {
                    betInput.value = '10';
                    betInput.dispatchEvent(new Event('input'));
                    console.log('Set default bet amount to 10');
                }
            } else {
                console.error('No valid snail option to click');
            }
        } else {
            console.error('No snail options found in DOM');
        }
    } else {
        console.log('Snail already selected, no need to auto-select');
    }
    
    // Проверяем еще раз, активна ли кнопка старта
    if (startRaceBtn && !startRaceBtn.disabled) {
        console.log('Start race button is ready, clicking it');
        startRaceBtn.click();
    } else if (startRaceBtn && startRaceBtn.disabled) {
        console.log('Start race button is disabled, waiting...');
        // Возможно, выбор улитки еще обрабатывается, подождем немного
        setTimeout(() => {
            if (startRaceBtn && !startRaceBtn.disabled) {
                console.log('Start race button is now ready, clicking it');
                startRaceBtn.click();
            } else {
                console.warn('Start race button still disabled after timeout');
            }
        }, 1000);
    }
}

// Function to set up the back button
function setupBackButton(backButton) {
    try {
        // Hide the button by default
        if (typeof backButton.hide === 'function') {
            backButton.hide();
        }
        
        // Handler for back button clicks
        if (typeof backButton.onClick === 'function') {
            backButton.onClick(() => {
                // Check which screen we're on
                const startScreen = document.getElementById('start-screen');
                const raceScreen = document.getElementById('race-screen');
                const resultsScreen = document.getElementById('results-screen');
                
                if (startScreen && !startScreen.classList.contains('hidden')) {
                    // If we're on the start screen - close the app
                    window.Telegram.WebApp.close();
                } else if (raceScreen && !raceScreen.classList.contains('hidden')) {
                    // If we're on the race screen - can't go back
                    // Do nothing or show a message
                } else if (resultsScreen && !resultsScreen.classList.contains('hidden')) {
                    // If we're on the results screen - go back to the start screen
                    document.getElementById('play-again').click();
                }
            });
        }
    } catch (error) {
        console.warn('Error setting up back button:', error);
    }
}

// Handler for viewport changes
function handleViewportChanged(event) {
    try {
        console.log('Viewport changed:', event);
        
        // Here we can adapt the interface when the window size changes
        // for example, redraw Canvas, etc.
        
        // Call resize to update element sizes
        window.dispatchEvent(new Event('resize'));
    } catch (error) {
        console.warn('Error handling viewport change:', error);
    }
}

// Handler for main button clicks
function handleMainButtonClicked() {
    try {
        console.log('Main button clicked');
        
        // Check which screen we're on
        const startScreen = document.getElementById('start-screen');
        const raceScreen = document.getElementById('race-screen');
        const resultsScreen = document.getElementById('results-screen');
        
        if (startScreen && !startScreen.classList.contains('hidden')) {
            // If we're on the start screen - start the race
            const startRaceBtn = document.getElementById('start-race');
            if (startRaceBtn && !startRaceBtn.disabled) {
                startRaceBtn.click();
            }
        } else if (resultsScreen && !resultsScreen.classList.contains('hidden')) {
            // If we're on the results screen - play again
            document.getElementById('play-again').click();
        }
    } catch (error) {
        console.warn('Error handling main button click:', error);
    }
}

// Делаем функцию доступной глобально
window.initTelegramLauncher = initTelegramLauncher;

// Автоматически запускаем инициализацию после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Telegram launcher...');
    setTimeout(initTelegramLauncher, 500);
}); 