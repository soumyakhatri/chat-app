import { useState } from 'react';
import { useChat } from '../context/ChatContext';

export default function LoginScreen() {
  const { register, connectionStatus, error } = useChat();
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    register(userId, displayName);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Chat App</h1>
        <p className="subtitle">Sign in with a unique user ID to start messaging.</p>

        <form onSubmit={handleSubmit}>
          <label>
            User ID
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. alice"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alice"
              autoComplete="name"
            />
          </label>

          <button type="submit" disabled={connectionStatus !== 'connected'}>
            {connectionStatus === 'connected' ? 'Continue' : 'Connecting…'}
          </button>
        </form>

        <p className={`status status--${connectionStatus}`}>
          Socket: {connectionStatus}
        </p>

        {error && <p className="error-banner">{error}</p>}
      </div>
    </div>
  );
}
