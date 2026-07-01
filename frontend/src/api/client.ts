// 后端统一响应格式
export interface ResponseData<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

// 查询请求
export interface QueryRequest {
  question: string;
  sessionId?: string;
}

// 查询响应
export interface QueryResponse {
  sessionId: string;
  result: {
    answer: string;
    steps: number;
    toolCalls: string[];
  };
  message: string;
}

// 会话历史消息
export interface HistoryMessage {
  role: string;
  content: string;
  timestamp?: string;
}

// 会话列表项
export interface SessionItem {
  id: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  closedAt: string | null;
  lastMessage: string;
  messageCount: number;
}

// 历史响应
export interface HistoryResponse {
  sessionId: string;
  messages: HistoryMessage[];
  count: number;
}

// 评估请求
export interface EvaluateRequest {
  employeeIds: number[];
}

// 排名请求
export interface RankRequest {
  employeeIds: number[];
  metrics: Record<string, number>;
}

// 健康检查响应
export interface HealthResponse {
  status: string;
  timestamp: string;
}

const BASE_URL = '/api';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ResponseData<T>> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: ResponseData<T> = await response.json();
  if (data.code !== 0) {
    throw new Error(data.msg || '请求失败');
  }
  return data;
}

// 智能查询
export async function query(req: QueryRequest): Promise<ResponseData<QueryResponse>> {
  return request<QueryResponse>('/query', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export interface StreamChunk {
  text?: string;
  done?: boolean;
  sessionId?: string;
  error?: string;
}

export async function* streamQuery(
  prompt: string,
  sessionId?: string,
  signal?: AbortSignal
): AsyncGenerator<StreamChunk> {
  const params = new URLSearchParams();
  params.set('prompt', prompt);
  if (sessionId) {
    params.set('sessionId', sessionId);
  }

  const response = await fetch(`${BASE_URL}/stream?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('ReadableStream not available');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);

      try {
        const parsed: StreamChunk = JSON.parse(data);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        yield parsed;
      } catch (err) {
        if (err instanceof Error && !data.includes('error')) {
        } else {
          throw err;
        }
      }
    }
  }
}

// 获取会话列表
export async function listSessions(
  userId?: string,
  activeOnly = false
): Promise<ResponseData<{ total: number; sessions: SessionItem[] }>> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (activeOnly) params.set('activeOnly', 'true');
  const qs = params.toString() ? `?${params.toString()}` : '';
  return request(`/sessions${qs}`);
}

// 获取会话历史
export async function getHistory(
  sessionId: string,
  limit = 20
): Promise<ResponseData<HistoryResponse>> {
  return request<HistoryResponse>(`/sessions/${sessionId}/history?limit=${limit}`);
}

// 关闭会话
export async function closeSession(
  sessionId: string
): Promise<ResponseData<{ sessionId: string; status: string }>> {
  return request(`/sessions/${sessionId}/close`, { method: 'POST' });
}

// 技术评估
export async function evaluateTechnical(
  req: EvaluateRequest
): Promise<ResponseData<{ total: number; evaluations: unknown[] }>> {
  return request('/evaluate/technical', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// 沟通评估
export async function evaluateCommunication(
  req: EvaluateRequest
): Promise<ResponseData<{ total: number; evaluations: unknown[] }>> {
  return request('/evaluate/communication', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// 领导力评估
export async function evaluateLeadership(
  req: EvaluateRequest
): Promise<ResponseData<{ total: number; evaluations: unknown[] }>> {
  return request('/evaluate/leadership', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// 综合排名
export async function rank(
  req: RankRequest
): Promise<ResponseData<unknown>> {
  return request('/rank', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// 根据姓名查找员工
export async function findEmployeesByNames(
  names: string[]
): Promise<ResponseData<{ employees: { id: number; name: string }[] }>> {
  return request('/find-employees', {
    method: 'POST',
    body: JSON.stringify({ names }),
  });
}

// 健康检查
export async function health(): Promise<ResponseData<HealthResponse>> {
  return request<HealthResponse>('/health');
}
