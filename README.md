# 智能员工查询 AI Agent 系统

基于 NestJS + React 的智能员工查询 AI Agent 系统，集成大语言模型实现自然语言查询、员工评估和综合排名功能。

## 📋 功能介绍

### 核心功能

| 功能模块 | 描述 |
| :--- | :--- |
| **智能对话** | 通过自然语言查询员工信息，支持多轮对话 |
| **员工查询** | 按条件查询、关键词搜索员工信息 |
| **项目经历** | 获取员工的项目历史记录和技术栈 |
| **反馈评价** | 查看员工的反馈评分和评价内容 |
| **能力评估** | 评估员工的技术能力、沟通能力、领导力 |
| **综合排名** | 对候选员工进行多维度综合评分和排名 |
| **流式响应** | 支持 SSE 实时流式输出 |

### 工具能力

- **查询工具**：按结构化条件查询、关键词搜索
- **员工工具**：获取员工详细信息、项目经历、反馈评价
- **格式化工具**：数据格式化、项目总结、反馈总结、对比分析
- **分析工具**：技术能力评估、沟通能力评估、领导力评估、综合排名

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ ChatPage │  │Evaluate │  │ History  │  │  Status  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐      │
│  │                    API Client                     │      │
│  └──────────────────────────┬───────────────────────┘      │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP / SSE
┌─────────────────────────────▼───────────────────────────────┐
│                       后端 (NestJS)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Query    │  │Streaming │  │ Session  │  │  Agent   │    │
│  │Controller│  │Controller│  │ Service  │  │ Service  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐      │
│  │                   ToolRegistry                     │      │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│      │
│  │  │QueryTools│ │Employee  │ │ Utility  │ │Analysis ││      │
│  │  │         │ │ Tools    │ │ Tools    │ │ Tools   ││      │
│  │  └─────────┘ └──────────┘ └──────────┘ └─────────┘│      │
│  └──────────────────────────┬───────────────────────┘      │
│                             │                              │
│  ┌──────────────────────────▼──────────────────────────┐    │
│  │              LangChain.js Agent 核心                 │    │
│  │  ┌────────────┐ ┌──────────────┐ ┌──────────────┐  │    │
│  │  │ ChatOpenAI │ │ AgentExecutor │ │DynamicStruc- │  │    │
│  │  │  (智谱GLM) │ │ createTool-   │ │ turedTool[] │  │    │
│  │  │            │ │ CallingAgent  │ │              │  │    │
│  │  └────────────┘ └──────────────┘ └──────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌─────────┐    ┌─────────┐    ┌─────────┐
         │  MySQL  │    │  Redis  │    │   LLM   │
         │         │    │         │    │(GLM-4)  │
         └─────────┘    └─────────┘    └─────────┘
```

## 🛠️ 技术栈

### 后端

| 技术 | 版本 | 用途 |
| :--- | :--- | :--- |
| NestJS | ^11.1.24 | 后端框架 |
| TypeORM | ^1.0.0 | ORM 框架 |
| MySQL2 | ^3.22.4 | 数据库驱动 |
| Redis (ioredis) | ^5.11.0 | 缓存 |
| LangChain.js | ^0.3.0 | AI Agent 框架（Agent、Chain、Memory） |
| @langchain/core | ^0.3.0 | 核心抽象（Tool、Prompt、Message） |
| @langchain/openai | ^0.3.0 | OpenAI 兼容 LLM 接口 |
| 智谱 GLM-4-Flash | - | 大语言模型 |
| Swagger | ^11.4.4 | API 文档 |
| Winston | ^3.19.0 | 日志 |
| Zod | ^4.4.3 | 数据验证 |

### 前端

| 技术 | 版本 | 用途 |
| :--- | :--- | :--- |
| React | ^19.2.6 | 前端框架 |
| React Router DOM | ^7.16.0 | 路由 |
| Vite | ^8.0.12 | 构建工具 |
| TypeScript | ~6.0.2 | 类型语言 |

## 🚀 运行方式

### 环境要求

- Node.js >= 18.x
- MySQL >= 8.0
- Redis >= 6.0

### 后端启动

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 创建数据库
mysql -u root -p -e "CREATE DATABASE employee_agent;"

# 导入数据库表结构
mysql -u root -p employee_agent < sql/schema.sql

# （可选）导入示例数据
npm run seed

# 启动开发服务器
npm run start:dev
```

