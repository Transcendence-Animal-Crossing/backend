const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const responseElement = document.getElementById('response');

const socket = io('http://localhost:8080/queue', {
  transports: ['websocket'],
  auth: {
    token: token,
  },
});

socket.on('connect', async () => {
  const newElement = document.createElement('div');
  newElement.innerText = 'queue socket connected';
  responseElement.appendChild(newElement);
});

socket.on('disconnect', () => {
  const newElement = document.createElement('div');
  newElement.innerText = 'queue socket disconnected';
  responseElement.appendChild(newElement);
});

socket.on('queue-matched', (body) => {
  console.log('queue-matched');
  const time = new Date().getMinutes() + ':' + new Date().getSeconds();
  const newElement = document.createElement('div');
  newElement.innerText = 'queue-matched' + JSON.stringify(body) + ' ' + time;
  responseElement.appendChild(newElement);
});

export async function joinQueue() {
  const radio_classic = document.getElementById('type_classic');
  const radio_rank = document.getElementById('type_rank');
  const radio_special = document.getElementById('type_special');

  const game_type = radio_classic.checked
    ? radio_classic.value
    : radio_rank.checked
    ? radio_rank.value
    : radio_special.value;

  const response = await socket.emitWithAck('queue-join', {
    type: game_type,
  });
  const newElement = document.createElement('div');
  const time = new Date().getMinutes() + ':' + new Date().getSeconds();
  newElement.innerText = 'joinQueue' + JSON.stringify(response) + ' ' + time;

  responseElement.appendChild(newElement);
}

export async function leaveQueue() {
  const response = await socket.emitWithAck('queue-leave');
  const newElement = document.createElement('div');
  newElement.innerText = 'leaveQueue' + JSON.stringify(response);
  responseElement.appendChild(newElement);
}

export async function moveToGame() {
  window.location.href = '/game?token=' + token;
}

window.joinQueue = joinQueue;
window.leaveQueue = leaveQueue;
window.moveToGame = moveToGame;
