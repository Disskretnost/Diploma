# Используем легкий образ с Node.js для сборки
FROM node:18.18.2-alpine AS build

# Устанавливаем необходимые пакеты, например, для работы с часами
RUN apk add --no-cache tzdata

# Устанавливаем часовой пояс для контейнера
ENV TZ Europe/Moscow

# Устанавливаем рабочую директорию для React
WORKDIR /opt/react

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект в контейнер
COPY . .

# Собираем React-приложение для продакшн
RUN npm run build

# Конец Dockerfile, сборка завершена
