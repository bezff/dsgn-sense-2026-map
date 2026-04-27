# Осязание — карта (кейс 9)

Интерактивная карта с метками, админкой и режимом отображения, удобным для чтения с экрана (в т.ч. шрифт Брайля ))))))))) мультисенсорность все дела ). Бэкенд на Node.js + SQLite, фронт на React + TypeScript.

Этот сайт делали **на олимпиаде DSGN Sense** при **Центральном университете в Москве**, **23–27 апреля 2026 года**. Решение готовилось под **кейс 9 — трек Yadro × «Осязание»**.

> Это рабочий черновик с олимпиады: "допилите пожалуйста" :))))

## Стек

- **Frontend:** React 19, TypeScript, styled-components, react-router-dom  
- **Backend:** Express, SQLite3, multer (загрузка картинок карты и фото к меткам)

## Быстрый старт

### 1. Зависимости

Из корня репозитория:

```bash
npm run install:all
```

Или по отдельности: `cd backend && npm install`, затем `cd ../frontend && npm install`.

### 2. API в режиме разработки

Фронт по умолчанию ходит в `/api`. На `localhost:3000` этого маршрута нет, поэтому для дев-сборки удобно создать файл **`frontend/.env.local`**:

```bash
REACT_APP_API_URL=http://localhost:3001/api
```

### 3. Запуск

**Вариант А — два терминала**

```bash
# терминал 1
cd backend && npm start

# терминал 2
cd frontend && npm start
```

**Вариант Б — скрипт из корня (macOS/Linux)**

```bash
chmod +x start.sh   # один раз
./start.sh
```

Бэкенд: порт **3001**, фронт: **3000**. Карта: [http://localhost:3000/map](http://localhost:3000/map), админка: [http://localhost:3000/admin](http://localhost:3000/admin).

## Продакшен-сборка

Бэкенд отдаёт статику из `frontend/build`, если она собрана:

```bash
cd frontend && npm run build
cd ../backend && npm start
```

Переменная окружения **`PORT`** задаёт порт Node (по умолчанию 3001).

## Структура

```
backend/     — API, SQLite, uploads
frontend/    — React-приложение
start.sh     — локальный запуск бэка + фронта
```


---

Сделано в рамках DSGN Sense · Центральный университет · Москва · 23–27.04.2026 · кейс 9 Yadro × Осязание.
