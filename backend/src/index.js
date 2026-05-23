const app = require('./app');
const env = require('./config/env');
const { initSocket } = require('./socket');

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});

const io = initSocket(server);

module.exports = { server, io };
