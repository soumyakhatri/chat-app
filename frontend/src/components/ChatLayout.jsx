import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateGroupModal from './CreateGroupModal';

export default function ChatLayout() {
  const {
    user,
    isRegistered,
    connectionStatus,
    error,
    setError,
    activeChat,
    groups,
    activeMessages,
    logout,
    selectDirectChat,
    selectGroupChat,
    sendMessage,
    createGroup,
  } = useChat();

  const [recipientId, setRecipientId] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  const handleStartDirect = (e) => {
    e.preventDefault();
    selectDirectChat(recipientId);
    setRecipientId('');
  };

  const chatTitle =
    activeChat?.type === 'direct'
      ? activeChat.otherUserId
      : activeChat?.name || 'Select a chat';

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

        <section className="sidebar-section">
          <h3>Direct message</h3>
          <form className="inline-form" onSubmit={handleStartDirect}>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Recipient user ID"
            />
            <button type="submit">Chat</button>
          </form>
        </section>

        <section className="sidebar-section">
          <div className="section-header">
            <h3>Groups</h3>
            <button
              type="button"
              className="btn-small"
              onClick={() => setShowGroupModal(true)}
              disabled={!isRegistered}
            >
              + New
            </button>
          </div>
          <ul className="group-list">
            {groups.length === 0 && (
              <li className="group-list-empty">No groups yet</li>
            )}
            {groups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  className={`group-item ${
                    activeChat?.type === 'group' &&
                    activeChat.conversationId === group.id
                      ? 'group-item--active'
                      : ''
                  }`}
                  onClick={() => selectGroupChat(group)}
                >
                  {group.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className={`status status--${connectionStatus}`}>
          {isRegistered ? 'Registered' : 'Registering…'} · {connectionStatus}
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
            <p>Start a direct chat or create a group to begin.</p>
          </div>
        ) : (
          <>
            <MessageList messages={activeMessages} currentUserId={user.userId} />
            <MessageInput
              onSend={sendMessage}
              disabled={!canSend}
              placeholder={
                activeChat.type === 'direct'
                  ? `Message ${activeChat.otherUserId}…`
                  : 'Message group…'
              }
            />
          </>
        )}
      </main>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreate={createGroup}
        />
      )}
    </div>
  );
}
