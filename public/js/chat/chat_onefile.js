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
socket.on('room-invite', (simpleRoomDto) => {
  console.log('simpleRoomDto: ', simpleRoomDto);
  handleRoomInvited(simpleRoomDto);
});
socket.on('room-mute', ({ roomId, targetId }) => {
  handleRoomMute(roomId, targetId);
});
socket.on('room-unmute', ({ roomId, targetId }) => {
  handleRoomUnMute(roomId, targetId);
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
socket.on('room-message', (message) => {
  handleReceiveRoomMessage(message);
});
socket.on('user-list', (connectedUsers) => {
  handleConnectedUsers(connectedUsers);
});
socket.on('message-load', (messages) => {
  handleDirectMessageLoad(messages);
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

socket.on('direct-message', (message) => {
  handleReceiveDirectMessage(message);
});

// HTML 로드되면 서버에 room-list 이벤트를 보내서 방 목록을 요청
document.addEventListener('DOMContentLoaded', function () {
  socket.emit('room-list');
  if (current_roomId !== null) socket.emit('room-detail', current_roomId);
});

// 방 생성 버튼 클릭 시
function createRoom() {
  const input_title = document.getElementById('input_title');
  const radio_public = document.getElementById('public');
  const radio_private = document.getElementById('private');
  const input_password = document.getElementById('input_password');

  const title = input_title.value;
  const mode = radio_public.checked
    ? 'PUBLIC'
    : radio_private.checked
    ? 'PRIVATE'
    : 'PROTECTED';
  const password = input_password.value;

  socket.emit('room-create', { title: title, mode: mode, password: password });
}

function inviteUser() {
  const input_inviteId = document.getElementById('input_inviteId');
  socket.emit('room-invite', {
    roomId: current_roomId,
    targetId: Number(input_inviteId.value),
  });
  input_inviteId.value = '';
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
    if (room.mode === 'PROTECTED') {
      const input_password = document.createElement('input');
      input_password.type = 'password';
      input_password.placeholder = 'Password';
      input_password.id = 'input_password' + room.id;
      roomElement.appendChild(input_password);
    }

    const joinButton = document.createElement('button');
    joinButton.innerText = 'Join Room';
    joinButton.onclick = function () {
      if (current_roomId !== null) {
        alert('다른 방에 참여하려면 먼저 방을 나가주세요.');
        return;
      }
      if (room.mode === 'PROTECTED') {
        const input_password = document.getElementById(
          'input_password' + room.id,
        );
        socket.emit('room-join', {
          roomId: room.id,
          password: input_password.value,
        });
        input_password.value = '';
      } else socket.emit('room-join', { roomId: room.id });
    };

    const leaveButton = document.createElement('button');
    leaveButton.innerText = 'Leave Room';
    leaveButton.onclick = function () {
      socket.emit('room-leave', { roomId: room.id });
      current_roomId = null;
      const span_roomId = document.getElementById('roomId');
      span_roomId.innerText = current_roomId;

      const roomTitle = document.getElementById('roomTitle');
      roomTitle.innerText = '';
      const participants = document.getElementById('participants');
      participants.innerHTML = '';
    };

    roomElement.appendChild(joinButton);
    roomElement.appendChild(leaveButton);
    roomList.appendChild(roomElement);
  });
}

// room-join 이벤트를 받으면
function handleRoomJoin(participantData) {
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: participantData.id + '님이 방에 참가했습니다.',
    }),
  );

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
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: userData.id + '님이 방을 떠났습니다.',
    }),
  );
}

function handleRoomMute(roomId, targetId) {
  current_participants = current_participants.map((participant) => {
    if (participant.id === targetId) {
      participant.mute = true;
    }
    return participant;
  });
  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  for (const participant of current_participants) {
    participants.appendChild(buildParticipant(participant));
  }
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: targetId + '님이 채팅금지 당했습니다.',
    }),
  );
}

