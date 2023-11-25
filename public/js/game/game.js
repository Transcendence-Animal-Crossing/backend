const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const responseElement = document.getElementById('response');

const socket = io('http://localhost:8080/game', {
  transports: ['websocket'],
  auth: {
    token: token,
  },
});

socket.on('connect', async () => {
  const newElement = document.createElement('div');
  newElement.innerText = 'game socket connected';
  responseElement.appendChild(newElement);
});

socket.on('disconnect', () => {
  const newElement = document.createElement('div');
  newElement.innerText = 'game socket disconnected';
  responseElement.appendChild(newElement);
});

socket.on('game-started', (body) => {
  console.log('game-started');
  const time = new Date().getMinutes() + ':' + new Date().getSeconds();
  const newElement = document.createElement('div');
  newElement.innerText = 'game-started' + JSON.stringify(body) + ' ' + time;
  responseElement.appendChild(newElement);
});

export async function getGameInfo() {
  const response = await socket.emitWithAck('game-info');
  const newElement = document.createElement('div');
  newElement.innerText = 'game-info: ' + JSON.stringify(response);
  responseElement.appendChild(newElement);
}

export async function gameReady() {
  const response = await socket.emitWithAck('game-ready');
  const newElement = document.createElement('div');
  newElement.innerText = 'game-ready: ' + JSON.stringify(response);
  responseElement.appendChild(newElement);
}

let arrow_down = false;
let arrow_up = false;
let arrow_left = false;
let arrow_right = false;

// listen keyboard event
document.addEventListener('keydown', (event) => {
  if (!event.key.startsWith('Arrow')) return;
  if (event.key === 'ArrowDown') {
    if (arrow_down) return;
    arrow_down = true;
    const newElement = document.createElement('div');
    newElement.innerText = 'keydown: ' + event.key;
    responseElement.appendChild(newElement);
    socket.emit('game-key-press', { key: 'down' });
  }
  if (event.key === 'ArrowUp') {
    if (arrow_up) return;
    arrow_up = true;
    const newElement = document.createElement('div');
    newElement.innerText = 'keydown: ' + event.key;
    responseElement.appendChild(newElement);
    socket.emit('game-key-press', { key: 'up' });
  }
  if (event.key === 'ArrowLeft') {
    if (arrow_left) return;
    arrow_left = true;
    const newElement = document.createElement('div');
    newElement.innerText = 'keydown: ' + event.key;
    responseElement.appendChild(newElement);
    socket.emit('game-key-press', { key: 'left' });
  }
  if (event.key === 'ArrowRight') {
    if (arrow_right) return;
    arrow_right = true;
    const newElement = document.createElement('div');
    newElement.innerText = 'keydown: ' + event.key;
    responseElement.appendChild(newElement);
    socket.emit('game-key-press', { key: 'right' });
  }
});

document.addEventListener('keyup', (event) => {
  if (!event.key.startsWith('Arrow')) return;
  if (event.key === 'ArrowDown') {
    arrow_down = false;
    socket.emit('game-key-release', { key: 'down' });
  }
  if (event.key === 'ArrowUp') {
    arrow_up = false;
    socket.emit('game-key-release', { key: 'up' });
  }
  if (event.key === 'ArrowLeft') {
    arrow_left = false;
    socket.emit('game-key-release', { key: 'left' });
  }
  if (event.key === 'ArrowRight') {
    arrow_right = false;
    socket.emit('game-key-release', { key: 'right' });
  }
  const newElement = document.createElement('div');
  newElement.innerText = 'keyup: ' + event.key;
  responseElement.appendChild(newElement);
});

window.getGameInfo = getGameInfo;
window.gameReady = gameReady;
