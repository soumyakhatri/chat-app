const { verifyToken } = require('../../utils/jwt');

function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token || typeof token !== 'string') {
    return next(new Error('Authentication required'));
  }

  try {
    const auth = verifyToken(token);
    socket.data.userId = auth.userId;
    socket.data.displayName = auth.displayName;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

module.exports = { socketAuthMiddleware };
