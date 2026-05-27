const express = require('express');
const env = require('../config/env');
const { isRedisReady } = require('../redis/client');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    serverId: env.serverId,
    port: env.port,
    redis: isRedisReady() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