function handleRoomUnMute(roomId, targetId) {
  current_participants = current_participants.map((participant) => {
    if (participant.id === targetId) {
      participant.mute = false;
    }
    return participant;
  });
  const participants = document.getElementById('participants');
  participants.innerHTML = '';
  for (const participant of current_participants) {
    participants.appendChild(buildParticipant(participant));
  }
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: targetId + '님의 채팅금지가 해제되었습니다.',
    }),
  );
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

function handleRoomInvited(simpleRoomDto) {
  if (current_roomId !== null) {
    alert('초대장이 도착했지만, 방에 입장해 있어 무시됩니다.');
    return;
  }
  const message =
    simpleRoomDto.owner.nickName +
    '님으로부터 초대장이 도착했습니다.' +
    '\n' +
    '방 제목: ' +
    simpleRoomDto.title +
    '\n' +
    '참여인원: : ' +
    simpleRoomDto.headCount;
  const acceptTF = confirm(message);
  if (acceptTF) socket.emit('room-join', { roomId: simpleRoomDto.id });
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
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: targetId + '님이 관리자가 되었습니다.',
    }),
  );
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
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: targetId + '님의 관리자 권한이 해제되었습니다.',
    }),
  );
}

// room-message 이벤트를 받으면
function handleReceiveRoomMessage(message) {
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(buildNewMessage(message));
}

function handleConnectedUsers(connectedUsers) {
  const userList = document.getElementById('connected-users');
  userList.innerHTML = '';
  for (const connectedUser of connectedUsers) {
    userList.appendChild(buildConnectedUser(connectedUser));
  }
}

function handleDirectMessageLoad(messages) {
  const directMessages = document.getElementById('directMessages');
  directMessages.innerHTML = '';
  console.log('messages: ', messages);
  for (const message of messages) {
    console.log('message: ', message);
    directMessages.appendChild(buildNewMessage(message));
  }
}

// direct-message 이벤트를 받으면
function handleReceiveDirectMessage(message) {
  const directMessages = document.getElementById('directMessages');
  directMessages.appendChild(buildNewMessage(message));
}

function buildNewMessage(message) {
  const li = document.createElement('li');
  li.classList.add('message');
  li.appendChild(
    document.createTextNode(message.senderId + ': ' + message.text),
  );
  return li;
}

function buildConnectedUser(connectedUser) {
  const li = document.createElement('li');
  li.appendChild(document.createTextNode(connectedUser.nickName));
  const dmButton = document.createElement('button');
  dmButton.appendChild(document.createTextNode('DM'));
  dmButton.onclick = () => {
    socket.emit('message-load', {
      targetId: connectedUser.id,
    });
  };
  const blockButton = document.createElement('button');
  blockButton.appendChild(document.createTextNode('Block'));
  blockButton.onclick = () => {
    socket.emit('user-block', {
      targetId: connectedUser.id,
    });
  };

  li.appendChild(dmButton);
  li.appendChild(blockButton);
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

  const muteButton = document.createElement('button');
  if (participant.mute === false) {
    muteButton.appendChild(document.createTextNode('Mute'));
    muteButton.onclick = () => {
      socket.emit('room-mute', {
        roomId: current_roomId,
        targetId: participant.id,
      });
    };
  } else {
    muteButton.appendChild(document.createTextNode('Unmute'));
    muteButton.onclick = () => {
      socket.emit('room-unmute', {
        roomId: current_roomId,
        targetId: participant.id,
      });
    };
  }
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
  const adminButton = document.createElement('button');
  if (participant.grade === 0) {
    adminButton.appendChild(document.createTextNode('Add Admin'));
    adminButton.onclick = () => {
      socket.emit('add-admin', {
        roomId: current_roomId,
        targetId: participant.id,
      });
    };
  } else {
    adminButton.appendChild(document.createTextNode('Remove Admin'));
    adminButton.onclick = () => {
      socket.emit('remove-admin', {
        roomId: current_roomId,
        targetId: participant.id,
      });
    };
  }

  li.appendChild(muteButton);
  li.appendChild(kickButton);
  li.appendChild(banButton);
  li.appendChild(adminButton);
  return li;
}
