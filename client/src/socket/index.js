import io from "socket.io-client";
import { SERVER_URL} from './../http/api';
const options = {
    forceNew: true,  // Правильное имя параметра
    reconnectionAttempts: Infinity,  // Правильное имя параметра
    timeout: 10000,
    transports: ['websocket'],  // Правильное имя параметра (transports вместо transpotts)
};

const socket = io.connect(SERVER_URL, options);
socket.on('connect', () => {
    console.log('Socket.IO connected to:', socket.io.uri);
    console.log('WebSocket connected:', socket.io.engine.transport.name === 'websocket');

  });

export default socket;
