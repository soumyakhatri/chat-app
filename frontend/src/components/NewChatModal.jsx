import { useState } from 'react';

export default function NewChatModal({ onClose, onStartChat }) {
  const [userId, setUserId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartChat(userId);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="new-chat-title"
      >
        <h2 id="new-chat-title">New chat</h2>
        <p className="modal-subtitle">Enter the user ID of the person you want to message.</p>
        <form onSubmit={handleSubmit}>
          <label>
            User ID
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. bob"
              autoFocus
              required
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Start chat</button>
          </div>
        </form>
      </div>
    </div>
  );
}