后端服务默认运行在 `http://localhost:8000`，Swagger 文档地址：`http://localhost:8000/api/docs`

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务默认运行在 `http://localhost:5173`

### 环境配置

后端 `.env` 文件配置项：

| 配置项 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `PORT` | 服务端口 | 8000 |
| `DB_HOST` | 数据库地址 | localhost |
| `DB_PORT` | 数据库端口 | 3306 |
| `DB_USERNAME` | 数据库用户名 | root |
| `DB_PASSWORD` | 数据库密码 | root |
| `DB_DATABASE` | 数据库名称 | employee_agent |
| `OPEN_API_KEY` | 智谱 API Key | - |
| `OPEN_MODEL` | LLM 模型 | glm-4-flash |
| `OPEN_BASE_URL` | API 基础地址 | https://open.bigmodel.cn/api/paas/v4 |
| `REDIS_HOST` | Redis 地址 | localhost |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `AGENT_MAX_ITERATIONS` | Agent 最大迭代次数 | 6 |

## 🔌 API 接口

### 核心接口

| 接口 | 方法 | 描述 |
| :--- | :--- | :--- |
| `/api/query` | POST | 智能查询 |
| `/api/stream` | GET | 流式响应 |
| `/api/sessions` | GET | 获取会话列表 |
| `/api/sessions/:sessionId/history` | GET | 获取会话历史 |
| `/api/sessions/:sessionId/close` | POST | 关闭会话 |
| `/api/evaluate/technical` | POST | 技术能力评估 |
| `/api/evaluate/communication` | POST | 沟通能力评估 |
| `/api/evaluate/leadership` | POST | 领导力评估 |
| `/api/rank` | POST | 综合排名 |
| `/api/health` | GET | 健康检查 |

## 📁 项目结构

```
app-ai-agent-nest-react/
├── frontend/                    # 前端代码
│   ├── src/
│   │   ├── api/                # API 客户端
│   │   ├── components/         # UI 组件
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── pages/              # 页面组件
│   │   └── App.tsx             # 应用入口
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                     # 后端代码
│   ├── src/
│   │   ├── common/             # 公共模块（过滤器、拦截器）
│   │   ├── config/             # 配置文件
│   │   ├── core/               # 核心异常和常量
│   │   ├── db/                 # 数据库模块
│   │   ├── models/             # 数据库实体
│   │   ├── modules/            # 业务模块
│   │   │   ├── agent/          # AI Agent 核心
│   │   │   ├── query/          # 查询控制器
│   │   │   ├── redis/          # Redis 模块
│   │   │   ├── session/        # 会话管理
│   │   │   ├── streaming/      # 流式响应
│   │   │   └── tools/          # 工具服务
│   │   ├── schemas/            # 验证 Schema
│   │   └── main.ts             # 应用入口
│   ├── sql/                    # 数据库脚本
│   ├── .env                    # 环境变量
│   └── package.json
└── .gitignore
```

## 📝 开发命令

### 后端

| 命令 | 描述 |
| :--- | :--- |
| `npm run start:dev` | 开发模式运行 |
| `npm run start:prod` | 生产模式运行 |
| `npm run build` | 构建项目 |
| `npm run lint` | 代码检查 |
| `npm run test` | 运行测试 |
| `npm run seed` | 导入示例数据 |

### 前端

| 命令 | 描述 |
| :--- | :--- |
| `npm run dev` | 开发模式运行 |
| `npm run build` | 构建项目 |
| `npm run lint` | 代码检查 |
| `npm run preview` | 预览构建结果 |

## 📄 License

MIT License
