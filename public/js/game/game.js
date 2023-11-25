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

// listen keyboard event
document.addEventListener('keydown', (event) => {
  const newElement = document.createElement('div');
  newElement.innerText = 'keydown: ' + event.key;
  responseElement.appendChild(newElement);
});

document.addEventListener('keyup', (event) => {
  const newElement = document.createElement('div');
  newElement.innerText = 'keyup: ' + event.key;
  responseElement.appendChild(newElement);
});

window.getGameInfo = getGameInfo;
window.gameReady = gameReady;
