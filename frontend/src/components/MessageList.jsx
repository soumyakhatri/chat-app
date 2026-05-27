import { useEffect, useRef } from 'react';

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="message-list message-list--empty">
        <p>No messages yet. Say hello!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => {
        const isOwn = msg.senderId === currentUserId;
        return (
          <div
            key={msg.id}
            className={`message-bubble ${isOwn ? 'message-bubble--own' : 'message-bubble--other'}`}
          >
            {!isOwn && <span className="message-sender">{msg.senderId}</span>}
            <p className="message-content">{msg.content}</p>
            <time className="message-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
