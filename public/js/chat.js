let current_roomId = null;
let current_participantIds = null;
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

console.log('token: ' + token);

// socket.io 라이브러리로 서버와 연결
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  auth: {
    token: token,
  },
});

// socket.on('[이벤트명]', [콜백함수])로 서버에서 발생한 이벤트를 받음
socket.on('room-list', (rooms) => {
  handleRoomList(rooms);
});
socket.on('room-participants', (participantIds) => {
  console.log('participantIds: ' + participantIds);
  current_participantIds = participantIds;
  handleParticipantsList(participantIds);
});
socket.on('room-message', ({ text, roomId, userId }) => {
  handleReceiveRoomMessage(text, userId);
});
socket.on('room-kick', ({ roomId, targetId }) => {
  handleRoomKick(roomId, targetId);
});

socket.on('direct-message', ({ text, receiverId, senderId }) => {
  console.log(text, receiverId, senderId);
  handleReceiveDirectMessage(text, receiverId, senderId);
});

// HTML 로드되면 서버에 room-list 이벤트를 보내서 방 목록을 요청
document.addEventListener('DOMContentLoaded', function () {
  socket.emit('room-list');
});

// 방 생성 버튼 클릭 시
function createRoom() {
  const input_title = document.getElementById('input_title');
  console.log('createRoom: ' + input_title.value);
  socket.emit('room-create', { title: input_title.value });
}

// 방 안에서 메시지를 보낼 시
function sendRoomMessage() {
  const roomMessage = document.getElementById('room-message');
  socket.emit('room-message', {
    text: roomMessage.value,
    roomId: current_roomId,
  });
}

// DM 을 보낼 시
function sendDirectMessage() {
  const directMessage = document.getElementById('direct-message');
  const receiver = document.getElementById('receiver');
  socket.emit('direct-message', {
    text: directMessage.value,
    receiverId: receiver.value,
  });
}

// room-list 이벤트를 받으면
function handleRoomList(rooms) {
  const roomList = document.getElementById('roomList');
  roomList.innerHTML = '';

  rooms.forEach((room) => {
    const roomElement = document.createElement('li');
    roomElement.innerHTML = `<strong>${room.name}</strong> (Owned by: ${room.ownerId}) - ${room.participantIds.length}`;

    const joinButton = document.createElement('button');
    joinButton.innerText = 'Join Room';
    joinButton.onclick = function () {
      socket.emit('room-leave', { roomId: room.id });
      socket.emit('room-join', { roomId: room.id });

      current_roomId = room.id;
      const span_roomId = document.getElementById('roomId');
      span_roomId.innerText = current_roomId;
    };

    const leaveButton = document.createElement('button');
    leaveButton.innerText = 'Leave Room';
    leaveButton.onclick = function () {
      socket.emit('room-leave', { roomId: room.id });
    };

    roomElement.appendChild(joinButton);
    roomElement.appendChild(leaveButton);
    roomList.appendChild(roomElement);
  });
}

// room-participants 이벤트를 받으면
function handleParticipantsList(participantIds) {
  participants.innerHTML = '';
  for (let i = 0; i < participantIds.length; i++) {
    console.log('participant: ' + participantIds[i]);
    participants.appendChild(buildParticipant(participantIds[i]));
  }
}
function handleRoomKick(roomId, targetId) {
  participants.innerHTML = '';
  console.log('targetId: ', targetId);
  console.log('userId: ', '{{userId}}');
  if ('{{userId}}' === targetId.toString()) {
    participants.innerHTML = '';
    const span_roomId = document.getElementById('roomId');
    span_roomId.innerText = 'Kicked';
    alert('강퇴당했습니다.');
    return;
  }
  current_participantIds = current_participantIds.filter(
    (id) => id !== targetId,
  );
  for (let i = 0; i < current_participantIds.length; i++) {
    console.log('current_participantIds: ' + current_participantIds[i]);
    participants.appendChild(buildParticipant(current_participantIds[i]));
  }
}

// room-message 이벤트를 받으면
function handleReceiveRoomMessage(text, userId) {
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(buildNewMessage(text, userId));
}

// direct-message 이벤트를 받으면
function handleReceiveDirectMessage(text, receiverId, senderId) {
  const directMessages = document.getElementById('directMessages');
  directMessages.appendChild(buildNewMessage(text, senderId));
}

// 메시지를 생성하는 함수
function buildNewMessage(text, userId) {
  const li = document.createElement('li');
  li.appendChild(document.createTextNode(userId + ': ' + text));
  return li;
}

// 참여자를 생성하는 함수
function buildParticipant(participantId) {
  const li = document.createElement('li');
  li.appendChild(document.createTextNode(participantId));

  const kickButton = document.createElement('button');
  kickButton.appendChild(document.createTextNode('Kick'));
  kickButton.onclick = () => {
    socket.emit('room-kick', {
      roomId: current_roomId,
      targetId: participantId,
    });
  };

  li.appendChild(kickButton);
  return li;
}
