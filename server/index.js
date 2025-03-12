require('dotenv').config();
const errorMiddlewares = require('./midllewares/errorMiddlewares')
const express = require('express');
const sequelize = require('./db');
const {version, validate} = require('uuid');
const models = require('./models');  
const cors = require('cors');
const http = require('http');  // Для создания HTTP сервера
const router = require('./routes/index');
const { v4: uuidv4 } = require('uuid'); // Импортируем функцию
const app = express();
require('dotenv').config({ path: '../.env' });  // Указываем путь к файлу .env на один уровень выше
const webrtc = require('wrtc');
const WebSocket = require('ws'); 
app.use(cors({
    origin: 'http://nginx',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Для передачи JWT/cookies
  }));

app.use(express.json());  // Для парсинга JSON в запросах


// Настроим маршруты
app.use('/api', router);  // API маршруты
app.use(errorMiddlewares);  // Промежуточное ПО для обработки ошибок

// Создаем HTTP сервер и передаем его в Socket.IO
const server = http.createServer(app);


let peers = new Map();
let consumers = new Map();

function handleTrackEvent(e, peer, ws) {
    if (e.streams && e.streams[0]) {
        const stream = e.streams[0];

        // Не отправлять локальный поток другим пользователям
        if (stream.id === peers.get(peer).stream?.id) {
            return; // Это локальный поток, не рассылаем
        }

        peers.get(peer).stream = stream;

        const payload = {
            type: 'newProducer',
            id: peer,
            username: peers.get(peer).username
        };
        wss.broadcast(JSON.stringify(payload));
    }
}


function createPeer() {
    let peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
              urls: 'stun:stun.l.google.com:19302', 
            },
            {
              urls: 'turn:relay1.expressturn.com:3478', // Ваш TURN сервер
              username: 'efY1N8CC9QW4SWCLD9',  // Имя пользователя для TURN сервера
              credential: 'JiQ8WC2gbyA4G3Ja', // Пароль для TURN сервера
            }
          ],
    });

    return peer;
}

// Create a server for handling websocket calls
const wss = new WebSocket.Server({ server: server });


wss.on('connection', function (ws) {
    let peerId = uuidv4();
    console.log("сервер срабатывает");
    ws.id = peerId;
    ws.on('close', (event) => {
        peers.delete(ws.id);
        consumers.delete(ws.id);

        wss.broadcast(JSON.stringify({
            type: 'user_left',
            id: ws.id
        }));
    });


    ws.send(JSON.stringify({ 'type': 'welcome', id: peerId }));
    ws.on('message', async function (message) {
        const body = JSON.parse(message);
        switch (body.type) {
            case 'connect':
                peers.set(body.uqid, { socket: ws });
                const peer = createPeer();
                peers.get(body.uqid).username = body.username;
                peers.get(body.uqid).peer = peer;
                peer.ontrack = (e) => { handleTrackEvent(e, body.uqid, ws) };
                const desc = new webrtc.RTCSessionDescription(body.sdp);
                await peer.setRemoteDescription(desc);
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);



                const payload = {
                    type: 'answer',
                    sdp: peer.localDescription
                }

                ws.send(JSON.stringify(payload));
                break;
            case 'getPeers':
                let uuid = body.uqid;
                const list = [];
                peers.forEach((peer, key) => {
                    if (key != uuid) {
                        const peerInfo = {
                            id: key,
                            username: peer.username,
                        }
                        list.push(peerInfo);
                    }
                });

                const peersPayload = {
                    type: 'peers',
                    peers: list
                }

                ws.send(JSON.stringify(peersPayload));
                break;
            case 'ice':
                const user = peers.get(body.uqid);
                if (user.peer)
                    user.peer.addIceCandidate(new webrtc.RTCIceCandidate(body.ice)).catch(e => console.log(e));
                break;
            case 'consume':
                try {
                    let { id, sdp, consumerId } = body;
                    const remoteUser = peers.get(id);
                    const newPeer = createPeer();
                    consumers.set(consumerId, newPeer);
                    const _desc = new webrtc.RTCSessionDescription(sdp);
                    await consumers.get(consumerId).setRemoteDescription(_desc);

                    remoteUser.stream.getTracks().forEach(track => {
                        consumers.get(consumerId).addTrack(track, remoteUser.stream);
                    });
                    const _answer = await consumers.get(consumerId).createAnswer();
                    await consumers.get(consumerId).setLocalDescription(_answer);

                    const _payload = {
                        type: 'consume',
                        sdp: consumers.get(consumerId).localDescription,
                        username: remoteUser.username,
                        id,
                        consumerId
                    }

                    ws.send(JSON.stringify(_payload));
                } catch (error) {
                    console.log(error)
                }

                break;
            case 'consumer_ice':
                if (consumers.has(body.consumerId)) {
                    consumers.get(body.consumerId).addIceCandidate(new webrtc.RTCIceCandidate(body.ice)).catch(e => console.log(e));
                }
                break;
            default:
                wss.broadcast(message);

        }
    });

    ws.on('error', () => ws.terminate());
});

wss.broadcast = function (data) {
    peers.forEach(function (peer) {
        if (peer.socket.readyState === WebSocket.OPEN) {
            peer.socket.send(data);
        }
    });
};


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
