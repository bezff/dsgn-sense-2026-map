#!/bin/bash

# Скрипт для очистки портов 3000 и 3001 и запуска проекта (Backend + Frontend)

# Переходим в директорию, где находится сам скрипт (корень проекта)
cd "$(dirname "$0")"

echo "🔍 Проверка портов 3000 и 3001..."

# Функция для завершения процесса на указанном порту
kill_port() {
  local port=$1
  local pids=$(lsof -ti tcp:$port)
  
  if [ ! -z "$pids" ]; then
    # Заменяем переносы строк на пробелы, чтобы kill обработал все PID
    pids_inline=$(echo $pids | tr '\n' ' ')
    echo "⚠️  Порт $port занят процессами: $pids_inline. Завершаем..."
    kill -9 $pids_inline
    echo "✅ Процессы на порту $port успешно завершены."
  else
    echo "✅ Порт $port свободен."
  fi
}

# Очищаем порты
kill_port 3000
kill_port 3001

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
