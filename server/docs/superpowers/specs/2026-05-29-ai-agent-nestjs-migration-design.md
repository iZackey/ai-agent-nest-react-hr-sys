# AI Agent 智能员工查询系统 — Python 到 NestJS 迁移设计

**日期:** 2026-05-29
**状态:** 已通过
**源项目:** `app-ai-agent-test` (Python/FastAPI)
**目标项目:** `app-ai-agent-test-nestjs` (TypeScript/NestJS)

## 1. 概述

将智能员工查询 AI Agent 系统从 Python/FastAPI 迁移到 TypeScript/NestJS，保留全部功能、API 兼容性和数据库 schema，同时将 Agent 循环从手动正则解析的 ReAct 模式升级为 Vercel AI SDK 原生工具调用。

### 迁移策略

采用模块级 1:1 映射，将 Python 模块直接对应到 NestJS 概念，在降低结构性风险的同时充分利用 NestJS 惯例。

## 2. 技术栈映射

| 层级 | Python（源） | NestJS（目标） |
|------|-------------|----------------|
| 语言 | Python 3.12 | TypeScript 5.x |
| 框架 | FastAPI 0.104 | NestJS 10+ |
| 运行时 | Uvicorn | ts-node / node |
| ORM | SQLAlchemy 2.0 | TypeORM |
| 数据库 | MySQL 8.0 (PyMySQL) | MySQL 8.0 (mysql2) |
| 数据验证 | Pydantic v2 | class-validator + class-transformer |
| AI/Agent | LangChain + LangGraph | Vercel AI SDK (@ai-sdk/core) |
| 主 LLM | Anthropic Claude (claude-opus-4-6) | @ai-sdk/anthropic |
| 副 LLM | 通义千问 (OpenAI 兼容接口) | @ai-sdk/openai (兼容模式) |
| 流式输出 | sse-starlette | @Sse() 装饰器 + Observable |
| 配置管理 | pydantic-settings | @nestjs/config |
| 日志 | RotatingFileHandler | nest-winston / NestJS Logger |
| 缓存 | (计划中，未实现) | @nestjs/cache-manager + ioredis |
| API 文档 | (无) | @nestjs/swagger |
| 测试 | pytest | Jest + @nestjs/testing |
| 容器化 | Docker + Compose | Docker + Compose |

## 3. 项目结构

