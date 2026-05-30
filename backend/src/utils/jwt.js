const jwt = require('jsonwebtoken');
const env = require('../config/env');

function verifyToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  return {
    userId: payload.userId,
    displayName: payload.displayName || '',
  };
}

module.exports = { verifyToken };
