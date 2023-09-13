import { io } from './socket.io-client';

const socket = io.connect('http://localhost:3000'); // Replace with your server URL

const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesDiv = document.getElementById('messages');

socket.on('connect', () => {
  console.log('Connected to the server.');
});

socket.on('message', (message) => {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messagesDiv.appendChild(messageDiv);
});

socket.on('kicked', (reason) => {
  alert(`You've been kicked! Reason: ${reason}`);
  socket.disconnect();
});

socket.on('banned', (reason) => {
  alert(`You've been banned! Reason: ${reason}`);
  socket.disconnect();
});

sendBtn.addEventListener('click', () => {
  console.log('CLICK!!');
  socket.emit('message', messageInput.value);
  messageInput.value = '';
});
