function formatChatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  if (date >= weekAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getPreview(conversation, currentUserId) {
  const { lastMessage } = conversation;
  if (!lastMessage) return 'No messages yet';

  if (conversation.type === 'group' && lastMessage.senderId !== currentUserId) {
    return `${lastMessage.senderId}: ${lastMessage.content}`;
  }

  if (lastMessage.senderId === currentUserId) {
    return `You: ${lastMessage.content}`;
  }

  return lastMessage.content;
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function isActive(conversation, activeChat) {
  if (!activeChat) return false;

  if (activeChat.conversationId && conversation.id === activeChat.conversationId) {
    return true;
  }

  if (
    conversation.type === 'direct' &&
    activeChat.type === 'direct' &&
    conversation.otherUser?.userId === activeChat.otherUserId
  ) {
    return true;
  }

  return false;
}

export default function ConversationList({
  conversations,
  loading,
  activeChat,
  currentUserId,
  onSelect,
}) {
  if (loading && conversations.length === 0) {
    return (
      <div className="conversation-list conversation-list--empty">
        <p>Loading chats…</p>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="conversation-list conversation-list--empty">
        <p>No conversations yet.</p>
        <p className="conversation-list-hint">Start a new chat to begin.</p>
      </div>
    );
  }

  return (
    <ul className="conversation-list">
      {conversations.map((conversation) => {
        const active = isActive(conversation, activeChat);
        const preview = getPreview(conversation, currentUserId);

        return (
          <li key={conversation.id}>
            <button
              type="button"
              className={`conversation-item ${active ? 'conversation-item--active' : ''}`}
              onClick={() => onSelect(conversation)}
            >
              <span
                className={`conversation-avatar ${
                  conversation.type === 'group' ? 'conversation-avatar--group' : ''
                }`}
                aria-hidden
              >
                {getInitial(conversation.name)}
              </span>
              <span className="conversation-body">
                <span className="conversation-top">
                  <span className="conversation-name">{conversation.name}</span>
                  <time className="conversation-time">
                    {formatChatTime(conversation.updatedAt)}
                  </time>
                </span>
                <span className="conversation-preview-row">
                  <span className="conversation-preview">{preview}</span>
                  {(conversation.unreadCount || 0) > 0 && (
                    <span className="unread-badge" aria-label={`${conversation.unreadCount} unread`}>
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </span>
              </span>
              {conversation.type === 'group' && (
                <span className="conversation-type-badge" title="Group">
                  G
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
