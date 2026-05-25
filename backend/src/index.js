const app = require('./app');
const env = require('./config/env');
const connectDB = require('./db/connect');
const { initSocket } = require('./socket');

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(
      `[${env.serverId}] running on port ${env.port} (${env.nodeEnv})`
    );
  });

  const io = initSocket(server);

  return { server, io };
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
