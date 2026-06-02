import { useState, useRef, type KeyboardEvent } from 'react';

interface Props {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  isStreaming?: boolean;
}

export default function ChatInput({ onSend, onStop, isLoading, isStreaming }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    }
  };

  const busy = isLoading || isStreaming;

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="输入你的问题..."
          rows={1}
          disabled={isLoading}
        />
        {busy ? (
          <button className="chat-btn stop" onClick={onStop} title="停止">
            ⏹
          </button>
        ) : (
          <button
            className="chat-btn send"
            onClick={handleSend}
            disabled={!input.trim()}
            title="发送"
          >
            ➤
          </button>
        )}
      </div>
    </div>
  );
}
