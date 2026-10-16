#!/bin/bash

# Скрипт для очистки портов 3000 и 3001 и запуска проекта (Backend + Frontend)

# Переходим в директорию, где находится сам скрипт (корень проекта)
cd "$(dirname "$0")"

echo "🔍 Проверка портов 3000 и 3001..."

busy=0
for port in 3000 3001; do
  if lsof -ti tcp:"$port" >/dev/null 2>&1; then
    echo "Порт $port занят. Скрипт чужой процесс не убивает."
    busy=1
  else
    echo "Порт $port свободен."
  fi
done

if [ "$busy" -eq 1 ]; then
  echo "Освободи порт и запусти снова."
  exit 1
fi

echo "🚀 Запуск проекта..."

# Запускаем Backend в фоновом режиме
echo "📦 Запуск Backend (порт 3001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Ждем пару секунд, чтобы бэкенд успел стартовать
sleep 2

# Запускаем Frontend
echo "🎨 Запуск Frontend (порт 3000)..."
cd frontend
npm start

# Если фронтенд будет остановлен (Ctrl+C), завершаем и бэкенд
trap "echo '🛑 Остановка серверов...'; kill $BACKEND_PID; exit" INT TERM
