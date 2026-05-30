const { publishChatEvent } = require('../../redis/pubsub');
const userRegistry = require('../userRegistry');
const {
  findOrCreateDirectConversation,
  findDirectConversation,
  findConversationById,
  isMember,
} = require('../../services/conversation.service');
const {
  createMessage,
  getConversationHistory,
  formatMessage,
} = require('../../services/message.service');

function registerDirectMessageHandlers(io, socket) {
  socket.on('message:direct', async ({ toUserId, content }) => {
    try {
      const senderId = socket.data.userId;

      if (!senderId) {
        socket.emit('message:error', { error: 'Not authenticated' });
        return;
      }

      if (!toUserId || typeof toUserId !== 'string' || !toUserId.trim()) {
        socket.emit('message:error', { error: 'toUserId is required' });
        return;
      }

      const recipientId = toUserId.trim();

      if (recipientId === senderId) {
        socket.emit('message:error', { error: 'Cannot send a message to yourself' });
        return;
      }

      if (!content || typeof content !== 'string' || !content.trim()) {
        socket.emit('message:error', { error: 'content is required' });
        return;
      }

      const conversation = await findOrCreateDirectConversation(senderId, recipientId);
      const message = await createMessage({
        conversationId: conversation._id,
        senderId,
        content: content.trim(),
      });

      const payload = { message: formatMessage(message) };

      // send message to the sender
      // Sender always gets confirmation
      socket.emit('message:new', payload);

      // Recipient if online on THIS instance
      const recipientSocketId = userRegistry.getSocketId(recipientId);
      // send message to the recipient

      // if the recipient is online on THIS instance, send the message to them
      // recipient is online means they are connected to this server instance
      // works if the recipient is on the same server instance
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:new', payload);
      }
      // if the recipient is not online on THIS instance, publish the message to the Redis channel
      // recipient is not online means they are not connected to this server instance or on a different server instance
      // works if the recipient is on a different server instance
      await publishChatEvent({
        type: 'message:new',
        target: { kind: 'user', userId: recipientId },
        payload,
      });
    } catch (err) {
      socket.emit('message:error', { error: err.message });
    }
  });

  socket.on('message:history', async ({ otherUserId, conversationId }) => {
    try {
      const senderId = socket.data.userId;

      if (!senderId) {
        socket.emit('message:error', { error: 'Not authenticated' });
        return;
      }

      let conversation;

      if (conversationId) {
        conversation = await findConversationById(conversationId);

        if (!conversation || !isMember(conversation, senderId)) {
          socket.emit('message:error', { error: 'Conversation not found' });
          return;
        }
      } else if (otherUserId && typeof otherUserId === 'string' && otherUserId.trim()) {
        conversation = await findDirectConversation(senderId, otherUserId.trim());
      } else {
        socket.emit('message:error', { error: 'otherUserId or conversationId is required' });
        return;
      }

      if (!conversation) {
        socket.emit('message:history', { messages: [] });
        return;
      }

      const messages = await getConversationHistory(conversation._id);
      const formatted = messages.reverse().map(formatMessage);

      socket.emit('message:history', { messages: formatted });
    } catch (err) {
      socket.emit('message:error', { error: err.message });
    }
  });
}

module.exports = registerDirectMessageHandlers;
