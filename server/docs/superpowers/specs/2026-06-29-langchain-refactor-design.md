# Vercel AI SDK 重构为 LangChain.js - 设计规格

## 1. 概述

### 1.1 目的

本规格描述将项目中 Vercel AI SDK 技术栈重构为 LangChain.js 的详细设计。重构目标是使用 LangChain.js 的 Agent 框架完整替换当前的 Vercel AI SDK 实现，保留所有现有功能。

### 1.2 范围

- 后端服务：`server/src/modules/` 下的 AI 相关模块
- 涉及文件：
  - `package.json` - 依赖变更
  - `agent.service.ts` - Agent 核心逻辑
  - `tool-registry.service.ts` - 工具注册
  - `streaming.controller.ts` - 流式响应

### 1.3 成功标准

- 所有现有 API 接口保持兼容（请求/响应格式不变）
- 智能查询功能正常工作（对话、工具调用、评估、排名）
- 流式响应功能正常工作
- 后端服务可正常启动和运行

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      重构后架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  QueryController                                                │
│       │                                                          │
│       └── AgentService                                          │
│               │                                                  │
│               ├── AgentExecutor.invoke() / .stream()            │
│               │       │                                          │
│               │       ├── agent: createToolCallingAgent()       │
│               │       │       │                                  │
│               │       │       ├── llm: ChatOpenAI                │
│               │       │       ├── tools: DynamicStructuredTool[]│
│               │       │       └── prompt: ChatPromptTemplate     │
│               │       │                                          │
│               │       ├── tools: DynamicStructuredTool[]         │
│               │       └── memory: BufferMemory (可选)            │
│               │                                                  │
│               └── SessionService (保持不变)                      │
│                                                                 │
│  ToolRegistryService                                            │
│       │                                                          │
│       ├── DynamicStructuredTool[]                               │
│       │                                                          │
│       ├── QueryToolsService      (保持不变)                     │
│       ├── EmployeeToolsService   (保持不变)                     │
│       ├── UtilityToolsService    (保持不变)                     │
│       └── AnalysisToolsService   (保持不变)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 组件职责

| 组件 | 职责 | 状态 |
|------|------|------|
| `AgentService` | 创建并执行 LangChain Agent | 重写 |
| `ToolRegistryService` | 注册 LangChain DynamicStructuredTool | 重写 |
| `StreamingController` | 提供流式响应接口 | 重写 |
| `ChatOpenAI` | LangChain LLM 接口（配置智谱 baseURL） | 新增 |
| `AgentExecutor` | LangChain Agent 执行器 | 新增 |
| `DynamicStructuredTool` | LangChain 工具定义 | 新增 |
| `BufferMemory` | 对话历史管理 | 新增（可选） |

---

## 3. 核心模块设计

### 3.1 依赖配置

**新增依赖：**

| 包名 | 版本 | 用途 |
|------|------|------|
| `langchain` | ^0.3.0 | 核心包（Agent、Chain、Memory） |
| `@langchain/openai` | ^0.3.0 | OpenAI 兼容 LLM 接口 |
| `@langchain/core` | ^0.3.0 | 核心抽象（Tool、Prompt、Message） |

**移除依赖：**

| 包名 | 原因 |
|------|------|
| `ai` | Vercel AI SDK 核心包 |
| `@ai-sdk/openai-compatible` | OpenAI 兼容层 |
| `@ai-sdk/openai` | OpenAI 提供商（未使用） |
| `@ai-sdk/anthropic` | Anthropic 提供商（未使用） |

### 3.2 LLM 模型配置

```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  modelName: process.env.OPEN_MODEL || 'glm-4-flash',
  baseURL: process.env.OPEN_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.OPEN_API_KEY || '',
  temperature: 0.1,
});
```

### 3.3 工具注册

将 Vercel AI SDK 的 `tool()` 替换为 LangChain 的 `DynamicStructuredTool.create()`：

```typescript
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

DynamicStructuredTool.create({
  name: 'query_by_structure',
  description: '按结构化条件查询员工，支持部门、职位、薪酬等级、年龄范围等条件',
  schema: z.object({
    conditions_json: z.string().describe('JSON格式的查询条件'),
  }),
  func: async ({ conditions_json }) => {
    return await this.queryTools.queryByStructure(conditions_json);
  },
});
```

### 3.4 Agent 创建

```typescript
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const prompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['placeholder', '{chat_history}'],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);

const agent = createToolCallingAgent({
  llm: this.getModel(),
  tools: this.toolRegistry.getLangChainTools(),
  prompt,
});

const executor = new AgentExecutor({
  agent,
  tools: this.toolRegistry.getLangChainTools(),
  verbose: true,
});
```

### 3.5 同步调用

```typescript
const result = await executor.invoke({
  input: question,
  chat_history: conversationHistory,
});

return {
  success: true,
  data: {
    answer: result.output,
    steps: result.steps?.length || 0,
    toolCalls: result.steps?.flatMap(s => s.toolCalls?.map(tc => tc.toolName) || []) || [],
  },
  message: '查询完成',
};
```

### 3.6 流式调用

