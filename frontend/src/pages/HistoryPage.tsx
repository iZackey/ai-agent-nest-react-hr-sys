import { useState, useEffect, useCallback } from 'react';
import {
  listSessions,
  getHistory,
  closeSession,
  type SessionItem,
  type HistoryMessage,
} from '../api/client';

export default function HistoryPage() {
  // 会话列表
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // 展开的会话详情
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // 操作反馈
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await listSessions();
      setSessions(res.data.sessions);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : '获取会话列表失败');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 查看某个会话的消息详情
  const handleSelectSession = async (sessionId: string) => {
    if (selectedId === sessionId) {
      setSelectedId(null);
      setMessages([]);
      return;
    }

    setSelectedId(sessionId);
    setDetailLoading(true);
    try {
      const res = await getHistory(sessionId);
      setMessages(res.data.messages);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '获取历史失败');
      setMessages([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // 关闭会话
  const handleClose = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await closeSession(sessionId);
      showToast('success', '会话已关闭');
      // 刷新列表
      await loadSessions();
      if (selectedId === sessionId) {
        setSelectedId(null);
        setMessages([]);
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '关闭会话失败');
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-CN');
    } catch {
      return iso;
    }
  };

  return (
    <div className="history-page">
      <div className="history-page-header">
        <h2>📋 对话历史</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadSessions}
          disabled={sessionsLoading}
        >
          🔄 刷新
        </button>
      </div>

      {toast && (
        <div className={`alert alert-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.text}
        </div>
      )}

      {sessionsError && (
        <div className="alert alert-error">❌ {sessionsError}</div>
      )}

      {/* 会话列表 */}
      {sessionsLoading ? (
        <div className="history-loading">加载中...</div>
      ) : sessions.length === 0 ? (
        <div className="history-empty">暂无对话记录</div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <div key={session.id} className="session-card-container">
              <div
                className={`session-card ${selectedId === session.id ? 'active' : ''} ${!session.isActive ? 'closed' : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="session-card-header">
                  <span className="session-status-dot" data-active={session.isActive} />
                  <span className="session-last-msg">
                    {session.lastMessage.length > 60
                      ? session.lastMessage.slice(0, 60) + '...'
                      : session.lastMessage}
                  </span>
                </div>
                <div className="session-card-meta">
                  <span>💬 {session.messageCount} 条消息</span>
                  <span>🕐 {formatTime(session.lastActivity)}</span>
                  {!session.isActive && <span className="session-closed-tag">已关闭</span>}
                </div>
                <div className="session-card-actions">
                  {session.isActive && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => handleClose(e, session.id)}
                    >
                      关闭
                    </button>
                  )}
                </div>
              </div>

              {/* 展开的会话详情 */}
              {selectedId === session.id && (
                <div className="session-detail">
                  {detailLoading ? (
                    <div className="history-loading">加载消息...</div>
                  ) : messages.length === 0 ? (
                    <div className="history-empty">无消息记录</div>
                  ) : (
                    <div className="history-timeline">
                      {messages.map((msg, i) => (
                        <div key={i} className={`history-item ${msg.role}`}>
                          <div className="history-role">
                            {msg.role === 'user' ? '👤 用户' : '🤖 助手'}
                          </div>
                          <div className="history-content">
                            {msg.content.length > 500
                              ? msg.content.slice(0, 500) + '...'
                              : msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
