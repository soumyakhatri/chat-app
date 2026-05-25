const express = require('express');
const env = require('../config/env');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    serverId: env.serverId,
    port: env.port,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
