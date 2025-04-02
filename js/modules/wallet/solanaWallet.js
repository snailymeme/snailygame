/**
 * Модуль для работы с кошельком Solana в Telegram Mini App
 * Обеспечивает подключение к кошельку, проверку баланса и выполнение транзакций
 */

class SolanaWallet {
    /**
     * Создает новый экземпляр кошелька Solana
     * @param {Object} options - Параметры инициализации
     * @param {string} options.network - Сеть Solana ('mainnet', 'testnet', 'devnet')
     * @param {Object} options.telegram - Объект Telegram WebApp
     */
    constructor(options = {}) {
        this.network = options.network || 'mainnet';
        this.telegram = options.telegram || null;
        this.isConnected = false;
        this.publicKey = null;
        this.balance = 0;
        this.onConnectCallback = null;
        this.onDisconnectCallback = null;
        
        // Инициализация при наличии Telegram WebApp
        if (this.telegram && window.TelegramWebviewProxy && window.TelegramWebviewProxy.postEvent) {
            this.initTelegramEvents();
        }
    }
    
    /**
     * Инициализирует обработчики событий для Telegram
     * @private
     */
    initTelegramEvents() {
        // Обработчик сообщений от Telegram
        window.Telegram.WebApp.onEvent('web_app_data_send', (data) => {
            if (data && data.data) {
                try {
                    const jsonData = JSON.parse(data.data);
                    if (jsonData.type === 'wallet_connect_result') {
                        this.handleWalletConnectResult(jsonData);
                    } else if (jsonData.type === 'transaction_result') {
                        this.handleTransactionResult(jsonData);
                    }
                } catch (error) {
                    console.error('Ошибка обработки данных Telegram:', error);
                }
            }
        });
    }
    
    /**
     * Обрабатывает результат подключения кошелька
     * @param {Object} data - Данные от Telegram
     * @private
     */
    handleWalletConnectResult(data) {
        if (data.success) {
            this.isConnected = true;
            this.publicKey = data.publicKey;
            this.balance = data.balance || 0;
            
            console.log('Кошелек Solana подключен:', this.publicKey);
            
            if (this.onConnectCallback) {
                this.onConnectCallback({
                    publicKey: this.publicKey,
                    balance: this.balance
                });
            }
        } else {
            console.error('Ошибка подключения кошелька:', data.error);
        }
    }
    
    /**
     * Обрабатывает результат транзакции
     * @param {Object} data - Данные от Telegram
     * @private
     */
    handleTransactionResult(data) {
        if (data.transactionId) {
            console.log('Транзакция выполнена:', data.transactionId);
            this.balance = data.newBalance || this.balance;
        } else {
            console.error('Ошибка транзакции:', data.error);
        }
    }
    
