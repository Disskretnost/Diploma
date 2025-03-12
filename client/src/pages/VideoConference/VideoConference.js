import React, { useEffect, useState, useRef } from 'react';

const SimpleSFUClient = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const localPeerRef = useRef(null);
  const clientsRef = useRef(new Map());
  const consumersRef = useRef(new Map());
  const localUUID = useRef(null);

  const _EVENTS = {
    onLeave: 'onLeave',
    onJoin: 'onJoin',
    onCreate: 'onCreate',
    onStreamStarted: 'onStreamStarted',
    onStreamEnded: 'onStreamEnded',
    onReady: 'onReady',
    onScreenShareStopped: 'onScreenShareStopped',
    exitRoom: 'exitRoom',
    onConnected: 'onConnected',
    onRemoteTrack: 'onRemoteTrack',
    onRemoteSpeaking: 'onRemoteSpeaking',
    onRemoteStoppedSpeaking: 'onRemoteStoppedSpeaking',
  };

  useEffect(() => {
    initWebSocket();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, []);

  const initWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.hostname}/ws/`; // Используем /ws/
    console.log("Connecting...");

    const connection = new WebSocket(url);
    connection.onmessage = handleMessage;
    connection.onclose = handleClose;
    connection.onopen = () => {
      setIsConnected(true);
      trigger(_EVENTS.onConnected);
    };

    connectionRef.current = connection;
  };

  const trigger = (event, args = null) => {
    // Handle events, e.g., triggering different actions when an event occurs
  };

  const handleMessage = ({ data }) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'welcome':
        localUUID.current = message.id;
        break;
      case 'answer':
        handleAnswer(message);
        break;
      case 'peers':
        handlePeers(message);
        break;
      case 'consume':
        handleConsume(message);
        break;
      case 'newProducer':
        handleNewProducer(message);
        break;
      case 'user_left':
        removeUser(message);
        break;
      default:
        break;
    }
  };

  const handleAnswer = ({ sdp }) => {
    const desc = new RTCSessionDescription(sdp);
    localPeerRef.current.setRemoteDescription(desc).catch((e) => console.log(e));
  };

  const handlePeers = ({ peers }) => {
    if (peers.length > 0) {
      peers.forEach(async (peer) => {
        clientsRef.current.set(peer.id, peer);
        await consumeOnce(peer);
      });
    }
  };

  const handleNewProducer = ({ id, username }) => {
    if (id === localUUID.current) return;

    clientsRef.current.set(id, { id, username });
    consumeOnce({ id, username });
  };

  const handleConsume = ({ sdp, id, consumerId }) => {
    const desc = new RTCSessionDescription(sdp);
    consumersRef.current.get(consumerId).setRemoteDescription(desc).catch((e) => console.log(e));
  };

  const removeUser = ({ id }) => {
    const { username, consumerId } = clientsRef.current.get(id);
    consumersRef.current.delete(consumerId);
    clientsRef.current.delete(id);

    const videoElement = document.querySelector(`#remote_${consumerId}`);
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    const userElement = document.querySelector(`#user_${consumerId}`);
    userElement.remove();
  };

  const handleIceCandidate = ({ candidate }) => {
    if (candidate && candidate.candidate && candidate.candidate.length > 0) {
      const payload = {
        type: 'ice',
        ice: candidate,
        uqid: localUUID.current,
      };
      connectionRef.current.send(JSON.stringify(payload));
    }
  };

  const handleRemoteTrack = (stream, username, consumerId) => {
    const userVideo = document.querySelector(`#remote_${consumerId}`);
    if (userVideo) {
      const tracks = userVideo.srcObject.getTracks();
      const track = stream.getTracks()[0];
      if (!tracks.includes(track)) {
        userVideo.srcObject.addTrack(track);
      }
    } else {
      const video = createVideoElement(username, stream, consumerId);
      const div = createVideoWrapper(video, username, consumerId);
      document.querySelector('.videos-inner').appendChild(div);
      trigger(_EVENTS.onRemoteTrack, stream);
    }

    recalculateLayout();
  };

  const createVideoElement = (username, stream, consumerId) => {
    const video = document.createElement('video');
    video.id = `remote_${consumerId}`;
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = username === localUUID.current; // Mute self-video
    console.log(`Video for ${username} created, muted: ${video.muted}`);
    return video;
  };

  const createDisplayName = (username) => {
    const nameContainer = document.createElement('div');
    nameContainer.classList.add('display_name');
    const textNode = document.createTextNode(username);
    nameContainer.appendChild(textNode);
    return nameContainer;
  };

  const createVideoWrapper = (video, username, consumerId) => {
    const div = document.createElement('div');
    div.id = `user_${consumerId}`;
    div.classList.add('videoWrap');
    div.appendChild(createDisplayName(username));
    div.appendChild(video);
    return div;
  };

  const consumeOnce = async (peer) => {
    const transport = await createConsumeTransport(peer);
    const payload = {
      type: 'consume',
      id: peer.id,
      consumerId: transport.id,
      sdp: await transport.localDescription,
    };
    connectionRef.current.send(JSON.stringify(payload));
  };

  const createConsumeTransport = async (peer) => {
    const consumerId = uuidv4();
    const consumerTransport = new RTCPeerConnection({
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

    clientsRef.current.get(peer.id).consumerId = consumerId;
    consumerTransport.id = consumerId;
    consumerTransport.peer = peer;
    consumersRef.current.set(consumerId, consumerTransport);

    consumerTransport.addTransceiver('video', { direction: 'recvonly' });
    consumerTransport.addTransceiver('audio', { direction: 'recvonly' });

    const offer = await consumerTransport.createOffer();
    await consumerTransport.setLocalDescription(offer);

    consumerTransport.onicecandidate = (e) => handleConsumerIceCandidate(e, peer.id, consumerId);

    consumerTransport.ontrack = (e) => {
      console.log(`Remote track received: ${e.streams[0]}`);
      handleRemoteTrack(e.streams[0], peer.username, consumerId);
    };

    return consumerTransport;
  };

  const handleConsumerIceCandidate = (e, id, consumerId) => {
    const { candidate } = e;
    if (candidate && candidate.candidate && candidate.candidate.length > 0) {
      const payload = {
        type: 'consumer_ice',
        ice: candidate,
        uqid: id,
        consumerId,
      };
      connectionRef.current.send(JSON.stringify(payload));
    }
  };

  const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const recalculateLayout = () => {
    const videoContainer = document.querySelector('.videos-inner');
    const videoCount = videoContainer.querySelectorAll('.videoWrap').length;

    if (videoCount >= 3) {
      videoContainer.style.setProperty('--grow', '0');
    } else {
      videoContainer.style.setProperty('--grow', '1');
    }
  };

  const connect = async () => {
    if (!username) {
      alert('Please enter a username');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    handleRemoteTrack(stream, username, localUUID.current);
    localPeerRef.current = createPeer();
    stream.getTracks().forEach((track) => localPeerRef.current.addTrack(track, stream));
    await subscribe();
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
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

    peer.onicecandidate = (e) => handleIceCandidate(e);
    peer.onnegotiationneeded = () => handleNegotiation(peer);

    return peer;
  };

  const subscribe = async () => {
    await consumeAll();
  };

  const consumeAll = async () => {
    const payload = {
      type: 'getPeers',
      uqid: localUUID.current,
    };
    connectionRef.current.send(JSON.stringify(payload));
  };

  const handleNegotiation = async (peer) => {
    const offer = await localPeerRef.current.createOffer();
    await localPeerRef.current.setLocalDescription(offer);

    connectionRef.current.send(
      JSON.stringify({
        type: 'connect',
        sdp: localPeerRef.current.localDescription,
        uqid: localUUID.current,
        username: username,
      })
    );
  };

  const handleClose = () => {
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    clientsRef.current = new Map();
    consumersRef.current = new Map();
  };

  return (
    <div>
      <input
        type="text"
        id="username"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={connect} disabled={!isConnected}>
        Connect
      </button>
      <div id="remote_videos">
        <div className="videos-inner"></div>
      </div>
    </div>
  );
};

export default SimpleSFUClient;  