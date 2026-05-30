const {
  listConversationsForUser,
  markConversationRead,
} = require('../services/conversation.service');

function sendError(res, err) {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message });
}

async function list(req, res) {
  try {
    const conversations = await listConversationsForUser(req.auth.userId);
    res.json({ conversations });
  } catch (err) {
    sendError(res, err);
  }
}

async function markRead(req, res) {
  try {
    const result = await markConversationRead(req.auth.userId, req.params.conversationId);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { list, markRead };
