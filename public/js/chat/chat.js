import { initializeSocketEvents } from './socketEvents.js';
import { handleRoomList } from './eventHandlers.js';

let current_roomId = null;
let current_participants = null;
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
// let userId = null;
const userId = Number(document.getElementById('userId').innerText);
const blockIds = JSON.parse(document.getElementById('blockIds').innerText);

// socket.io 라이브러리로 서버와 연결
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  auth: {
    token: token,
  },
});

initializeSocketEvents(socket);

// HTML 로드되면 서버에 room-list 이벤트를 보내서 방 목록을 요청
document.addEventListener('DOMContentLoaded', async function () {
  const rooms = await socket.emitWithAck('room-list');
  handleRoomList(rooms);
  if (current_roomId !== null) socket.emit('room-detail', current_roomId);
});

window.socket = socket;
window.current_participants = current_participants;
window.current_roomId = current_roomId;
window.userId = userId;
window.blockIds = blockIds;
