const env = require('../config/env');
const { getRoomName } = require('../services/conversation.service');
const userRegistry = require('../socket/userRegistry');
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

  if (event.type !== 'message:new') {
    console.log(
      `[${env.serverId}] Redis event from ${event.originServerId}:`,
      event.type
    );
    return;
  }

  deliverChatEvent(io, event);
}

function deliverChatEvent(io, event) {
  const { target, payload } = event;

  if (!target || !payload) {
    return;
  }

  if (target.kind === 'user') {
    // on every server instance the userRegistry will be different because it is a singleton and stores the socket ID for each user connected to this server instance
    const socketId = userRegistry.getSocketId(target.userId);
    // until here, all the server instances will receive the message

    // only send the message to the recipient if they are online on THIS instance and connected to this server instance
    if (socketId) {
      io.to(socketId).emit('message:new', payload);
    }
    return;
  }

  if (target.kind === 'room') {
    io.to(getRoomName(target.conversationId)).emit('message:new', payload);
  }
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
  deliverChatEvent,
};
