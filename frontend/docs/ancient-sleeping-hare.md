# React 18 聊天 UI 项目 — 实现计划

## Context

NestJS 后端 AI Agent 系统已跑通（端口 8000），需要一个现代化的 React 前端来替代原始的 HTML 页面，提供良好的用户体验。项目独立部署在 `D:\MyProject\MyDemoProject\app-ai-agent-ui`，通过 HTTP 调用后端 API。

## 技术栈

- **React 18** + **TypeScript** + **Vite**
- **纯 CSS**（不引入 UI 框架，保持轻量）
- **fetch API** 调用后端
- 端口：`3000`（Vite 默认）

## 后端 API 接口（已验证可用）

| 接口 | 方法 | 用途 |
|------|------|------|
| `POST /api/query` | POST | 智能查询，支持 sessionId 多轮对话 |
| `GET /api/stream?prompt=xxx` | GET | SSE 流式输出 |
| `GET /api/sessions/:id/history?limit=20` | GET | 对话历史 |
| `POST /api/sessions/:id/close` | POST | 关闭会话 |
| `POST /api/evaluate/technical` | POST | 技术评估，body: {employeeIds: number[]} |
| `POST /api/evaluate/communication` | POST | 沟通评估 |
| `POST /api/evaluate/leadership` | POST | 领导力评估 |
| `POST /api/rank` | POST | 排名，body: {employeeIds, metrics} |
| `GET /api/health` | GET | 健康检查 |

统一响应格式：`{ code: 0, data: T, msg: "success" }`

流式响应格式：SSE `data: {"text": "chunk"}\n\n`，结束 `data: [DONE]\n\n`

## 功能页面

### 页面 1：智能对话（主页）
- 聊天气泡界面（用户消息靠右蓝色、AI 回复靠左白色）
- 输入框 + 发送/停止按钮，Enter 发送，Shift+Enter 换行
- 快捷提问按钮（查询技术部员工、搜索员工等）
- 打字动画加载指示器
- 多轮对话（自动携带 sessionId）
- 新建对话 / 清空对话

### 页面 2：评估功能
- 输入员工 ID 列表（逗号分隔或标签输入）
- 选择评估类型（技术/沟通/领导力/综合排名）
- 排名功能支持自定义权重滑块
- 结果以卡片/表格展示

### 页面 3：对话历史
- 输入 sessionId 查看历史记录
- 按时间线展示消息
- 关闭会话按钮

### 页面 4：系统状态
- 调用 /api/health 显示后端状态
- 显示后端版本、运行时间等

## 项目结构

```
app-ai-agent-ui/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                      # 路由配置
│   ├── App.css                      # 全局样式
│   ├── api/
│   │   └── client.ts                # fetch 封装，统一处理后端 ResponseData 格式
│   ├── hooks/
│   │   ├── useChat.ts               # 对话状态管理（消息列表、sessionId、loading）
│   │   └── useStream.ts             # SSE 流式读取 hook
│   ├── pages/
│   │   ├── ChatPage.tsx             # 智能对话页
│   │   ├── EvaluatePage.tsx         # 评估功能页
│   │   ├── HistoryPage.tsx          # 对话历史页
│   │   └── StatusPage.tsx           # 系统状态页
│   └── components/
│       ├── ChatMessage.tsx          # 单条消息气泡
│       ├── ChatInput.tsx            # 输入框 + 发送/停止按钮
│       ├── QuickSuggestions.tsx     # 快捷提问按钮组
│       ├── Sidebar.tsx              # 侧边导航栏
│       └── Layout.tsx               # 页面布局（侧边栏 + 内容区）
```

## 关键实现细节

### API Client (`src/api/client.ts`)
- 基础 URL：`http://localhost:8000`
- 统一解析 `ResponseData` 格式，code !== 0 时抛错
- 封装 `query()`、`getHistory()`、`closeSession()`、`evaluate()`、`rank()`、`health()` 方法

### SSE 流式 Hook (`src/hooks/useStream.ts`)
- 使用 `fetch` + `ReadableStream` 读取 SSE
- 解析 `data: {"text": "chunk"}` 格式
- 碰到 `data: [DONE]` 结束
- 支持 `AbortController` 中断

### useChat Hook
- 状态：messages 数组、sessionId、isLoading
- `sendMessage(question)` → 调用 `/api/query`，自动管理 sessionId
- `clearChat()` → 重置状态

### Vite 代理配置
在 `vite.config.ts` 中配置开发代理，避免 CORS 问题：
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

## 执行步骤

1. 初始化 Vite + React + TypeScript 项目
2. 安装依赖：`react-router-dom`
3. 创建 API client 封装
4. 创建 hooks（useChat, useStream）
5. 创建布局组件（Layout + Sidebar）
6. 实现聊天页面（ChatPage）
7. 实现评估页面（EvaluatePage）
8. 实现历史页面（HistoryPage）
9. 实现状态页面（StatusPage）
10. 配置 Vite 代理
11. 验证所有功能

## 验证方式

1. `npm run dev` 启动前端（端口 3000）
2. 确保 NestJS 后端运行在 8000 端口
3. 在聊天页面发送 "查询技术部的员工" 验证对话功能
4. 在评估页面输入员工 ID 验证评估功能
5. 在历史页面输入 sessionId 验证历史查询
6. 在状态页面验证健康检查
