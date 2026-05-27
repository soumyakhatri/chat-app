const { createClient } = require('redis');
const env = require('../config/env');

let publisher = null;
let subscriber = null;

async function connectRedis() {
  publisher = createClient({ url: env.redisUrl });
  subscriber = createClient({ url: env.redisUrl });

  publisher.on('error', (err) => {
    console.error('Redis publisher error:', err.message);
  });

  subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err.message);
  });

  await publisher.connect();
  await subscriber.connect();

  console.log(`[${env.serverId}] Redis connected`);
}

function getPublisher() {
  if (!publisher) {
    throw new Error('Redis publisher is not connected');
  }
  return publisher;
}

function getSubscriber() {
  if (!subscriber) {
    throw new Error('Redis subscriber is not connected');
  }
  return subscriber;
}

function isRedisReady() {
  return Boolean(publisher?.isOpen && subscriber?.isOpen);
}

module.exports = {
  connectRedis,
  getPublisher,
  getSubscriber,
  isRedisReady,
};
