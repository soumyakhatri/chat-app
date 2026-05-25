const mongoose = require('mongoose');
const { Conversation } = require('../models');

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

module.exports = {
  getRoomName,
  formatConversation,
  isMember,
  findOrCreateDirectConversation,
  findDirectConversation,
  findConversationById,
  createGroup,
};
