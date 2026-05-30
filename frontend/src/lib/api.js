const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export function signup({ userId, password, displayName }) {
  return request('/auth/signup', {
    method: 'POST',
    body: { userId, password, displayName },
  });
}

export function login({ userId, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { userId, password },
  });
}

export function fetchMe(token) {
  return request('/auth/me', { token });
}

export function fetchConversations(token) {
  return request('/conversations', { token });
}

export function markConversationRead(token, conversationId) {
  return request(`/conversations/${conversationId}/read`, {
    method: 'POST',
    token,
  });
}
