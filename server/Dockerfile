
FROM node:18-bullseye AS dev

# Устанавливаем системные зависимости
ENV TZ Europe/Moscow

# Указываем путь для node_modules
ENV NODE_PATH /opt/server/node_modules

# Устанавливаем рабочую директорию
WORKDIR /opt/server

# Копируем package.json и package-lock.json для установки зависимостей
COPY package.json ./

RUN npm install -g node-pre-gyp
    
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
