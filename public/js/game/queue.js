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

socket.on('game-matched', (body) => {
  console.log('game-matched');
  const time = new Date().getMinutes() + ':' + new Date().getSeconds();
  const newElement = document.createElement('div');
  newElement.innerText = 'game-matched' + JSON.stringify(body) + ' ' + time;
  responseElement.appendChild(newElement);
});

export async function joinQueue() {
  const radio_classic = document.getElementById('type_classic');
  const radio_rank = document.getElementById('type_rank');

  const game_type = radio_classic.checked
    ? 'CLASSIC'
    : radio_rank.checked
    ? 'RANK'
    : 'SPECIAL';

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

window.joinQueue = joinQueue;
window.leaveQueue = leaveQueue;