    /**
     * Подключает кошелек Solana
     * @returns {Promise} Promise, который разрешается при успешном подключении
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                resolve({
                    publicKey: this.publicKey,
                    balance: this.balance
                });
                return;
            }
            
            this.onConnectCallback = resolve;
            
            try {
                if (this.telegram && window.Telegram && window.Telegram.WebApp) {
                    // Отправляем запрос на подключение кошелька через Telegram
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        action: 'connect_wallet',
                        network: this.network
                    }));
                } else {
                    // Для отладки вне Telegram
                    console.log('Имитация подключения кошелька Solana...');
                    setTimeout(() => {
                        this.isConnected = true;
                        this.publicKey = 'EXAMPLEpublicKeyForTestingPurposes123456789';
                        this.balance = 10.5;
                        
                        if (this.onConnectCallback) {
                            this.onConnectCallback({
                                publicKey: this.publicKey,
                                balance: this.balance
                            });
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('Ошибка при подключении кошелька:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Отключает кошелек
     */
    disconnect() {
        this.isConnected = false;
        this.publicKey = null;
        this.balance = 0;
        
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }
    }
    
    /**
     * Проверяет баланс кошелька
     * @returns {Promise<number>} Promise с текущим балансом
     */
    checkBalance() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Кошелек не подключен'));
                return;
            }
            
            try {
                if (this.telegram && window.Telegram && window.Telegram.WebApp) {
                    // Отправляем запрос на проверку баланса через Telegram
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        action: 'check_balance',
                        publicKey: this.publicKey
                    }));
                    
                    // Устанавливаем временный обработчик для получения баланса
                    const originalCallback = this.onConnectCallback;
                    this.onConnectCallback = (data) => {
                        this.balance = data.balance;
                        resolve(this.balance);
                        this.onConnectCallback = originalCallback;
                    };
                } else {
                    // Для отладки вне Telegram
                    setTimeout(() => {
                        this.balance = 10.5;
                        resolve(this.balance);
                    }, 500);
                }
            } catch (error) {
                console.error('Ошибка при проверке баланса:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Выполняет транзакцию
     * @param {Object} options - Параметры транзакции
     * @param {string} options.to - Адрес получателя
     * @param {number} options.amount - Сумма транзакции
     * @param {string} options.memo - Дополнительное сообщение (опционально)
     * @returns {Promise} Promise, который разрешается при выполнении транзакции
     */
    sendTransaction(options) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Кошелек не подключен'));
                return;
            }
            
            if (!options || !options.to || !options.amount) {
                reject(new Error('Неверные параметры транзакции'));
                return;
            }
            
            try {
                if (this.telegram && window.Telegram && window.Telegram.WebApp) {
                    // Отправляем запрос на выполнение транзакции через Telegram
                    window.Telegram.WebApp.sendData(JSON.stringify({
                        action: 'send_transaction',
                        publicKey: this.publicKey,
                        to: options.to,
                        amount: options.amount,
                        memo: options.memo || ''
                    }));
                    
                    // Устанавливаем временный обработчик для получения результата транзакции
                    const tempHandler = (data) => {
                        if (data && data.type === 'transaction_result') {
                            window.Telegram.WebApp.offEvent('web_app_data_send', tempHandler);
                            
                            if (data.transactionId) {
                                this.balance = data.newBalance || this.balance;
                                resolve({
                                    transactionId: data.transactionId,
                                    newBalance: this.balance
                                });
                            } else {
                                reject(new Error(data.error || 'Ошибка транзакции'));
                            }
                        }
                    };
                    
                    window.Telegram.WebApp.onEvent('web_app_data_send', tempHandler);
                } else {
                    // Для отладки вне Telegram
                    setTimeout(() => {
                        this.balance -= options.amount;
                        resolve({
                            transactionId: 'mock_tx_' + Date.now(),
                            newBalance: this.balance
                        });
                    }, 1000);
                }
            } catch (error) {
                console.error('Ошибка при выполнении транзакции:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Устанавливает обработчик события подключения
     * @param {Function} callback - Функция-обработчик
     */
    onConnect(callback) {
        this.onConnectCallback = callback;
    }
    
    /**
     * Устанавливает обработчик события отключения
     * @param {Function} callback - Функция-обработчик
     */
    onDisconnect(callback) {
        this.onDisconnectCallback = callback;
    }
    
    /**
     * Получает сокращенную строку публичного ключа (для отображения)
     * @returns {string} Сокращенная строка публичного ключа
     */
    getShortPublicKey() {
        if (!this.publicKey) return '';
        if (this.publicKey.length <= 12) return this.publicKey;
        
        return this.publicKey.substring(0, 6) + '...' + this.publicKey.substring(this.publicKey.length - 6);
    }
    
    /**
     * Проверяет, подключен ли кошелек
     * @returns {boolean} True, если кошелек подключен
     */
    isWalletConnected() {
        return this.isConnected && !!this.publicKey;
    }
    
    /**
     * Форматирует сумму SOL для отображения
     * @param {number} amount - Сумма SOL
     * @param {number} decimals - Количество десятичных знаков
     * @returns {string} Отформатированная строка
     */
    formatSOL(amount, decimals = 2) {
        return amount.toFixed(decimals) + ' SOL';
    }
}

// Делаем класс доступным глобально
window.SolanaWallet = SolanaWallet; 