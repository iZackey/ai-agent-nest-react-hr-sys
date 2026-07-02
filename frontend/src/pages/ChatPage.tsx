/**
 * 聊天页面组件
 * 提供智能对话界面，支持消息展示、输入和快捷建议
 */
import { useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import QuickSuggestions from '../components/QuickSuggestions';

/**
 * ChatPage 组件
 * 主聊天界面，包含消息列表、输入框和快捷建议
 * @returns {JSX.Element} 聊天页面视图
 */
export default function ChatPage() {
  // 从 useChat hook 获取聊天状态和操作方法
  const { messages, sessionId, isLoading, sendMessage, stopMessage, clearChat } = useChat();
  
  // 用于自动滚动到最新消息的引用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * 当消息列表更新时，自动滚动到底部显示最新消息
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 处理发送消息
   * @param {string} question - 用户输入的问题
   */
  const handleSend = (question: string) => {
    sendMessage(question);
  };

  /**
   * 处理快捷建议点击
   * @param {string} s - 选中的建议文本
   */
  const handleSuggestion = (s: string) => {
    sendMessage(s);
  };

  /**
   * 处理新建对话
   * 清空当前聊天记录，开始新会话
   */
  const handleNewChat = () => {
    clearChat();
  };

  return (
    <div className="chat-page">
      {/* 聊天头部 */}
      <div className="chat-header">
        <h2>智能对话</h2>
        <div className="chat-header-actions">
          {/* 显示当前会话ID（截取前8位） */}
          {sessionId && (
            <span className="session-badge">会话: {sessionId.slice(0, 8)}...</span>
          )}
          <button className="btn btn-secondary" onClick={handleNewChat}>
            🔄 新建对话
          </button>
        </div>
      </div>

      {/* 消息列表区域 */}
      <div className="chat-messages">
        {/* 空状态展示 */}
        {messages.length === 0 && !isLoading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">🤖</div>
            <h3>你好！我是智能员工查询助手</h3>
            <p>你可以向我询问关于员工信息的任何问题</p>
            <QuickSuggestions onSelect={handleSuggestion} />
          </div>
        )}

        {/* 渲染消息列表 */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>

      {/* 消息输入框 */}
      <ChatInput
        onSend={handleSend}
        onStop={isLoading ? stopMessage : undefined}
        isLoading={isLoading}
        isStreaming={isLoading}
      />

      {/* 自动滚动锚点 */}
      <div ref={messagesEndRef} />
    </div>
  );
}