require('dotenv').config();

const port = Number(process.env.PORT) || 3001;

const env = {
  port,
  serverId: process.env.SERVER_ID || `server-${port}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat-app',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = env;