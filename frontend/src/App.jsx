import { ChatProvider, useChat } from './context/ChatContext';
import LoginScreen from './components/LoginScreen';
import ChatLayout from './components/ChatLayout';

function AppContent() {
  const { user, isRegistered } = useChat();

  if (!user) {
    return <LoginScreen />;
  }

  if (!isRegistered) {
    return (
      <div className="loading-screen">
        <p>Connecting as <strong>{user.userId}</strong>…</p>
      </div>
    );
  }

  return <ChatLayout />;
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
