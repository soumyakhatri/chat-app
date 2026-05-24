const onlineUsers = new Map();

function register(userId, socket) {
  onlineUsers.set(userId, socket.id);
  socket.data.userId = userId;
}

function unregister(userId, socketId) {
  if (onlineUsers.get(userId) === socketId) {
    onlineUsers.delete(userId);
  }
}

function getSocketId(userId) {
  return onlineUsers.get(userId);
}

module.exports = {
  register,
  unregister,
  getSocketId,
};
