import { useState } from 'react';
import {
  evaluateTechnical,
  evaluateCommunication,
  evaluateLeadership,
  rank,
  findEmployeesByNames,
} from '../api/client';

type EvalType = 'technical' | 'communication' | 'leadership' | 'rank';

const evalTypes: { value: EvalType; label: string; icon: string }[] = [
  { value: 'technical', label: '技术评估', icon: '💻' },
  { value: 'communication', label: '沟通评估', icon: '🗣️' },
  { value: 'leadership', label: '领导力评估', icon: '👔' },
  { value: 'rank', label: '综合排名', icon: '🏆' },
];

export default function EvaluatePage() {
  const [namesInput, setNamesInput] = useState('');
  const [evalType, setEvalType] = useState<EvalType>('technical');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  // 排名权重
  const [weights, setWeights] = useState({
    technical: 0.4,
    communication: 0.3,
    leadership: 0.3,
  });

  const parseNames = (): string[] => {
    return namesInput
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async () => {
    const names = parseNames();
    if (names.length === 0) {
      setError('请输入有效的员工姓名');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 先根据姓名查找员工ID
      const empRes = await findEmployeesByNames(names);
      const employees = empRes.data.employees;

      if (employees.length === 0) {
        setError('未找到匹配的员工，请检查姓名是否正确');
        setLoading(false);
        return;
      }

      // 检查未找到的员工
      const foundNames = employees.map((e) => e.name);
      const notFound = names.filter((n) => !foundNames.includes(n));
      if (notFound.length > 0) {
        setError(`未找到以下员工: ${notFound.join(', ')}`);
        setLoading(false);
        return;
      }

      const ids = employees.map((e) => e.id);

      let resData: any;
      switch (evalType) {
        case 'technical':
          resData = (await evaluateTechnical({ employeeIds: ids })).data;
          break;
        case 'communication':
          resData = (await evaluateCommunication({ employeeIds: ids })).data;
          break;
        case 'leadership':
          resData = (await evaluateLeadership({ employeeIds: ids })).data;
          break;
        case 'rank': {
          const total =
            weights.technical + weights.communication + weights.leadership;
          if (Math.abs(total - 1) > 0.01) {
            setError(`权重之和必须为 1.0，当前为 ${total.toFixed(2)}`);
            setLoading(false);
            return;
          }
          resData = (await rank({ employeeIds: ids, metrics: weights })).data;
          break;
        }
      }
      setResult({ employees, ...resData });
    } catch (err) {
      setError(err instanceof Error ? err.message : '评估请求失败');
    } finally {
      setLoading(false);
    }
  };

  const normalizeWeights = () => {
    const total =
      weights.technical + weights.communication + weights.leadership;
    if (total === 0) return;
    setWeights({
      technical: Number((weights.technical / total).toFixed(2)),
      communication: Number((weights.communication / total).toFixed(2)),
      leadership: Number((weights.leadership / total).toFixed(2)),
    });
  };

  return (
    <div className="evaluate-page">
      <h2>📊 员工评估</h2>

      <div className="evaluate-card">
        <div className="form-group">
          <label>员工姓名（逗号分隔）</label>
          <input
            type="text"
            className="form-input"
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            placeholder="例如：张三, 李四, 王五"
          />
        </div>

        <div className="form-group">
          <label>评估类型</label>
          <div className="eval-type-grid">
            {evalTypes.map((t) => (
              <button
                key={t.value}
                className={`eval-type-btn ${evalType === t.value ? 'active' : ''}`}
                onClick={() => {
                  setEvalType(t.value);
                  setResult(null);
                  setError(null);
                }}
              >
                <span className="eval-type-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {evalType === 'rank' && (
          <div className="form-group">
            <label>评分权重（总和 = 1.0）</label>
            <div className="weight-sliders">
              <div className="weight-row">
                <span>技术</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.technical}
                  onChange={(e) =>
                    setWeights((w) => ({
                      ...w,
                      technical: Number(e.target.value),
                    }))
                  }
                />
                <span className="weight-value">{weights.technical.toFixed(2)}</span>
              </div>
              <div className="weight-row">
                <span>沟通</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.communication}
                  onChange={(e) =>
                    setWeights((w) => ({
                      ...w,
                      communication: Number(e.target.value),
                    }))
                  }
                />
                <span className="weight-value">
                  {weights.communication.toFixed(2)}
                </span>
              </div>
              <div className="weight-row">
                <span>领导力</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.leadership}
                  onChange={(e) =>
                    setWeights((w) => ({
                      ...w,
                      leadership: Number(e.target.value),
                    }))
                  }
                />
                <span className="weight-value">
                  {weights.leadership.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={normalizeWeights}
            >
              归一化权重
            </button>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '⏳ 评估中...' : '开始评估'}
        </button>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}

      {result !== null && (
        <div className="result-card">
          <h3>评估结果</h3>
          <pre className="result-json">
            {JSON.stringify(result as object, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
