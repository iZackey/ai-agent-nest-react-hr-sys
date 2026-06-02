import type { ChatMessage as ChatMessageType } from '../hooks/useChat';

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="chat-avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="chat-bubble">
        <div className="chat-text">{message.content}</div>
        <div className="chat-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