```
app-ai-agent-test-nestjs/
├── src/
│   ├── main.ts                          # NestJS 启动入口
│   ├── app.module.ts                    # 根模块
│   ├── config/
│   │   └── configuration.ts             # 环境变量配置 (@nestjs/config)
│   ├── core/
│   │   ├── constants.ts                 # 常量定义
│   │   └── exceptions/                  # 自定义异常体系
│   │       ├── app.exception.ts
│   │       ├── validation.exception.ts
│   │       ├── session.exception.ts
│   │       ├── agent.exception.ts
│   │       ├── database.exception.ts
│   │       └── tool.exception.ts
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # 全局异常过滤器
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts    # 日志拦截器
│   │   ├── dto/
│   │   │   └── response.dto.ts           # 统一响应格式 ResponseData
│   │   └── decorators/                   # 自定义装饰器
│   ├── db/
│   │   └── database.module.ts            # TypeORM 数据库模块
│   ├── models/                           # TypeORM 实体
│   │   ├── base.entity.ts
│   │   ├── employee.entity.ts
│   │   ├── project.entity.ts
│   │   ├── employee-project.entity.ts
│   │   ├── employee-feedback.entity.ts
│   │   ├── session.entity.ts
│   │   └── conversation-message.entity.ts
│   ├── schemas/                          # DTO + 数据验证
│   │   ├── query.schema.ts
│   │   ├── employee.schema.ts
│   │   ├── evaluate.schema.ts
│   │   └── validators.ts
│   ├── modules/
│   │   ├── agent/
│   │   │   ├── agent.module.ts
│   │   │   ├── agent.service.ts          # ReAct Agent 核心服务
│   │   │   └── agent.controller.ts       # Agent 测试接口
│   │   ├── session/
│   │   │   ├── session.module.ts
│   │   │   └── session.service.ts        # 会话管理服务
│   │   ├── tools/
│   │   │   ├── tools.module.ts
│   │   │   ├── tool-registry.service.ts  # 工具注册中心
│   │   │   ├── query-tools.service.ts    # 查询工具
│   │   │   ├── employee-tools.service.ts # 员工数据工具
│   │   │   ├── analysis-tools.service.ts # 分析评估工具
│   │   │   └── utility-tools.service.ts  # 格式化工具
│   │   ├── query/
│   │   │   ├── query.module.ts
│   │   │   └── query.controller.ts       # 主查询、会话、评估、排名接口
│   │   ├── redis/
│   │   │   ├── redis.module.ts           # Redis 缓存模块
│   │   │   └── redis.service.ts
│   │   └── streaming/
│   │       ├── streaming.module.ts
│   │       └── streaming.controller.ts   # SSE + 流式输出接口
│   └── utils/
│       ├── logger.ts                     # 日志封装
│       └── cost-tracker.ts               # API 成本追踪
├── sql/
│   └── schema.sql                        # 复用源项目 SQL
├── scripts/
│   ├── init-db.ts                        # 数据库初始化脚本
│   └── seed-data.ts                      # 种子数据生成脚本
├── static/                               # 前端静态文件
│   ├── index.html
│   └── sse.html
├── test/                                 # Jest 测试
│   ├── unit/
│   └── e2e/
├── docker-compose.yml
├── Dockerfile
├── .env
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

## 4. 数据库层 (TypeORM)

### 实体定义

6 个实体直接映射源项目的 6 张数据表：

- **BaseEntity** — `id` (UUID), `created_at`, `updated_at` 基础字段
- **Employee（员工）** — 姓名、年龄、邮箱、电话、部门、职位、入职日期、薪资等级、状态、直属上级 (manager_id 自关联)
- **Project（项目）** — 名称、描述、起止日期、复杂度
- **EmployeeProject（员工-项目关联）** — 员工ID、项目ID、角色、技术栈、贡献等级、参与起止日期
- **EmployeeFeedback（员工反馈）** — 员工ID、类别、评分、反馈内容、评价人
- **ConversationSession（对话会话）** — UUID 主键、用户ID、是否活跃、元数据 (JSON)、最后活动时间
- **ConversationMessage（对话消息）** — UUID 主键、会话ID (外键)、角色 (枚举: user/assistant)、内容 (TEXT)

### 数据库配置

- `synchronize: false` — schema 由 SQL 脚本管理，不自动同步
- 连接池：poolSize=20
- 复用源项目 `sql/schema.sql` 进行初始化

## 5. ReAct Agent 核心实现

### 核心改进：Vercel AI SDK 原生工具调用

用 Vercel AI SDK 内置的工具调用替代源项目手动正则解析的 ReAct 循环：

```typescript
const result = await generateText({
  model: this.getModel(),
  system: systemPrompt,
  messages: [...history, { role: 'user', content: question }],
  tools: this.toolRegistry.getVercelTools(),
  maxSteps: 6,  // 对应源项目 AGENT_MAX_ITERATIONS
});
```

### Agent Service 职责

1. 通过 Vercel AI SDK 自动构建包含工具描述的系统提示词
2. 从 SessionService 加载对话历史
3. 执行 `generateText`，传入工具定义和最大迭代步数
4. 将用户提问和助手回答持久化到会话
5. 返回统一格式的响应

### 工具注册表

13 个工具以 Vercel AI SDK `tool()` 格式注册，使用 Zod schema 做参数校验：

| 分类 | 工具列表 |
|------|---------|
| 查询 | `query_by_structure`（结构化条件查询）、`search_by_keyword`（模糊搜索） |
| 员工数据 | `get_employee_info`（员工详情）、`get_employee_projects`（员工项目）、`get_employee_feedback`（员工反馈） |
| 格式化 | `format_employee_data`（格式化员工数据）、`summarize_projects`（项目摘要）、`summarize_feedback`（反馈摘要）、`format_comparison`（对比格式化）、`extract_key_insights`（关键洞察提取） |
| 分析评估 | `evaluate_technical_strength`（技术实力评估）、`evaluate_communication_ability`（沟通能力评估）、`evaluate_leadership_ability`（领导力评估）、`rank_candidates`（候选人排名） |

每个工具统一返回 `{ success: boolean, data: any, message: string }` 格式。

### LLM 提供商切换

通过环境变量 `LLM_PROVIDER` 控制使用的模型：

- `anthropic` → `@ai-sdk/anthropic`，使用 `claude-opus-4-6` 模型
- `qwen`（默认）→ `@ai-sdk/openai`，baseURL 指向 `https://dashscope.aliyuncs.com/compatible-mode/v1`

