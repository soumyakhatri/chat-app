const env = require('../config/env');
const { getPublisher, getSubscriber } = require('./client');

const CHAT_CHANNEL = 'chat:events';

async function publishChatEvent(event) {
  const publisher = getPublisher();
  const payload = JSON.stringify({
    ...event,
    originServerId: event.originServerId || env.serverId,
  });

  await publisher.publish(CHAT_CHANNEL, payload);
}

function handleChatEvent(io, rawMessage) {
  let event;

  try {
    event = JSON.parse(rawMessage);
  } catch {
    console.error(`[${env.serverId}] Invalid Redis message:`, rawMessage);
    return;
  }

  if (event.originServerId === env.serverId) {
    return;
  }

  console.log(
    `[${env.serverId}] Redis event from ${event.originServerId}:`,
    event.type
  );

  // Step 9: deliver to local sockets based on event.target
  void io;
  void event;
}

function initPubSub(io) {
  const subscriber = getSubscriber();

  // Simply subscribe to the Redis channel and handle the message when it arrives
  subscriber.subscribe(CHAT_CHANNEL, (message) => {
    // Handle the message when it arrives
    handleChatEvent(io, message);
  });

  console.log(`[${env.serverId}] Subscribed to Redis channel: ${CHAT_CHANNEL}`);
}

async function publishServerOnline() {
  await publishChatEvent({
    type: 'server:online',
    originServerId: env.serverId,
    payload: { port: env.port },
  });
}

module.exports = {
  CHAT_CHANNEL,
  publishChatEvent,
  initPubSub,
  publishServerOnline,
  handleChatEvent,
};
