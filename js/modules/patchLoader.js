/**
 * Модуль для загрузки и применения патчей улиток
 * Обеспечивает регистрацию и загрузку патчей для различных типов улиток
 */

class PatchLoader {
    /**
     * Создает загрузчик патчей
     */
    constructor() {
        this.patches = {};
        this.loadedPatches = {};
    }

    /**
     * Регистрирует патч для определенного типа улитки
     * @param {string} slugType - Тип улитки (например, 'racer', 'explorer')
     * @param {Function} patchFunction - Функция патча, которая будет вызвана для применения к Slug
     */
    registerPatch(slugType, patchFunction) {
        if (typeof patchFunction !== 'function') {
            console.error(`Ошибка: Патч для типа '${slugType}' должен быть функцией`);
            return false;
        }
        
        this.patches[slugType] = patchFunction;
        console.log(`Патч для типа '${slugType}' зарегистрирован`);
        return true;
    }

    /**
     * Применяет патч для указанного типа улитки
     * @param {string} slugType - Тип улитки
     * @param {Object} [options] - Опции для применения патча
     * @returns {boolean} Успешно ли применен патч
     */
    applyPatch(slugType, options = {}) {
        if (!this.patches[slugType]) {
            console.error(`Ошибка: Патч для типа '${slugType}' не зарегистрирован`);
            return false;
        }
        
        try {
            // Вызываем функцию патча
            const result = this.patches[slugType](options);
            this.loadedPatches[slugType] = true;
            console.log(`Патч для типа '${slugType}' успешно применен`);
            return result;
        } catch (error) {
            console.error(`Ошибка при применении патча для типа '${slugType}':`, error);
            return false;
        }
    }

    /**
     * Применяет все зарегистрированные патчи
     * @param {Object} [options] - Опции для применения патчей
     * @returns {Object} Объект с результатами применения патчей для каждого типа
     */
    applyAllPatches(options = {}) {
        const results = {};
        
        for (const slugType in this.patches) {
            results[slugType] = this.applyPatch(slugType, options);
        }
        
        return results;
    }

    /**
     * Проверяет, загружен ли патч для указанного типа улитки
     * @param {string} slugType - Тип улитки
     * @returns {boolean} Загружен ли патч
     */
    isPatchLoaded(slugType) {
        return !!this.loadedPatches[slugType];
    }

    /**
     * Получает список всех зарегистрированных типов улиток
     * @returns {Array<string>} Массив типов улиток
     */
    getRegisteredTypes() {
        return Object.keys(this.patches);
    }

    /**
     * Получает список всех загруженных типов улиток
     * @returns {Array<string>} Массив типов улиток
     */
    getLoadedTypes() {
        return Object.keys(this.loadedPatches);
    }
}

// Создаем глобальный экземпляр загрузчика патчей
window.patchLoader = new PatchLoader(); 