## 6. API 路由（完全兼容源项目）

所有路由使用 `/api` 前缀，返回 `ResponseData(code, data, msg)` 统一响应格式。

| 方法 | 路径 | 控制器 | 处理方法 |
|------|------|--------|---------|
| POST | `/api/query` | QueryController | query() |
| GET | `/api/sessions/:sessionId/history` | QueryController | getSessionHistory() |
| POST | `/api/sessions/:sessionId/close` | QueryController | closeSession() |
| POST | `/api/evaluate/technical` | QueryController | evaluateTechnical() |
| POST | `/api/evaluate/communication` | QueryController | evaluateCommunication() |
| POST | `/api/evaluate/leadership` | QueryController | evaluateLeadership() |
| POST | `/api/rank` | QueryController | rankCandidates() |
| POST | `/api/test` | StreamingController | test() |
| GET | `/api/streamingResponse` | StreamingController | streamingResponse() |
| GET | `/api/eventSourceResponse` | StreamingController | eventSourceResponse() |
| GET | `/api/stream` | StreamingController | stream() |
| GET | `/api/health` | AppController | health() |

静态文件挂载在 `/static` 路径。

Swagger API 文档访问地址：`/api/docs`。

## 7. Redis 缓存

源项目未实现的新增功能，用于缓存热点数据：

- 员工详情查询（TTL: 5 分钟）
- 项目列表（TTL: 5 分钟）
- 相同问题的 Agent 响应（TTL: 1 分钟）
- 会话历史（TTL: 10 分钟）

通过 CacheModule 集成到 QueryToolsService 和 EmployeeToolsService 中。

## 8. 流式输出 / SSE

| 端点 | 实现方式 |
|------|---------|
| `/api/streamingResponse` | `@StreamableFile()` 或自定义 Observable，逐字符输出 |
| `/api/eventSourceResponse` | `@Sse()` 装饰器，返回 `Observable<MessageEvent>` |
| `/api/stream` | Vercel AI SDK `streamText()` → `textStream` → SSE 事件流 |

前端演示页面复用源项目的 HTML 文件。

## 9. 异常处理

自定义异常体系，映射源项目的异常层级：

- `AppException`（基类，继承 HttpException）
  - `ValidationException`（数据验证异常）
  - `SessionException`（会话异常）
  - `AgentException`（Agent 异常）
  - `DatabaseException`（数据库异常）
  - `ToolException`（工具异常）

全局 `HttpExceptionFilter` 统一捕获所有异常，返回 `ResponseData(code, data, msg)` 格式。

## 10. 环境变量配置

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=employee_agent

# LLM 配置
LLM_PROVIDER=qwen                    # anthropic | qwen
CLAUDE_API_KEY=                       # Anthropic API 密钥
OPEN_API_KEY=                         # 通义千问/DashScope API 密钥

# Agent 配置
AGENT_MAX_ITERATIONS=6

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 服务端口
PORT=8000
```

## 11. 测试

- **单元测试：** 使用 Jest mock 测试每个 Service（工具、Agent、会话）
- **E2E 测试：** 使用测试数据库验证 API 端点
- **覆盖率目标：** 与源项目测试覆盖率对齐

## 12. Docker

- 多阶段 Dockerfile：build → production
- docker-compose：app + mysql + redis 三个服务
- 开发环境通过 `nest start --watch` 实现热重载
