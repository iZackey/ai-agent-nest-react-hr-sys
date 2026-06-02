# 🤖 员工智能查询 AI Agent 系统

基于 NestJS 构建的智能员工查询 AI Agent 系统。利用大语言模型（LLM）驱动的 Agent，支持自然语言查询员工信息、评估员工能力、候选人排名等功能。项目从 Python/FastAPI 迁移而来，使用 Vercel AI SDK 实现工具调用（Tool Calling），替代原始的 ReAct 循环 + 正则解析方案。

## 目录

- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [AI 模型接入](#ai-模型接入)
- [接口文档](#接口文档)
- [工具清单](#工具清单)
- [数据库设计](#数据库设计)
- [Docker 部署](#docker-部署)
- [开发指南](#开发指南)

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **语言** | TypeScript 5.x | 目标 ES2023 |
| **框架** | NestJS 11.x | 渐进式 Node.js 后端框架 |
| **运行时** | Node.js 20 | Docker 镜像基于 node:20-slim |
| **ORM** | TypeORM 1.0 | MySQL 数据库 ORM |
| **数据库** | MySQL 8.0 | 通过 mysql2 驱动连接 |
| **缓存** | Redis 7 | 通过 ioredis 连接 |
| **AI SDK** | Vercel AI SDK (`ai` v6.x) | 统一的 LLM 调用与工具编排 |
| **模型校验** | class-validator + class-transformer | DTO 校验 |
| **工具参数校验** | Zod 4.x | Agent Tool 参数 Schema |
| **API 文档** | @nestjs/swagger | Swagger UI 可视化文档 |
| **日志** | Winston 3.x (nest-winston) | 结构化日志 |
| **测试** | Jest + ts-jest + supertest | 单元测试与 E2E 测试 |
| **容器化** | Docker + docker-compose | 多阶段构建，一键部署 |

---

## 功能特性

### 🧠 智能对话查询

- 支持自然语言提问，AI Agent 自动理解意图并调用相应工具
- 多轮对话支持，维护完整会话上下文
- 会话管理（创建、查询、关闭）

### 👤 员工信息查询

- 按组织结构查询（部门、职位、薪资级别、年龄范围）
- 关键词模糊搜索（姓名、部门、职位）
- 员工详细信息查看（含项目经历、反馈评价）

### 📊 能力评估

- **技术能力评估** — 基于项目复杂度、技术栈广度、贡献度综合评分
- **沟通能力评估** — 基于沟通协作类反馈评分
- **领导力评估** — 基于团队规模、职级权重、领导力反馈评分

### 🏆 候选人排名

- 支持自定义权重（技术 / 沟通 / 领导力），权重总和须为 1.0
- 返回加权综合评分排名，自动推荐 Top 1

### 📡 流式输出

- SSE（Server-Sent Events）实时流式响应
- 支持 LLM 推理过程实时输出
- 前端 Demo 页面（`/static/sse.html`）

---

## 项目结构

```
app-ai-agent-test-nestjs/
├── .env.example                  # 环境变量模板
├── docker-compose.yml            # Docker 编排（MySQL + Redis + App）
├── Dockerfile                    # 多阶段构建
├── sql/schema.sql                # 数据库表结构 DDL
├── scripts/seed-data.ts          # 种子数据生成脚本
├── static/                       # 静态文件（SSE Demo 页面）
│   ├── index.html
│   └── sse.html
├── docs/                         # 设计文档
│   └── superpowers/
├── src/
│   ├── main.ts                   # 应用入口（端口 8000）
│   ├── app.module.ts             # 根模块
│   ├── config/
│   │   └── configuration.ts      # 环境变量配置 Schema
│   ├── core/
│   │   ├── constants.ts          # 业务常量
│   │   └── exceptions/           # 自定义异常（6 种）
│   ├── common/
│   │   ├── dto/response.dto.ts   # 统一响应格式 ResponseData<T>
│   │   ├── filters/              # 全局异常过滤器
│   │   └── interceptors/         # 请求日志拦截器
│   ├── db/
│   │   └── database.module.ts    # TypeORM 数据库连接模块
│   ├── models/                   # TypeORM 实体（7 个）
│   ├── schemas/                  # 请求 DTO 类
│   ├── modules/
│   │   ├── agent/                # Agent 服务（LLM 工具调用核心）
│   │   ├── query/                # 查询控制器（主 API）
│   │   ├── session/              # 会话管理服务
│   │   ├── tools/                # 工具注册与服务（13 个工具）
│   │   ├── redis/                # Redis 缓存服务
│   │   └── streaming/            # 流式输出控制器
│   └── utils/
│       └── cost-tracker.ts       # Token 费用估算工具
└── test/                         # E2E 测试
```

---

## 快速开始

### 前提条件

- Node.js >= 20
- MySQL 8.0
- Redis 7
- 至少一个大语言模型 API Key（智谱 / 通义千问 / Anthropic Claude）

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd app-ai-agent-test-nestjs

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库连接信息和 LLM API Key（详见配置说明）

# 4. 初始化数据库
mysql -u root -p < sql/schema.sql

# 5.（可选）生成种子数据
npm run seed

# 6. 启动开发服务器
npm run start:dev
```

服务启动后访问：

- API 服务：`http://localhost:8000`
- Swagger 文档：`http://localhost:8000/api/docs`
- SSE 聊天 Demo：`http://localhost:8000/static/sse.html`

---

## 配置说明

所有配置通过环境变量管理，参考 `.env.example` 文件：

### 应用配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `APP_NAME` | Employee Query Agent | 应用名称 |
| `APP_VERSION` | 1.0.0 | 版本号 |
| `ENVIRONMENT` | development | 运行环境（development / production） |
| `DEBUG` | true | 调试模式 |
| `LOG_LEVEL` | info | 日志级别 |
| `PORT` | 8000 | HTTP 服务端口 |

### 数据库配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DB_HOST` | localhost | MySQL 主机地址 |
| `DB_PORT` | 3306 | MySQL 端口 |
| `DB_USERNAME` | root | MySQL 用户名 |
| `DB_PASSWORD` | password | MySQL 密码 |
| `DB_DATABASE` | employee_agent | 数据库名 |

### Agent 配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `AGENT_MAX_ITERATIONS` | 6 | Agent 最大工具调用轮次 |

### Redis 配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `REDIS_HOST` | localhost | Redis 主机地址 |
| `REDIS_PORT` | 6379 | Redis 端口 |

---

## AI 模型接入

系统通过 `LLM_PROVIDER` 环境变量选择大模型提供商，支持三种 LLM 接入方案：

### 方案一：智谱 GLM（当前默认）

```env
LLM_PROVIDER=zhipu
OPEN_API_KEY=你的智谱API Key
OPEN_API_MODEL=glm-4-flash
OPEN_API_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

- 使用 `@ai-sdk/openai-compatible` 包的 `createOpenAICompatible()` 接入
- 推荐模型：`glm-4-flash`（免费额度大，响应快）
- API Key 申请：[智谱开放平台](https://open.bigmodel.cn/)

### 方案二：通义千问 Qwen

```env
LLM_PROVIDER=qwen
OPEN_API_KEY=你的通义千问API Key
OPEN_API_MODEL=qwen-plus
OPEN_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

- 同样使用 `@ai-sdk/openai-compatible` 接入（DashScope 兼容 OpenAI 接口）
- 推荐模型：`qwen-plus`
- API Key 申请：[阿里云 DashScope](https://dashscope.aliyun.com/)

### 方案三：Anthropic Claude

```env
LLM_PROVIDER=anthropic
CLAUDE_API_KEY=你的Anthropic API Key
CLAUDE_MODEL=claude-opus-4-6
```

- 使用 `@ai-sdk/anthropic` 官方 SDK 接入
- 推荐模型：`claude-opus-4-6`（当前最新）、`claude-sonnet-4-6`（性价比之选）
- API Key 申请：[Anthropic Console](https://console.anthropic.com/)

### Agent 工作流程

```
用户提问 → AgentService 构建 System Prompt
         → 加载会话历史
         → 调用 Vercel AI SDK generateText() / streamText()
         → LLM 自动选择并调用注册的工具（最多 AGENT_MAX_ITERATIONS 轮）
         → 返回 { answer, steps, toolCalls }
```

---

## 接口文档

所有接口统一使用 `/api` 前缀，响应格式为：

```json
{
  "code": 0,          // 0 表示成功，其他为错误码
  "data": {},         // 响应数据
  "msg": "success"    // 提示信息
}
```

### 智能查询

#### POST `/api/query`

自然语言 AI 查询，Agent 自动理解意图并调用工具返回结果。

**请求体：**

```json
{
  "question": "帮我查一下技术部有哪些高级工程师",
  "sessionId": "可选，传入已有会话ID实现多轮对话"
}
```

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "sessionId": "uuid-string",
    "result": {
      "answer": "技术部共有 5 名高级工程师...",
      "steps": 3,
      "toolCalls": ["query_by_structure", "format_employee_data"]
    }
  },
  "msg": "success"
}
```

### 会话管理

#### GET `/api/sessions`

获取会话列表。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `userId` | string | 否 | 按用户 ID 筛选 |
| `activeOnly` | boolean | 否 | 仅返回活跃会话 |

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "total": 10,
    "sessions": [
      { "id": "uuid", "userId": "user1", "isActive": true, "createdAt": "..." }
    ]
  },
  "msg": "success"
}
```

#### GET `/api/sessions/:sessionId/history`

获取会话聊天记录。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | number | 否 | 返回条数，默认 20 |

#### POST `/api/sessions/:sessionId/close`

关闭指定会话。

### 能力评估

#### POST `/api/evaluate/technical`

评估员工技术能力。

**请求体：**

```json
{
  "employeeIds": [1, 2, 3]
}
```

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "total": 3,
    "evaluations": [
      {
        "employeeId": 1,
        "employeeName": "张三",
        "score": 85.5,
        "details": { "projectComplexity": 90, "techDiversity": 80, "contribution": 86 }
      }
    ]
  },
  "msg": "success"
}
```

#### POST `/api/evaluate/communication`

评估员工沟通能力（请求体格式同上）。

#### POST `/api/evaluate/leadership`

评估员工领导力（请求体格式同上）。

### 候选人排名

#### POST `/api/rank`

对候选人进行加权综合排名。

**请求体：**

```json
{
  "employeeIds": [1, 2, 3],
  "metrics": {
    "technical": 0.4,
    "communication": 0.3,
    "leadership": 0.3
  }
}
```

> **注意：** `metrics` 中所有权重的总和必须为 1.0。

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "totalCandidates": 3,
    "weights": { "technical": 0.4, "communication": 0.3, "leadership": 0.3 },
    "ranking": [
      { "rank": 1, "employeeId": 2, "employeeName": "李四", "compositeScore": 88.2 },
      { "rank": 2, "employeeId": 1, "employeeName": "张三", "compositeScore": 82.5 }
    ],
    "topCandidate": { "employeeId": 2, "employeeName": "李四", "compositeScore": 88.2 }
  },
  "msg": "success"
}
```

### 流式输出

#### GET `/api/stream?prompt=你的问题`

LLM 实时流式响应（SSE 格式），支持工具调用。

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | string | 是 | 提问内容 |

**响应：** SSE 文本流，实时输出 LLM 推理内容。

#### GET `/api/streamingResponse`

字符逐个输出演示（50ms 间隔）。

#### GET `/api/eventSourceResponse`

SSE 事件流演示（500ms 间隔，10 条消息）。

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/docs` | Swagger API 文档 |
| POST | `/api/test` | 简单测试接口 |

---

## 工具清单

Agent 注册了 13 个工具供 LLM 调用，使用 Zod Schema 校验参数：

### 查询工具（query-tools）

| 工具名 | 说明 |
|--------|------|
| `query_by_structure` | 按组织结构查询员工（部门、职位、薪资级别、年龄范围） |
| `search_by_keyword` | 关键词模糊搜索（姓名、部门、职位） |

### 员工数据工具（employee-tools）

| 工具名 | 说明 |
|--------|------|
| `get_employee_info` | 根据 ID 获取员工完整信息 |
| `get_employee_projects` | 获取员工项目经历（含角色、技术栈、复杂度，最多 20 条） |
| `get_employee_feedback` | 获取员工反馈评价（含统计数据：平均分、分类统计） |

### 格式化工具（utility-tools）

| 工具名 | 说明 |
|--------|------|
| `format_employee_data` | 格式化员工数据为中文可读结构 |
| `summarize_projects` | 汇总项目经历（技术栈分布、复杂度分布、贡献度） |
| `summarize_feedback` | 按类别汇总反馈评价及平均分 |
| `format_comparison` | 并排对比多名员工数据 |
| `extract_key_insights` | 提取员工核心画像（含工龄计算） |

### 分析工具（analysis-tools）

| 工具名 | 说明 |
|--------|------|
| `evaluate_technical_strength` | 技术能力评估（项目复杂度 + 技术广度 + 贡献度） |
| `evaluate_communication_ability` | 沟通能力评估（基于沟通/协作反馈） |
| `evaluate_leadership_ability` | 领导力评估（团队规模 + 职级权重 + 领导力反馈） |
| `rank_candidates` | 候选人加权排名（默认权重：技术 40%、沟通 30%、领导力 30%） |

---

## 数据库设计

共 6 张表，定义在 `sql/schema.sql` 中：

### 表结构概览

```
┌──────────────────────┐
│      employees       │  员工表：姓名、年龄、邮箱、电话、部门、职位、
│  (INT PK, AUTO_INC)  │  薪资级别、状态、上级 ID（自引用外键）
└──────────┬───────────┘
           │
           │ N:M
┌──────────┴───────────┐
│      projects        │  项目表：名称、描述、起止日期、复杂度
│  (INT PK, AUTO_INC)  │
└──────────┬───────────┘
           │
┌──────────┴──────────────┐
│  employee_projects      │  员工-项目关联：角色、技术栈、贡献度、时间
│  (INT PK, AUTO_INC)     │
└─────────────────────────┘

┌─────────────────────────┐
│  employee_feedback      │  员工反馈：类别、评分、反馈内容、创建人
│  (INT PK, AUTO_INC)     │
└─────────────────────────┘

┌─────────────────────────────────┐
│  conversation_sessions          │  会话表：用户 ID、活跃状态、
│  (VARCHAR(36) UUID PK)          │  元数据（JSON）、时间戳
└──────────┬──────────────────────┘
           │
┌──────────┴──────────────────────┐
│  conversation_messages          │  消息表：会话 ID（外键）、
│  (VARCHAR(36) UUID PK)          │  角色、内容（LONGTEXT）
└─────────────────────────────────┘
```

### 种子数据

运行 `npm run seed` 可生成：

- **1500 名员工**（7 个部门、10 个职位、5 个薪资级别，90% 在职 / 10% 离职）
- **300 个项目**（不同复杂度：低 / 中 / 高 / 极高）
- **员工-项目关联**（每名员工 2-5 个项目，随机技术栈与贡献度）
- **员工反馈**（每名员工 2-5 条反馈，9 个类别，评分 3-5）

---

## Docker 部署

### 一键启动（推荐）

```bash
docker-compose up -d
```

包含三个服务：

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| **mysql** | mysql:8.0 | 3306 | 自动执行 `sql/schema.sql` 初始化表结构 |
| **redis** | redis:7-alpine | 6379 | 缓存服务 |
| **app** | 项目自建镜像 | 8000 | NestJS 应用，依赖 mysql 和 redis |

### Dockerfile

采用多阶段构建：

1. **Builder 阶段** — 基于 `node:20-slim`，执行 `npm ci` + `npm run build`
2. **Production 阶段** — 仅复制 `dist/`、`static/`、`sql/`，运行 `node dist/main.js`

### 自定义 Docker 环境变量

在 `docker-compose.yml` 的 `app.environment` 中修改：

```yaml
environment:
  - DB_HOST=mysql          # MySQL 服务名
  - DB_PORT=3306
  - DB_USERNAME=root
  - DB_PASSWORD=password
  - DB_DATABASE=employee_agent
  - LLM_PROVIDER=zhipu     # 选择 LLM 提供商
  - OPEN_API_KEY=你的Key
  - OPEN_API_MODEL=glm-4-flash
  - OPEN_API_BASE_URL=https://open.bigmodel.cn/api/paas/v4
  - REDIS_HOST=redis       # Redis 服务名
  - REDIS_PORT=6379
```

---

## 开发指南

### 常用命令

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run start:dev

# 编译构建
npm run build

# 生产模式运行
npm run start:prod

# 生成种子数据
npm run seed

# 运行单元测试
npm run test

# 运行 E2E 测试
npm run test:e2e

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 异常处理

项目定义了 6 种自定义异常（继承自 `HttpException`）：

| 异常类 | HTTP 状态码 | 说明 |
|--------|------------|------|
| `AppException` | 自定义 | 基础异常（携带 code、msg、data） |
| `ValidationException` | 400 | 输入校验失败 |
| `SessionException` | 400 | 会话相关错误 |
| `AgentException` | 500 | Agent 处理异常 |
| `DatabaseException` | 500 | 数据库操作异常 |
| `ToolException` | 500 | 工具执行异常 |

全局 `HttpExceptionFilter` 捕获所有异常并统一转为 `ResponseData` 格式返回。

### 新增工具

1. 在对应的工具 Service（如 `query-tools.service.ts`）中添加工具方法
2. 使用 Zod 定义参数 Schema
3. 在 `tool-registry.service.ts` 中注册工具
4. 工具返回格式统一为 `{ success: boolean, data: any, message: string }`
