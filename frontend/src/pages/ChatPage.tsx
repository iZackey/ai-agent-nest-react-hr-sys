import { useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import QuickSuggestions from '../components/QuickSuggestions';

export default function ChatPage() {
  const { messages, sessionId, isLoading, sendMessage, stopMessage, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (question: string) => {
    sendMessage(question);
  };

  const handleSuggestion = (s: string) => {
    sendMessage(s);
  };

  const handleNewChat = () => {
    clearChat();
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h2>智能对话</h2>
        <div className="chat-header-actions">
          {sessionId && (
            <span className="session-badge">会话: {sessionId.slice(0, 8)}...</span>
          )}
          <button className="btn btn-secondary" onClick={handleNewChat}>
            🔄 新建对话
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !isLoading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">🤖</div>
            <h3>你好！我是智能员工查询助手</h3>
            <p>你可以向我询问关于员工信息的任何问题</p>
            <QuickSuggestions onSelect={handleSuggestion} />
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      <ChatInput
        onSend={handleSend}
        onStop={isLoading ? stopMessage : undefined}
        isLoading={isLoading}
        isStreaming={isLoading}
      />

      <div ref={messagesEndRef} />
    </div>
  );
}
