let current_roomId = null;
let current_participants = null;
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
let userId = null;

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
  console.log('room-list: ', rooms);
  handleRoomList(rooms);
});
socket.on('room-detail', (roomDetail) => {
  console.log('room-detail: ', roomDetail);
  console.log('room-detail.participants: ', roomDetail.participants);
  handleRoomDetail(roomDetail);
});
socket.on('room-join', (participantData) => {
  handleRoomJoin(participantData);
});
socket.on('room-leave', (userData) => {
  handleRoomLeave(userData);
});
socket.on('room-kick', ({ roomId, targetId }) => {
  handleRoomKick(roomId, targetId);
});
socket.on('room-ban', ({ roomId, targetId }) => {
  handleRoomBan(roomId, targetId);
});
socket.on('add-admin', ({ roomId, targetId }) => {
  handleAddAdmin(roomId, targetId);
});
socket.on('remove-admin', ({ roomId, targetId }) => {
  handleRemoveAdmin(roomId, targetId);
});
socket.on('room-message', ({ text, roomId, senderId }) => {
  handleReceiveRoomMessage(text, senderId);
});
socket.on('exception', ({ status, message }) => {
  // 권한이 없다 등의 메시지
  // jwt 토큰이 유효하지 않거나, 만료되었을 때도 이벤트가 발생
  // 401: Unauthorized, JWT 만료같은 로그인이 필요한 경우 서버에서 소켓 연결을 끊도록 해둠
  if (status === 401) {
    alert('로그인이 필요합니다.');
    window.location.href = '/login';
    return;
  }
  alert(message);
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
  roomMessage.value = '';
  roomMessage.focus();
}

// DM 을 보낼 시
function sendDirectMessage() {
  const directMessage = document.getElementById('direct-message');
  const receiver = document.getElementById('receiver');
  socket.emit('direct-message', {
    text: directMessage.value,
    receiverId: receiver.value,
  });
  directMessage.value = '';
}

// room-list 이벤트를 받으면
function handleRoomList(rooms) {
  const roomList = document.getElementById('roomList');
  roomList.innerHTML = '';

  rooms.forEach((room) => {
    const roomElement = document.createElement('li');
    const span = document.createElement('span');
    span.classList.add('room');
    span.appendChild(
      document.createTextNode(
        room.title +
          ' (Owned by: ' +
          room.owner.nickName +
          ') - ' +
          room.headCount,
      ),
    );
    roomElement.appendChild(span);

    const joinButton = document.createElement('button');
    joinButton.innerText = 'Join Room';
    joinButton.onclick = function () {
      if (current_roomId !== null) {
        socket.emit('room-leave', { roomId: current_roomId });
      }
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

// room-join 이벤트를 받으면
function handleRoomJoin(participantData) {
  userId = Number(document.getElementById('userId').innerText);
  if (userId === participantData.id) return;

  const participants = document.getElementById('participants');
  participants.appendChild(buildParticipant(participantData));
  current_participants.push(participantData);
}

// room-leave 이벤트를 받으면
function handleRoomLeave(userData) {
  current_participants = current_participants.filter(
    (participant) => participant.id !== userData.id,
  );

  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  for (const participant of current_participants) {
    console.log('participant: ', participant);
    participants.appendChild(buildParticipant(participant));
  }
}

// room-detail 이벤트를 받으면
function handleRoomDetail(roomDetail) {
  const roomTitle = document.getElementById('roomTitle');
  const participants = document.getElementById('participants');
  const span_roomId = document.getElementById('roomId');

  current_participants = roomDetail.participants;
  roomTitle.innerText = roomDetail.title;
  current_roomId = roomDetail.id;

  span_roomId.innerText = current_roomId;
  participants.innerHTML = '';

  for (const participant of roomDetail.participants) {
    console.log('participant: ', participant);
    participants.appendChild(buildParticipant(participant));
  }
}
function handleRoomKick(roomId, targetId) {
  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  if (userId === targetId) {
    participants.innerHTML = '';
    const span_roomId = document.getElementById('roomId');
    span_roomId.innerText = 'Kicked';
    current_roomId = null;
    alert('강퇴당했습니다.');
    return;
  }
  current_participants = current_participants.filter((id) => id !== targetId);
  for (const participant of current_participants) {
    console.log('participant: ', participant);
    participants.appendChild(buildParticipant(participant));
  }
}

function handleRoomBan(roomId, targetId) {
  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  if (userId === targetId) {
    participants.innerHTML = '';
    const span_roomId = document.getElementById('roomId');
    span_roomId.innerText = 'Banned';
    current_roomId = null;
    alert('밴당했습니다.');
    return;
  }
  current_participants = current_participants.filter((id) => id !== targetId);
  for (const participant of current_participants) {
    console.log('participant: ', participant);
    participants.appendChild(buildParticipant(participant));
  }
}

function handleAddAdmin(roomId, targetId) {
  current_participants = current_participants.map((participant) => {
    if (participant.id === targetId) {
      participant.grade = 1;
    }
    return participant;
  });
  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  for (const participant of current_participants) {
    participants.appendChild(buildParticipant(participant));
  }
}

function handleRemoveAdmin(roomId, targetId) {
  current_participants = current_participants.map((participant) => {
    if (participant.id === targetId) {
      participant.grade = 0;
    }
    return participant;
  });
  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  for (const participant of current_participants) {
    participants.appendChild(buildParticipant(participant));
  }
}

// room-message 이벤트를 받으면
function handleReceiveRoomMessage(text, senderId) {
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(buildNewMessage(text, senderId));
}

// direct-message 이벤트를 받으면
function handleReceiveDirectMessage(text, receiverId, senderId) {
  const directMessages = document.getElementById('directMessages');
  directMessages.appendChild(buildNewMessage(text, senderId));
}

// 메시지를 생성하는 함수
function buildNewMessage(text, senderId) {
  const li = document.createElement('li');
  li.classList.add('message');
  li.appendChild(document.createTextNode(senderId + ': ' + text));
  return li;
}

// 참여자를 생성하는 함수
function buildParticipant(participant) {
  const li = document.createElement('li');
  const span = document.createElement('span');

  let text = participant.id + ': ' + participant.nickName;
  if (participant.grade !== 0) text += ' (관리자)';

  span.classList.add('participant');
  span.appendChild(document.createTextNode(text));
  li.appendChild(span);

  const kickButton = document.createElement('button');
  kickButton.appendChild(document.createTextNode('Kick'));
  kickButton.onclick = () => {
    socket.emit('room-kick', {
      roomId: current_roomId,
      targetId: participant.id,
    });
  };
  const banButton = document.createElement('button');
  banButton.appendChild(document.createTextNode('Ban'));
  banButton.onclick = () => {
    socket.emit('room-ban', {
      roomId: current_roomId,
      targetId: participant.id,
    });
  };

  li.appendChild(kickButton);
  li.appendChild(banButton);
  return li;
}
