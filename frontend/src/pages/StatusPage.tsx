import { useState, useEffect } from 'react';
import { health } from '../api/client';

export default function StatusPage() {
  const [status, setStatus] = useState<{
    status: string;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await health();
      setStatus(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法连接后端');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const isHealthy = status?.status === 'healthy';

  return (
    <div className="status-page">
      <h2>🩺 系统状态</h2>

      <div className="status-card">
        <div className="status-row">
          <span className="status-label">后端服务</span>
          {loading ? (
            <span className="status-badge checking">检测中...</span>
          ) : isHealthy ? (
            <span className="status-badge healthy">✅ 正常运行</span>
          ) : (
            <span className="status-badge unhealthy">❌ 无法连接</span>
          )}
        </div>

        {status && (
          <>
            <div className="status-row">
              <span className="status-label">服务状态</span>
              <span>{status.status}</span>
            </div>
            <div className="status-row">
              <span className="status-label">响应时间</span>
              <span>{status.timestamp}</span>
            </div>
          </>
        )}

        <div className="status-row">
          <span className="status-label">后端地址</span>
          <code>http://localhost:8000</code>
        </div>

        <div className="status-row">
          <span className="status-label">API 文档</span>
          <a
            href="http://localhost:8000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Swagger 文档
          </a>
        </div>

        <button
          className="btn btn-primary"
          onClick={checkHealth}
          disabled={loading}
        >
          🔄 刷新状态
        </button>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}

      <div className="status-info">
        <h3>API 端点列表</h3>
        <table className="api-table">
          <thead>
            <tr>
              <th>方法</th>
              <th>端点</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><span className="method post">POST</span></td><td>/api/query</td><td>智能查询</td></tr>
            <tr><td><span className="method get">GET</span></td><td>/api/stream</td><td>SSE 流式输出</td></tr>
            <tr><td><span className="method get">GET</span></td><td>/api/sessions/:id/history</td><td>对话历史</td></tr>
            <tr><td><span className="method post">POST</span></td><td>/api/sessions/:id/close</td><td>关闭会话</td></tr>
            <tr><td><span className="method post">POST</span></td><td>/api/evaluate/technical</td><td>技术评估</td></tr>
            <tr><td><span className="method post">POST</span></td><td>/api/evaluate/communication</td><td>沟通评估</td></tr>
            <tr><td><span className="method post">POST</span></td><td>/api/evaluate/leadership</td><td>领导力评估</td></tr>
            <tr><td><span className="method post">POST</span></td><td>/api/rank</td><td>综合排名</td></tr>
            <tr><td><span className="method get">GET</span></td><td>/api/health</td><td>健康检查</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
