const userRegistry = require('../userRegistry');

function registerUserHandlers(socket) {
  const userId = socket.data.userId;

  if (!userId) {
    socket.emit('user:error', { error: 'Not authenticated' });
    socket.disconnect(true);
    return;
  }

  userRegistry.register(userId, socket);
  socket.emit('user:registered', { userId });
  console.log(`User online: ${userId} (${socket.id})`);

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      userRegistry.unregister(socket.data.userId, socket.id);
      console.log(`User offline: ${socket.data.userId}`);
    }
  });
}

module.exports = registerUserHandlers;
