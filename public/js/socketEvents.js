// socketEvents.js
import {
  handleRoomList,
  handleRoomDetail,
  handleRoomJoin,
  handleRoomLeave,
  handleRoomMute,
  handleRoomUnMute,
  handleRoomKick,
  handleRoomBan,
  handleAddAdmin,
  handleRemoveAdmin,
  handleReceiveRoomMessage,
  handleConnectedUsers,
  handleDirectMessageLoad,
  handleReceiveDirectMessage,
  handleException,
} from './eventHandlers.js';

export function initializeSocketEvents(socket) {
  socket.on('room-list', (rooms) => {
    console.log('room-list: ', rooms);
    handleRoomList(rooms);
  });

  socket.on('room-detail', (roomDetail) => {
    console.log('room-detail: ', roomDetail);
    handleRoomDetail(roomDetail);
  });

  socket.on('room-join', (participantData) => {
    handleRoomJoin(participantData);
  });

  socket.on('room-leave', (userData) => {
    handleRoomLeave(userData);
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

  socket.on('direct-message', (message) => {
    handleReceiveDirectMessage(message);
  });

  socket.on('exception', ({ status, message }) => {
    handleException(status, message);
  });
}
