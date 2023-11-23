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

export async function joinQueue() {
  const response = await socket.emitWithAck('queue-join', {
    type: 'CLASSIC',
  });
  const newElement = document.createElement('div');
  newElement.innerText = 'joinQueue' + JSON.stringify(response);
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
