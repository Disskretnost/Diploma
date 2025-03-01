import { useState, useEffect, useRef } from 'react';
import socket from './../socket/index';
import ACTIONS from './../socket/actions';
import { useNavigate } from 'react-router-dom';  // Импортируем useNavigate
import { v4 } from 'uuid';

const HomePage = () => {
  const navigate = useNavigate();  // Заменили history на navigate
  const [rooms, updateRooms] = useState([]);
  const rootNode = useRef();

  useEffect(() => {
    const handleRoomsUpdate = ({ rooms = [] }) => {
      if (rootNode.current) {
        updateRooms(rooms);
      }
    };

    socket.on(ACTIONS.SHARE_ROOMS, handleRoomsUpdate);

    // Очистка слушателя при размонтировании компонента
    return () => socket.off(ACTIONS.SHARE_ROOMS, handleRoomsUpdate);
  }, []);

  const handleJoinRoom = (roomID) => navigate(`/room/${roomID}`);
  const handleCreateRoom = () => navigate(`/room/${v4()}`);

  return (
    <div ref={rootNode}>
      <h1>Available Rooms</h1>

      <ul>
        {rooms.map(roomID => (
          <li key={roomID}>
            {roomID}
            <button onClick={() => handleJoinRoom(roomID)}>
              JOIN ROOM
            </button>
          </li>
        ))}
      </ul>

      <button onClick={handleCreateRoom}>
        Create New Room
      </button>
    </div>
  );
};

export default HomePage;
