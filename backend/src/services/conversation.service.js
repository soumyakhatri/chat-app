const mongoose = require('mongoose');
const { Conversation, User } = require('../models');
const { getLastMessagesForConversations, getUnreadCountsForUser } = require('./message.service');

function getRoomName(conversationId) {
  return `conv:${conversationId}`;
}

function formatConversation(conversation) {
  return {
    id: conversation._id.toString(),
    type: conversation.type,
    name: conversation.name,
    members: conversation.members,
  };
}

function isMember(conversation, userId) {
  return conversation.members.includes(userId);
}

async function findOrCreateDirectConversation(userIdA, userIdB) {
  const members = [userIdA, userIdB].sort();

  let conversation = await Conversation.findOne({ type: 'direct', members });

  if (!conversation) {
    conversation = await Conversation.create({ type: 'direct', members });
  }

  return conversation;
}

async function findDirectConversation(userIdA, userIdB) {
  const members = [userIdA, userIdB].sort();
  return Conversation.findOne({ type: 'direct', members });
}

async function findConversationById(conversationId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }
  return Conversation.findById(conversationId);
}

async function createGroup({ name, creatorId, memberIds }) {
  const members = [...new Set([creatorId, ...memberIds])];

  return Conversation.create({
    type: 'group',
    name,
    members,
  });
}

async function listConversationsForUser(userId) {
  const conversations = await Conversation.find({ members: userId })
    .sort({ updatedAt: -1 })
    .lean();

  if (!conversations.length) {
    return [];
  }

  const conversationIds = conversations.map((c) => c._id.toString());
  const lastMessages = await getLastMessagesForConversations(conversationIds);
  const unreadCounts = await getUnreadCountsForUser(userId, conversations);

  const otherUserIds = new Set();
  for (const conversation of conversations) {
    if (conversation.type === 'direct') {
      const otherUserId = conversation.members.find((member) => member !== userId);
      if (otherUserId) {
        otherUserIds.add(otherUserId);
      }
    }
  }

  const users = await User.find({ userId: { $in: [...otherUserIds] } }).lean();
  const displayNameByUserId = new Map(
    users.map((user) => [user.userId, user.displayName || user.userId])
  );

  const items = conversations.map((conversation) => {
    const id = conversation._id.toString();
    const lastMessage = lastMessages.get(id) || null;
    const item = {
      id,
      type: conversation.type,
      lastMessage,
      updatedAt: lastMessage?.createdAt || conversation.updatedAt,
      unreadCount: unreadCounts.get(id) || 0,
    };

    if (conversation.type === 'group') {
      item.name = conversation.name;
    } else {
      const otherUserId = conversation.members.find((member) => member !== userId);
      const displayName = displayNameByUserId.get(otherUserId) || otherUserId;
      item.otherUser = { userId: otherUserId, displayName };
      item.name = displayName;
    }

    return item;
  });

  items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return items;
}

function getLastReadAt(conversation, userId) {
  const entry = (conversation.readState || []).find((row) => row.userId === userId);
  return entry?.lastReadAt || null;
}

async function markConversationRead(userId, conversationId) {
  const conversation = await findConversationById(conversationId);

  if (!conversation || !isMember(conversation, userId)) {
    const err = new Error('Conversation not found');
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  const entry = conversation.readState.find((row) => row.userId === userId);

  if (entry) {
    entry.lastReadAt = now;
  } else {
    conversation.readState.push({ userId, lastReadAt: now });
  }

  await conversation.save();
  return { conversationId: conversation._id.toString(), lastReadAt: now };
}

module.exports = {
  getRoomName,
  formatConversation,
  isMember,
  getLastReadAt,
  findOrCreateDirectConversation,
  findDirectConversation,
  findConversationById,
  createGroup,
  listConversationsForUser,
  markConversationRead,
};
