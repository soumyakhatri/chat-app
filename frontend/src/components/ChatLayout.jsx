import { useMemo, useState } from 'react';
import { useChat } from '../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateGroupModal from './CreateGroupModal';
import NewChatModal from './NewChatModal';
import ConversationList from './ConversationList';

export default function ChatLayout() {
  const {
    user,
    isRegistered,
    connectionStatus,
    error,
    setError,
    activeChat,
    conversations,
    conversationsLoading,
    activeMessages,
    logout,
    selectConversation,
    selectDirectChat,
    sendMessage,
    createGroup,
  } = useChat();

  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const otherId = (c.otherUser?.userId || '').toLowerCase();
      const preview = (c.lastMessage?.content || '').toLowerCase();
      return name.includes(query) || otherId.includes(query) || preview.includes(query);
    });
  }, [conversations, search]);

  const chatTitle = useMemo(() => {
    if (!activeChat) return 'Select a chat';
    if (activeChat.name) return activeChat.name;
    if (activeChat.type === 'direct') return activeChat.otherUserId;
    return 'Chat';
  }, [activeChat]);

  const canSend = isRegistered && !!activeChat;

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div>
            <strong>{user.displayName || user.userId}</strong>
            <span className="user-id">@{user.userId}</span>
          </div>
          <button type="button" className="btn-text" onClick={logout}>
            Log out
          </button>
        </header>

        <div className="sidebar-toolbar">
          <input
            type="search"
            className="conversation-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
          />
          <div className="sidebar-actions">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowNewChat(true)}
              disabled={!isRegistered}
              title="New chat"
            >
              +
            </button>
            <button
              type="button"
              className="btn-icon btn-icon--secondary"
              onClick={() => setShowGroupModal(true)}
              disabled={!isRegistered}
              title="New group"
            >
              G
            </button>
          </div>
        </div>

        <ConversationList
          conversations={filteredConversations}
          loading={conversationsLoading}
          activeChat={activeChat}
          currentUserId={user.userId}
          onSelect={selectConversation}
        />

        <p className={`status status--${connectionStatus}`}>
          {isRegistered ? 'Online' : 'Connecting…'} · {connectionStatus}
        </p>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <h2>{chatTitle}</h2>
          {activeChat?.type === 'group' && (
            <span className="chat-badge">Group</span>
          )}
          {activeChat?.type === 'direct' && (
            <span className="chat-badge">Direct</span>
          )}
        </header>

        {error && (
          <div className="error-banner error-banner--inline">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {!activeChat ? (
          <div className="chat-placeholder">
            <p>Select a conversation or start a new chat.</p>
          </div>
        ) : (
          <>
            <MessageList messages={activeMessages} currentUserId={user.userId} />
            <MessageInput
              onSend={sendMessage}
              disabled={!canSend}
              placeholder={
                activeChat.type === 'direct'
                  ? `Message ${activeChat.name || activeChat.otherUserId}…`
                  : `Message ${activeChat.name || 'group'}…`
              }
            />
          </>
        )}
      </main>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStartChat={selectDirectChat}
        />
      )}

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={createGroup}
        />
      )}
    </div>
  );
}
