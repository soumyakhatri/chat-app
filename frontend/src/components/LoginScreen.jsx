import { useState } from 'react';
import { useChat } from '../context/ChatContext';

export default function LoginScreen() {
  const { login, signup, authLoading, error, setError } = useChat();
  const [mode, setMode] = useState('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(userId, password);
      } else {
        await signup(userId, password, displayName);
      }
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <p className="subtitle">Restoring session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Chat App</h1>
        <p className="subtitle">
          {mode === 'login'
            ? 'Log in with your user ID and password.'
            : 'Create an account to start messaging.'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => switchMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'auth-tab auth-tab--active' : 'auth-tab'}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

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
              minLength={3}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 4 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={4}
            />
          </label>

          {mode === 'signup' && (
            <label>
              Display name
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice (optional)"
                autoComplete="name"
              />
            </label>
          )}

          <button type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>

        {error && <p className="error-banner">{error}</p>}
      </div>
    </div>
  );
}
