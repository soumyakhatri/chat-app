const { Message } = require('../models');

async function createMessage({ conversationId, senderId, content }) {
  return Message.create({ conversationId, senderId, content });
}

async function getConversationHistory(conversationId, limit = 50) {
  return Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

function formatMessage(message) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt,
  };
}

module.exports = {
  createMessage,
  getConversationHistory,
  formatMessage,
};
