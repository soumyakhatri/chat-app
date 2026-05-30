const mongoose = require('mongoose');
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

async function getLastMessagesForConversations(conversationIds) {
  if (!conversationIds.length) {
    return new Map();
  }

  const objectIds = conversationIds.map((id) => new mongoose.Types.ObjectId(id));

  const rows = await Message.aggregate([
    { $match: { conversationId: { $in: objectIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        id: { $first: '$_id' },
        content: { $first: '$content' },
        senderId: { $first: '$senderId' },
        createdAt: { $first: '$createdAt' },
      },
    },
  ]);

  const map = new Map();
  for (const row of rows) {
    const conversationId = row._id.toString();
    map.set(
      conversationId,
      formatMessage({
        _id: row.id,
        conversationId: row._id,
        senderId: row.senderId,
        content: row.content,
        createdAt: row.createdAt,
      })
    );
  }

  return map;
}

async function getUnreadCountsForUser(userId, conversations) {
  const counts = new Map();

  await Promise.all(
    conversations.map(async (conversation) => {
      const id = conversation._id.toString();
      const readEntry = (conversation.readState || []).find((row) => row.userId === userId);
      const since = readEntry?.lastReadAt || new Date(0);

      const count = await Message.countDocuments({
        conversationId: conversation._id,
        senderId: { $ne: userId },
        createdAt: { $gt: since },
      });

      counts.set(id, count);
    })
  );

  return counts;
}

module.exports = {
  createMessage,
  getConversationHistory,
  getLastMessagesForConversations,
  getUnreadCountsForUser,
  formatMessage,
};
