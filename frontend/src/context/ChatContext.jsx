import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createSocket } from '../lib/socket';
import * as authApi from '../lib/api';

const STORAGE_KEY = 'chat-app-session';

const ChatContext = createContext(null);

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function ChatProvider({ children }) {
  const socketRef = useRef(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const joinedGroupsRef = useRef(new Set());
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const activeChatRef = useRef(activeChat);
  activeChatRef.current = activeChat;
  const userRef = useRef(user);
  userRef.current = user;

  const appendMessage = useCallback((message) => {
    const convId = message.conversationId;
    setMessagesByConversation((prev) => {
      const existing = prev[convId] || [];
      if (existing.some((m) => m.id === message.id)) {
        return prev;
      }
      return {
        ...prev,
        [convId]: [...existing, message],
      };
    });
  }, []);

  const setHistory = useCallback((conversationId, messages) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: messages,
    }));
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!user?.token) return;

    setConversationsLoading(true);
    try {
      const { conversations: list } = await authApi.fetchConversations(user.token);
      setConversations(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setConversationsLoading(false);
    }
  }, [user?.token]);

  const upsertConversationPreview = useCallback((message, { isActive = false } = {}) => {
    const currentUserId = userRef.current?.userId;
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === message.conversationId);

      if (index === -1) {
        return prev;
      }

      const shouldIncrement =
        !isActive && message.senderId !== currentUserId;

      const updated = {
        ...prev[index],
        lastMessage: message,
        updatedAt: message.createdAt,
        unreadCount: shouldIncrement
          ? (prev[index].unreadCount || 0) + 1
          : isActive
            ? 0
            : prev[index].unreadCount || 0,
      };
      const next = [...prev];
      next.splice(index, 1);
      return [updated, ...next];
    });
  }, []);

  const markConversationRead = useCallback(
    async (conversationId) => {
      if (!user?.token || !conversationId) return;

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );

      try {
        await authApi.markConversationRead(user.token, conversationId);
      } catch {
        refreshConversations();
      }
    },
    [user?.token, refreshConversations]
  );

  useEffect(() => {
    if (!user?.token) {
      setConnectionStatus('disconnected');
      setIsRegistered(false);
      return undefined;
    }

    const socket = createSocket(user.token);
    socketRef.current = socket;

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => {
      setConnectionStatus('disconnected');
      setIsRegistered(false);
    };
    const onConnectError = (err) => {
      setConnectionStatus('disconnected');
      setIsRegistered(false);
      const msg = err.message || 'Socket connection failed';
      setError(msg);
      if (msg.includes('token') || msg.includes('Authentication')) {
        clearSession();
        setUser(null);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.on('user:registered', () => {
      setIsRegistered(true);
      setError(null);
    });

    socket.on('user:error', ({ error: msg }) => {
      setError(msg);
      setIsRegistered(false);
    });

    socket.on('message:new', ({ message }) => {
      appendMessage(message);
      const active = activeChatRef.current;
      const currentUserId = userRef.current?.userId;
      const isActive =
        !!active &&
        (active.conversationId === message.conversationId ||
          (active.type === 'direct' &&
            !active.conversationId &&
            (message.senderId === active.otherUserId ||
              message.senderId === currentUserId)));

      if (conversationsRef.current.some((c) => c.id === message.conversationId)) {
        upsertConversationPreview(message, { isActive });
        if (isActive) {
          markConversationRead(message.conversationId);
        }
      } else {
        refreshConversations();
      }
    });

    socket.on('message:history', ({ messages }) => {
      if (!messages.length) return;
      const conversationId = messages[0].conversationId;
      setHistory(conversationId, messages);

      const active = activeChatRef.current;
      if (
        active &&
        (!active.conversationId || active.conversationId === conversationId)
      ) {
        setActiveChat((prev) =>
          prev ? { ...prev, conversationId } : prev
        );
        markConversationRead(conversationId);
      }
    });

    socket.on('message:error', ({ error: msg }) => setError(msg));

    socket.on('group:created', ({ conversation }) => {
      setGroups((prev) => {
        if (prev.some((g) => g.id === conversation.id)) return prev;
        return [...prev, conversation];
      });
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversation.id)) return prev;
        return [
          {
            id: conversation.id,
            type: 'group',
            name: conversation.name,
            lastMessage: null,
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
          },
          ...prev,
        ];
      });
      socket.emit('group:join', { conversationId: conversation.id });
      joinedGroupsRef.current.add(conversation.id);
      setActiveChat({
        type: 'group',
        conversationId: conversation.id,
        name: conversation.name,
      });
      setError(null);
    });

    socket.on('group:joined', ({ conversationId }) => {
      joinedGroupsRef.current.add(conversationId);
    });

    socket.on('group:error', ({ error: msg }) => setError(msg));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.token, appendMessage, setHistory, upsertConversationPreview, refreshConversations, markConversationRead]);

  useEffect(() => {
    if (!isRegistered || !user?.token) return;
    refreshConversations();
  }, [isRegistered, user?.token, refreshConversations]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = loadStoredSession();
      if (!stored?.token) {
        setAuthLoading(false);
        return;
      }

      try {
        const { user: profile } = await authApi.fetchMe(stored.token);
        if (!cancelled) {
          setUser({ ...profile, token: stored.token });
        }
      } catch {
        clearSession();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuthResult = useCallback(({ user: profile, token }) => {
    const session = { ...profile, token };
    saveSession(session);
    setUser(session);
    setError(null);
  }, []);

  const login = useCallback(
    async (userId, password) => {
      try {
        const result = await authApi.login({ userId, password });
        applyAuthResult(result);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [applyAuthResult]
  );

  const signup = useCallback(
    async (userId, password, displayName) => {
      try {
        const result = await authApi.signup({ userId, password, displayName });
        applyAuthResult(result);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [applyAuthResult]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsRegistered(false);
    setActiveChat(null);
    setConversations([]);
    setConversationsLoading(false);
    setGroups([]);
    setMessagesByConversation({});
    joinedGroupsRef.current = new Set();
  }, []);

  const selectDirectChat = useCallback(
    (otherUserId, options = {}) => {
      const trimmed = otherUserId.trim();
      if (!trimmed) return;
      if (trimmed === user?.userId) {
        setError('Cannot chat with yourself');
        return;
      }

      setActiveChat({
        type: 'direct',
        otherUserId: trimmed,
        conversationId: options.conversationId,
        name: options.name || trimmed,
      });
      setError(null);

      if (options.conversationId) {
        socketRef.current?.emit('message:history', {
          conversationId: options.conversationId,
        });
        markConversationRead(options.conversationId);
      } else {
        socketRef.current?.emit('message:history', { otherUserId: trimmed });
      }
    },
    [user?.userId, markConversationRead]
  );

  const selectGroupChat = useCallback(
    (group) => {
      setActiveChat({
        type: 'group',
        conversationId: group.id,
        name: group.name,
      });
      setError(null);

      if (!joinedGroupsRef.current.has(group.id)) {
        socketRef.current?.emit('group:join', { conversationId: group.id });
      }

      markConversationRead(group.id);
    },
    [markConversationRead]
  );

  const sendMessage = useCallback(
    (content) => {
      const trimmed = content.trim();
      if (!trimmed || !activeChat) return;

      const socket = socketRef.current;
      if (!socket || !isRegistered) {
        setError('Not connected. Wait for registration.');
        return;
      }

      if (activeChat.type === 'direct') {
        socket.emit('message:direct', {
          toUserId: activeChat.otherUserId,
          content: trimmed,
        });
      } else {
        socket.emit('message:group', {
          conversationId: activeChat.conversationId,
          content: trimmed,
        });
      }
    },
    [activeChat, isRegistered]
  );

  const createGroup = useCallback(
    (name, memberIds) => {
      const socket = socketRef.current;
      if (!socket || !isRegistered) {
        setError('Not connected. Wait for registration.');
        return;
      }
      socket.emit('group:create', { name: name.trim(), memberIds });
    },
    [isRegistered]
  );

  const selectConversation = useCallback(
    (conversation) => {
      if (conversation.type === 'direct') {
        selectDirectChat(conversation.otherUser.userId, {
          conversationId: conversation.id,
          name: conversation.name,
        });
        return;
      }

      selectGroupChat({
        id: conversation.id,
        name: conversation.name,
      });
    },
    [selectDirectChat, selectGroupChat]
  );

  const activeMessages = useMemo(() => {
    if (!activeChat || !user?.userId) return [];

    if (activeChat.conversationId) {
      return messagesByConversation[activeChat.conversationId] || [];
    }

    const { otherUserId } = activeChat;
    for (const messages of Object.values(messagesByConversation)) {
      if (!messages.length) continue;
      const senders = new Set(messages.map((m) => m.senderId));
      if (senders.has(user.userId) && senders.has(otherUserId)) {
        return messages;
      }
    }
    return [];
  }, [activeChat, messagesByConversation, user?.userId]);

  const value = {
    user,
    authLoading,
    isRegistered,
    connectionStatus,
    error,
    setError,
    activeChat,
    conversations,
    conversationsLoading,
    groups,
    activeMessages,
    login,
    signup,
    logout,
    refreshConversations,
    markConversationRead,
    selectConversation,
    selectDirectChat,
    selectGroupChat,
    sendMessage,
    createGroup,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return ctx;
}
