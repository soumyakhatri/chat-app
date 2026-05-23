const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
});

module.exports = server;
