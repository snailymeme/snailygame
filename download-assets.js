/**
 * Скрипт для загрузки необходимых для игры изображений
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Создаем директорию для изображений, если ее нет
const assetsDir = path.join(__dirname, 'assets');
const imagesDir = path.join(assetsDir, 'images');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
    console.log('✅ Создана директория assets/');
}

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
    console.log('✅ Создана директория assets/images/');
}

// Список необходимых изображений
const images = [
    {
        name: 'red_snail.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/red_snail.png'
    },
    {
        name: 'green_snail.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/green_snail.png'
    },
    {
        name: 'blue_snail.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/blue_snail.png'
    },
    {
        name: 'lilac_snail.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/purple_snail.png'
    },
    {
        name: 'yellow_snail.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/yellow_snail.png'
    },
    {
        name: 'wall_texture.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/wall.png'
    },
    {
        name: 'start.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/start.png'
    },
    {
        name: 'finish.png',
        url: 'https://raw.githubusercontent.com/telegramgames/snailrace/main/images/finish.png'
    }
];

// Функция для загрузки одного изображения
function downloadImage(imageInfo) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(imagesDir, imageInfo.name);
        
        // Проверяем, существует ли файл
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Пропускаем ${imageInfo.name} - файл уже существует`);
            return resolve();
        }
        
        const file = fs.createWriteStream(filePath);
        
        https.get(imageInfo.url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Ошибка загрузки ${imageInfo.name}: HTTP ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`✅ Загружен файл ${imageInfo.name}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Удаляем неполный файл
            console.error(`❌ Ошибка при загрузке ${imageInfo.name}:`, err.message);
            reject(err);
        });
    });
}

// Загружаем все изображения последовательно
async function downloadAllImages() {
    console.log('🖼️ Начинаем загрузку изображений...');
    
    const failedImages = [];
    
    for (const imageInfo of images) {
        try {
            await downloadImage(imageInfo);
        } catch (error) {
            console.error(`❌ Не удалось загрузить ${imageInfo.name}:`, error.message);
            failedImages.push(imageInfo.name);
        }
    }
    
    if (failedImages.length > 0) {
        console.log('\n⚠️ Не удалось загрузить следующие изображения:');
        failedImages.forEach(name => console.log(`   - ${name}`));
        console.log('\nВам нужно будет добавить эти изображения вручную в папку assets/images/');
    } else {
        console.log('\n✅ Все изображения успешно загружены!');
    }
    
    console.log('\n🚀 Теперь запустите приложение командой:');
    console.log('node start-app.js');
}

// Запускаем загрузку
downloadAllImages(); 