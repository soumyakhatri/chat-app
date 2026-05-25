const {
  createGroup,
  findConversationById,
  formatConversation,
  getRoomName,
  isMember,
} = require('../../services/conversation.service');
const {
  createMessage,
  formatMessage,
} = require('../../services/message.service');

function registerGroupMessageHandlers(io, socket) {
  socket.on('group:create', async ({ name, memberIds }) => {
    try {
      const creatorId = socket.data.userId;

      if (!creatorId) {
        socket.emit('group:error', { error: 'Register with user:register first' });
        return;
      }

      if (!name || typeof name !== 'string' || !name.trim()) {
        socket.emit('group:error', { error: 'name is required' });
        return;
      }

      if (!Array.isArray(memberIds)) {
        socket.emit('group:error', { error: 'memberIds must be an array' });
        return;
      }

      const trimmedMembers = memberIds
        .filter((id) => typeof id === 'string' && id.trim())
        .map((id) => id.trim())
        .filter((id) => id !== creatorId);

      const conversation = await createGroup({
        name: name.trim(),
        creatorId,
        memberIds: trimmedMembers,
      });

      const room = getRoomName(conversation._id);
      socket.join(room);

      socket.emit('group:created', { conversation: formatConversation(conversation) });
      console.log(`Group created: ${conversation._id} (${conversation.name})`);
    } catch (err) {
      socket.emit('group:error', { error: err.message });
    }
  });

  socket.on('group:join', async ({ conversationId }) => {
    try {
      const userId = socket.data.userId;

      if (!userId) {
        socket.emit('group:error', { error: 'Register with user:register first' });
        return;
      }

      if (!conversationId) {
        socket.emit('group:error', { error: 'conversationId is required' });
        return;
      }

      const conversation = await findConversationById(conversationId);

      if (!conversation || conversation.type !== 'group') {
        socket.emit('group:error', { error: 'Group not found' });
        return;
      }

      if (!isMember(conversation, userId)) {
        socket.emit('group:error', { error: 'You are not a member of this group' });
        return;
      }

      socket.join(getRoomName(conversation._id));
      socket.emit('group:joined', { conversationId: conversation._id.toString() });
      console.log(`User ${userId} joined group room ${conversation._id}`);
    } catch (err) {
      socket.emit('group:error', { error: err.message });
    }
  });

  socket.on('message:group', async ({ conversationId, content }) => {
    try {
      const senderId = socket.data.userId;

      if (!senderId) {
        socket.emit('message:error', { error: 'Register with user:register first' });
        return;
      }

      if (!conversationId) {
        socket.emit('message:error', { error: 'conversationId is required' });
        return;
      }

      if (!content || typeof content !== 'string' || !content.trim()) {
        socket.emit('message:error', { error: 'content is required' });
        return;
      }

      const conversation = await findConversationById(conversationId);

      if (!conversation || conversation.type !== 'group') {
        socket.emit('message:error', { error: 'Group not found' });
        return;
      }

      if (!isMember(conversation, senderId)) {
        socket.emit('message:error', { error: 'You are not a member of this group' });
        return;
      }

      socket.join(getRoomName(conversation._id));

      const message = await createMessage({
        conversationId: conversation._id,
        senderId,
        content: content.trim(),
      });

      const payload = { message: formatMessage(message) };
      io.to(getRoomName(conversation._id)).emit('message:new', payload);
    } catch (err) {
      socket.emit('message:error', { error: err.message });
    }
  });
}

module.exports = registerGroupMessageHandlers;
