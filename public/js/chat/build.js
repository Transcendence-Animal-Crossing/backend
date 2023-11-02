// 방 생성 버튼 클릭 시
import { handleDirectMessageLoad } from './eventHandlers.js';

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

export function buildNewMessage(message) {
  const li = document.createElement('li');
  li.classList.add('message');
  li.appendChild(
    document.createTextNode(message.senderId + ': ' + message.text),
  );
  return li;
}

export function buildConnectedUser(connectedUser) {
  const li = document.createElement('li');
  li.appendChild(document.createTextNode(connectedUser.nickName));
  const dmButton = document.createElement('button');
  dmButton.appendChild(document.createTextNode('DM 불러오기'));
  dmButton.onclick = async () => {
    const loadedMessageDto = await socket.emitWithAck('load-message', {
      targetId: connectedUser.id,
    });
    handleDirectMessageLoad(loadedMessageDto.body);
    console.log(loadedMessageDto.body);
  };
  const blockButton = document.createElement('button');
  blockButton.appendChild(document.createTextNode('Block'));
  blockButton.onclick = () => {
    socket.emit('user-block', {
      targetId: connectedUser.id,
    });
    blockButton.disabled = true;
    unblockButton.disabled = false;
  };
  const unblockButton = document.createElement('button');
  unblockButton.disabled = true;
  unblockButton.appendChild(document.createTextNode('Unblock'));
  unblockButton.onclick = () => {
    socket.emit('user-unblock', {
      targetId: connectedUser.id,
    });
    unblockButton.disabled = true;
    blockButton.disabled = false;
  };

  if (blockIds.includes(connectedUser.id)) {
    blockButton.disabled = true;
    unblockButton.disabled = false;
  } else {
    blockButton.disabled = false;
    unblockButton.disabled = true;
  }

  li.appendChild(dmButton);
  li.appendChild(blockButton);
  li.appendChild(unblockButton);
  return li;
}

// 참여자를 생성하는 함수
export function buildParticipant(participant) {
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

window.createRoom = createRoom;
window.inviteUser = inviteUser;
window.sendRoomMessage = sendRoomMessage;
window.sendDirectMessage = sendDirectMessage;
window.buildNewMessage = buildNewMessage;
window.buildConnectedUser = buildConnectedUser;
window.buildParticipant = buildParticipant;
