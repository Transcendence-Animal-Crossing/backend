import {
  buildNewMessage,
  buildConnectedUser,
  buildParticipant,
} from './build.js';

// room-list 이벤트를 받으면
export function handleRoomList(rooms) {
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
    joinButton.onclick = async function () {
      if (current_roomId !== null) {
        alert('다른 방에 참여하려면 먼저 방을 나가주세요.');
        return;
      }
      if (room.mode === 'PROTECTED') {
        const input_password = document.getElementById(
          'input_password' + room.id,
        );
        const roomDetail = await socket.emitWithAck('room-join', {
          roomId: room.id,
          password: input_password.value,
        });
        console.log('roomDetail', roomDetail);
        handleRoomDetail(roomDetail.body);
        input_password.value = '';
      } else {
        const roomDetail = await socket.emitWithAck('room-join', {
          roomId: room.id,
        });
        console.log('roomDetail', roomDetail);
        handleRoomDetail(roomDetail.body);
      }
    };

    const leaveButton = document.createElement('button');
    leaveButton.innerText = 'Leave Room';
    leaveButton.onclick = function () {
      socket.emitWithAck('room-leave', { roomId: room.id });
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

export async function submitRoomDetail() {
  const roomDetailDto = await socket.emitWithAck('room-detail', {
    roomId: current_roomId,
  });
  console.log('roomDetail', roomDetailDto);
  handleRoomDetail(roomDetailDto.body);
}

// room-join 이벤트를 받으면
export function handleRoomJoin(participantData) {
  userId = Number(document.getElementById('userId').innerText);
  if (userId === participantData.id) return;

  const participants = document.getElementById('participants');
  participants.appendChild(buildParticipant(participantData));
  current_participants.push(participantData);

  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(
    buildNewMessage({
      senderId: 'System',
      text: participantData.id + '님이 방에 참가했습니다.',
    }),
  );
}

// room-leave 이벤트를 받으면
export function handleRoomLeave(userData) {
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

export function handleRoomMute(roomId, targetId) {
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

export function handleRoomUnMute(roomId, targetId) {
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
export function handleRoomDetail(roomDetail) {
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
export function handleRoomKick(roomId, targetId) {
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

export async function handleRoomInvited(simpleRoomDto) {
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
  if (acceptTF) {
    const roomDetail = await socket.emitWithAck('room-join', {
      roomId: simpleRoomDto.id,
    });
    console.log('roomDetail', roomDetail);
    handleRoomDetail(roomDetail.body);
  }
}

export function handleRoomBan(roomId, targetId) {
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

export function handleAddAdmin(roomId, targetId) {
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

export function handleRemoveAdmin(roomId, targetId) {
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
export function handleReceiveRoomMessage(message) {
  const roomMessages = document.getElementById('roomMessages');
  roomMessages.appendChild(buildNewMessage(message));
}

export function handleConnectedUsers(connectedUsers) {
  const userList = document.getElementById('connected-users');
  userList.innerHTML = '';
  for (const connectedUser of connectedUsers) {
    userList.appendChild(buildConnectedUser(connectedUser));
  }
}

export function handleDirectMessageLoad(messages) {
  const directMessages = document.getElementById('directMessages');
  directMessages.innerHTML = '';
  console.log('messages: ', messages);
  for (const message of messages) {
    console.log('message: ', message);
    directMessages.appendChild(buildNewMessage(message));
  }
}

// direct-message 이벤트를 받으면
export function handleReceiveDirectMessage(message) {
  const directMessages = document.getElementById('directMessages');
  directMessages.appendChild(buildNewMessage(message));
}

export function handleException(status, message) {
  // 권한이 없다 등의 메시지
  // jwt 토큰이 유효하지 않거나, 만료되었을 때도 이벤트가 발생
  // 401: Unauthorized, JWT 만료같은 로그인이 필요한 경우 서버에서 소켓 연결을 끊도록 해둠
  if (status === 401) {
    alert('로그인이 필요합니다.');
    window.location.href = '/login';
    return;
  }
  alert(message);
}
