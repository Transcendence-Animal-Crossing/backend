const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

const socket = io('http://localhost:8080/game', {
  transports: ['websocket'],
  auth: {
    token: token,
  },
});

socket.on('connect', () => {
  console.log('game socket connected');
});

socket.on('disconnect', () => {
  console.log('game socket disconnected');
});
