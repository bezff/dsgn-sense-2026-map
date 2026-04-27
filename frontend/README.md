# Frontend (React)

Коротко: это CRA-приложение для карты и админки. Полная история проекта, олимпиада и деплой — в [**корневом README**](../README.md).

## Локально

```bash
npm install
```

Для запросов к API на порту 3001 создайте `.env.local`:

```
REACT_APP_API_URL=http://localhost:3001/api
```

```bash
npm start
```

## Сборка

```bash
npm run build
```

Артефакт попадает в `build/` — его подхватывает бэкенд в проде.
