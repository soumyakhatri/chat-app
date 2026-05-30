const { Server } = require('socket.io');
const { socketAuthMiddleware } = require('./middleware/auth.middleware');
const registerUserHandlers = require('./handlers/user.handler');
const registerDirectMessageHandlers = require('./handlers/directMessage.handler');
const registerGroupMessageHandlers = require('./handlers/groupMessage.handler');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(
      `Socket connected: ${socket.id} (user: ${socket.data.userId})`
    );

    registerUserHandlers(socket);
    registerDirectMessageHandlers(io, socket);
    registerGroupMessageHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { at: new Date().toISOString() });
    });
  });

  return io;
}

module.exports = { initSocket };
