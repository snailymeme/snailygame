#!/bin/bash

# Убиваем все процессы, которые могут использовать порт 8080
pkill -f "http-server" || true

# Убиваем все процессы ngrok
pkill -f "ngrok" || true

# Очищаем предыдущий URL файл, если он существует
rm -f ngrok-url.txt

# Запускаем ngrok в фоновом режиме
echo "Запускаем ngrok туннель..."
npm run tunnel &
NGROK_PID=$!

# Даем ngrok время на запуск (около 5 секунд)
sleep 5

# Проверяем, создался ли файл с URL
if [ ! -f ngrok-url.txt ]; then
    echo "Не удалось получить URL от ngrok. Проверьте логи."
    kill $NGROK_PID
    exit 1
fi

# Читаем URL из файла
NGROK_URL=$(cat ngrok-url.txt)
echo "Получен URL от ngrok: $NGROK_URL"

# Запускаем HTTP сервер в фоновом режиме
echo "Запускаем веб-сервер..."
npm run start &
HTTP_PID=$!

# Даем серверу время на запуск
sleep 2

echo "Запускаем Telegram бота..."
npm run bot

# При завершении скрипта (Ctrl+C), убиваем запущенные процессы
trap "kill $NGROK_PID $HTTP_PID; exit" INT TERM EXIT 