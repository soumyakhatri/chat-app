const app = require('./app');
const env = require('./config/env');
const connectDB = require('./db/connect');
const { connectRedis } = require('./redis/client');
const { initPubSub, publishServerOnline } = require('./redis/pubsub');
const { initSocket } = require('./socket');

async function start() {
  await connectDB();
  await connectRedis();

  const server = app.listen(env.port, () => {
    console.log(
      `[${env.serverId}] running on port ${env.port} (${env.nodeEnv})`
    );
  });

  const io = initSocket(server);
  initPubSub(io);

  await publishServerOnline();

  return { server, io };
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
