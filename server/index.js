require('dotenv').config();
const errorMiddlewares = require('./midllewares/errorMiddlewares')
const express = require('express');
const sequelize = require('./db');
const {version, validate} = require('uuid');
const models = require('./models');  
const cors = require('cors');
const http = require('http');  // Для создания HTTP сервера
const router = require('./routes/index');
const socketIO = require('socket.io');  // Подключаем Socket.IO
const app = express();
require('dotenv').config({ path: '../.env' });  // Указываем путь к файлу .env на один уровень выше
const ACTIONS = require('./socket/actions')
app.use(cors({
  origin: '*',  // Разрешить доступ с любых доменов
  methods: '*',  // Разрешить все методы HTTP
  allowedHeaders: '*',  // Разрешить все заголовки
}));
app.use(express.json());  // Для парсинга JSON в запросах


// Настроим маршруты
app.use('/api', router);  // API маршруты
app.use(errorMiddlewares);  // Промежуточное ПО для обработки ошибок

// Создаем HTTP сервер и передаем его в Socket.IO
const server = http.createServer(app);

// Инициализация Socket.IO с этим сервером
const io = new socketIO.Server(server, {
  cors: {
    origin: '*',  // Разрешить все источники
    methods: '*',  // Разрешить все методы
    credentials: true,  
  },
});


function getClientRooms() {
  const {rooms} = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4);
}

function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: getClientRooms()
  })
}


io.on('connection', socket => {
  console.log("Подлючение ");
  shareRoomsInfo();

  socket.on(ACTIONS.JOIN, config => {
    const {room: roomID} = config;
    const {rooms: joinedRooms} = socket;

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

    clients.forEach(clientID => {
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    socket.join(roomID);
    shareRoomsInfo();
  });
  function leaveRoom() {
    const {rooms} = socket;

    Array.from(rooms)
      // LEAVE ONLY CLIENT CREATED ROOM
      .filter(roomID => validate(roomID) && version(roomID) === 4)
      .forEach(roomID => {

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients
          .forEach(clientID => {
          io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: socket.id,
          });

          socket.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });
        });

        socket.leave(roomID);
      });

    shareRoomsInfo();
  }

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on('disconnecting', leaveRoom);
  socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => {
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    });
  });

});

// Запуск сервера
const start = async () => {
  try {
    await sequelize.authenticate();  // Подключаемся к базе данных
    await sequelize.sync({ alter: true });  // Синхронизируем модели с базой данных

    // Запускаем сервер на том же порту
    server.listen(process.env.SERVER_PORT, () => {
      console.log(`Сервер запущен на порту ${process.env.SERVER_PORT}`);
    });
  } catch (e) {
    console.error('Ошибка при запуске сервера:', e);
  }
};

start();
