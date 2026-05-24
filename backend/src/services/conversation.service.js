const { Conversation } = require('../models');

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

module.exports = {
  findOrCreateDirectConversation,
  findDirectConversation,
};
