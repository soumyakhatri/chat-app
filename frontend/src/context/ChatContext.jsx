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

const STORAGE_KEY = 'chat-app-user';

const ChatContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function ChatProvider({ children }) {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [user, setUser] = useState(loadStoredUser);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [groups, setGroups] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const joinedGroupsRef = useRef(new Set());

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

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => {
      setConnectionStatus('disconnected');
      setIsRegistered(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

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
    });

    socket.on('message:history', ({ messages }) => {
      if (!messages.length) return;
      const conversationId = messages[0].conversationId;
      setHistory(conversationId, messages);
    });

    socket.on('message:error', ({ error: msg }) => setError(msg));

    socket.on('group:created', ({ conversation }) => {
      setGroups((prev) => {
        if (prev.some((g) => g.id === conversation.id)) return prev;
        return [...prev, conversation];
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
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appendMessage, setHistory]);

  useEffect(() => {
    if (connectionStatus !== 'connected' || !user) return;

    const socket = socketRef.current;
    if (!socket) return;

    setIsRegistered(false);
    socket.emit('user:register', {
      userId: user.userId,
      displayName: user.displayName,
    });
  }, [connectionStatus, user]);

  const register = useCallback((userId, displayName) => {
    const trimmed = {
      userId: userId.trim(),
      displayName: displayName.trim(),
    };
    if (!trimmed.userId) {
      setError('User ID is required');
      return;
    }
    saveUser(trimmed);
    setUser(trimmed);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
    setIsRegistered(false);
    setActiveChat(null);
    setGroups([]);
    setMessagesByConversation({});
    joinedGroupsRef.current = new Set();
  }, []);

  const selectDirectChat = useCallback(
    (otherUserId) => {
      const trimmed = otherUserId.trim();
      if (!trimmed) return;
      if (trimmed === user?.userId) {
        setError('Cannot chat with yourself');
        return;
      }
      setActiveChat({ type: 'direct', otherUserId: trimmed });
      setError(null);
      socketRef.current?.emit('message:history', { otherUserId: trimmed });
    },
    [user?.userId]
  );

  const selectGroupChat = useCallback((group) => {
    setActiveChat({
      type: 'group',
      conversationId: group.id,
      name: group.name,
    });
    setError(null);

    if (!joinedGroupsRef.current.has(group.id)) {
      socketRef.current?.emit('group:join', { conversationId: group.id });
    }
  }, []);

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

  const activeMessages = useMemo(() => {
    if (!activeChat || !user?.userId) return [];

    if (activeChat.type === 'group') {
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
    isRegistered,
    connectionStatus,
    error,
    setError,
    activeChat,
    groups,
    activeMessages,
    register,
    logout,
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
