const { User } = require('../../models');
const userRegistry = require('../userRegistry');

function registerUserHandlers(socket) {
  socket.on('user:register', async ({ userId, displayName }) => {
    try {
      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        // send error to the same client where the request was made
        socket.emit('user:error', { error: 'userId is required' });
        return;
      }

      const trimmedId = userId.trim();

      await User.findOneAndUpdate(
        { userId: trimmedId },
        {
          userId: trimmedId,
          displayName: typeof displayName === 'string' ? displayName.trim() : '',
        },
        { upsert: true, new: true }
      );

      userRegistry.register(trimmedId, socket);
      socket.emit('user:registered', { userId: trimmedId });
      console.log(`User registered: ${trimmedId} (${socket.id})`);
    } catch (err) {
      socket.emit('user:error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    if (socket.data.userId) {
      userRegistry.unregister(socket.data.userId, socket.id);
      console.log(`User offline: ${socket.data.userId}`);
    }
  });
}

module.exports = registerUserHandlers;