```typescript
import { AgentStreamingType } from 'langchain/agents';

const stream = await executor.stream(
  { input: prompt, chat_history: [] },
  { streamingType: AgentStreamingType.Tokens }
);

for await (const chunk of stream) {
  if (chunk.output) {
    res.write(`data: ${JSON.stringify({ text: chunk.output })}\n\n`);
  }
}
res.write('data: [DONE]\n\n');
res.end();
```

---

## 4. 文件详细设计

### 4.1 `package.json` 修改

```json
{
  "dependencies": {
    "@langchain/openai": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "langchain": "^0.3.0",
    "@nestjs/common": "^11.1.24",
    "@nestjs/config": "^4.0.4",
    "@nestjs/core": "^11.1.24",
    "@nestjs/platform-express": "^11.1.24",
    "@nestjs/swagger": "^11.4.4",
    "@nestjs/typeorm": "^11.0.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "ioredis": "^5.11.0",
    "mysql2": "^3.22.4",
    "nest-winston": "^1.10.2",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "typeorm": "^1.0.0",
    "uuid": "^14.0.0",
    "winston": "^3.19.0",
    "zod": "^4.4.3"
  }
}
```

### 4.2 `agent.service.ts` 设计

**功能：**
- 创建 LangChain ChatOpenAI 模型
- 构建系统提示词
- 创建 AgentExecutor 并执行
- 支持同步调用和流式调用

**核心方法：**

| 方法 | 功能 | 参数 | 返回值 |
|------|------|------|--------|
| `getModel()` | 创建 ChatOpenAI 实例 | 无 | `ChatOpenAI` |
| `buildSystemPrompt()` | 构建系统提示词 | 无 | `string` |
| `queryWithAgent()` | 执行同步查询 | `question: string`, `conversationHistory: any[]` | `Promise<any>` |
| `streamWithAgent()` | 执行流式查询 | `prompt: string` | `AsyncGenerator<string>` |

### 4.3 `tool-registry.service.ts` 设计

**功能：**
- 注册所有工具为 LangChain DynamicStructuredTool
- 提供工具数组供 Agent 使用

**工具列表：**

| 工具名 | 描述 | 输入参数 |
|--------|------|----------|
| `query_by_structure` | 按结构化条件查询员工 | `conditions_json: string` |
| `search_by_keyword` | 按关键词搜索员工 | `keyword: string` |
| `get_employee_info` | 获取员工详细信息 | `employee_id: number` |
| `get_employee_projects` | 获取员工项目经历 | `employee_id: number` |
| `get_employee_feedback` | 获取员工反馈评价 | `employee_id: number`, `limit?: number` |
| `format_employee_data` | 格式化员工数据 | `employee: any` |
| `summarize_projects` | 总结项目经历 | `projects: any[]` |
| `summarize_feedback` | 总结反馈数据 | `feedbacks: any` |
| `format_comparison` | 格式化员工对比 | `employees: any[]` |
| `extract_key_insights` | 提取关键信息 | `employee_data: any` |
| `evaluate_technical_strength` | 评估技术能力 | `employee_id: number` |
| `evaluate_communication_ability` | 评估沟通能力 | `employee_id: number` |
| `evaluate_leadership_ability` | 评估领导力 | `employee_id: number` |
| `rank_candidates` | 综合排名候选人 | `employee_ids: number[]`, `weights?: object` |

### 4.4 `streaming.controller.ts` 设计

**功能：**
- 提供测试接口
- 提供 Observable 流式响应示例
- 提供 SSE 流式响应示例
- 提供 AI 流式响应接口（使用 LangChain）

---

## 5. 接口兼容性

所有现有 API 接口保持兼容，请求和响应格式不变：

| 接口 | 方法 | 兼容性 |
|------|------|--------|
| `/api/query` | POST | 完全兼容 |
| `/api/stream` | GET | 完全兼容 |
| `/api/sessions` | GET | 保持不变 |
| `/api/sessions/:sessionId/history` | GET | 保持不变 |
| `/api/sessions/:sessionId/close` | POST | 保持不变 |
| `/api/evaluate/technical` | POST | 保持不变 |
| `/api/evaluate/communication` | POST | 保持不变 |
| `/api/evaluate/leadership` | POST | 保持不变 |
| `/api/rank` | POST | 保持不变 |
| `/api/health` | GET | 保持不变 |

---

## 6. 测试策略

1. **单元测试**：验证各工具服务的方法正确性
2. **集成测试**：验证 Agent 调用流程
3. **API 测试**：验证接口响应格式
4. **手动测试**：验证端到端功能

---

## 7. 部署与运行

部署方式不变：

```bash
cd server
npm install
npm run start:dev
```

环境变量配置不变：

```bash
OPEN_MODEL=glm-4-flash
OPEN_BASE_URL=https://open.bigmodel.cn/api/paas/v4
OPEN_API_KEY=your-api-key
```

---

## 附录：术语对照表

| Vercel AI SDK | LangChain.js |
|---------------|--------------|
| `generateText()` | `AgentExecutor.invoke()` |
| `streamText()` | `AgentExecutor.stream()` |
| `tool()` | `DynamicStructuredTool.create()` |
| `createOpenAICompatible()` | `ChatOpenAI` + `baseURL` |
| `stepCountIs()` | AgentExecutor 的 `maxIterations` |
| `messages` 数组 | `chat_history` + `input` |