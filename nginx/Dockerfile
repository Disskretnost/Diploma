# Этап 1: Сборка фронтенда
FROM node:16-alpine AS build

WORKDIR /app

# Копируем package.json и package-lock.json
COPY client/package.json client/package-lock.json ./
RUN npm install

# Копируем весь код и собираем приложение
COPY client /app
RUN npm run build

# Этап 2: Настройка Nginx
FROM nginx:latest

# Копируем собранные файлы фронтенда
COPY --from=build /app/build /var/www/static

# Открываем порт 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
