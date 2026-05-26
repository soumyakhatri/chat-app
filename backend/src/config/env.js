require('dotenv').config();

const port = Number(process.env.PORT) || 3001;

const env = {
  port,
  serverId: process.env.SERVER_ID || `server-${port}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat-app',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

module.exports = env;