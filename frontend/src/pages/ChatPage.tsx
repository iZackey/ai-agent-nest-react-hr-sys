import { useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';     // 聊天消息管理 Hook（消息列表、会话 ID、加载状态、发送/清空等）
import { useStream } from '../hooks/useStream'; // 流式输出管理 Hook（流式文本、启停控制、重置）
import ChatMessage from '../components/ChatMessage';       // 单条聊天消息渲染组件
import ChatInput from '../components/ChatInput';           // 聊天输入框组件（发送/停止）
import QuickSuggestions from '../components/QuickSuggestions'; // 快捷提问建议组件

/**
 * 聊天页面组件
 *
 * 功能：
 * - 展示智能对话界面，支持普通问答与流式输出两种模式
 * - 消息列表自动滚动到底部
 * - 新建对话时清空历史消息与流式状态
 * - 空状态时展示欢迎语与快捷建议
 */
export default function ChatPage() {
  // ---- 状态与 Hook ----
  const { messages, sessionId, isLoading, sendMessage, clearChat } = useChat();
  const { text: streamText, isStreaming, startStream, stopStream, resetStream } = useStream();
  // 用于自动滚动到底部的锚点 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 消息列表或流式文本变化时，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  // ---- 事件处理 ----
  
  /** 发送普通问答消息 */
  const handleSend = (question: string) => {
    sendMessage(question);
  };
  
  /** 启动流式输出 */
  const handleStreamSend = (prompt: string) => {
    startStream(prompt);
  };
  
  /** 快捷建议点击 → 走普通发送 */
  const handleSuggestion = (s: string) => {
    handleSend(s);
  };
  
  /** 新建对话：清空消息历史与流式状态 */
  const handleNewChat = () => {
    clearChat();
    resetStream();
  };

  return (
    <div className="chat-page">
      {/* ---- 顶部标题栏：会话标识 + 新建对话按钮 ---- */}
      <div className="chat-header">
        <h2>智能对话</h2>
        <div className="chat-header-actions">
          {/* 存在会话 ID 时，截取前 8 位显示 */}
          {sessionId && (
            <span className="session-badge">会话: {sessionId.slice(0, 8)}...</span>
          )}
          <button className="btn btn-secondary" onClick={handleNewChat}>
            🔄 新建对话
          </button>
        </div>
      </div>

      {/* ---- 消息列表区域 ---- */}
      <div className="chat-messages">
        {/* 空状态：欢迎语 + 快捷建议 */}
        {messages.length === 0 && !isStreaming && (
          <div className="chat-empty">
            <div className="chat-empty-icon">🤖</div>
            <h3>你好！我是智能员工查询助手</h3>
            <p>你可以向我询问关于员工信息的任何问题</p>
            <QuickSuggestions onSelect={handleSuggestion} />
          </div>
        )}

        {/* 历史消息列表 */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* 加载中：显示打字动画指示器 */}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 流式输出测试区域 */}
      {streamText && (
        <div className="stream-output">
          <div className="stream-header">
            <span>📡 流式输出</span>
          </div>
          <div className="stream-text">{streamText}</div>
        </div>
      )}

      {/* ---- 底部输入区域 ---- */}
      <ChatInput
        onSend={handleSend}
        onStop={isStreaming ? stopStream : undefined} // 流式输出中才显示停止按钮
        isLoading={isLoading}
        isStreaming={isStreaming}
      />

      {/* 流式输出测试入口（调试用） */}
      <div className="stream-test">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleStreamSend('你好，请介绍一下你自己')}
          disabled={isStreaming}
        >
          📡 测试流式输出
        </button>
      </div>

      {/* 自动滚动锚点 */}
      <div ref={messagesEndRef} />
    </div>
  );
}
