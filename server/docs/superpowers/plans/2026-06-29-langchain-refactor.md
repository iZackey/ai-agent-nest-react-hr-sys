# Vercel AI SDK 重构为 LangChain.js 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将项目中的 Vercel AI SDK 技术栈完整替换为 LangChain.js，保留所有现有功能和 API 兼容性。

**架构：** 使用 LangChain.js 的 `ChatOpenAI` + `createToolCallingAgent` + `AgentExecutor` 替换 Vercel AI SDK 的 `generateText`/`streamText` + `tool()`。工具定义使用 `DynamicStructuredTool.create()`。

**技术栈：** LangChain.js (langchain, @langchain/openai, @langchain/core), NestJS, TypeScript

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `server/package.json` | 依赖管理 | 修改 |
| `server/src/modules/tools/tool-registry.service.ts` | 工具注册 | 重写 |
| `server/src/modules/agent/agent.service.ts` | Agent 核心逻辑 | 重写 |
| `server/src/modules/streaming/streaming.controller.ts` | 流式响应 | 重写 |
| `server/src/modules/agent/agent.module.ts` | Agent 模块配置 | 修改 |

---

### 任务 1：更新依赖配置

**文件：**
- 修改：`server/package.json`

- [ ] **步骤 1：修改 package.json，替换依赖**

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

- [ ] **步骤 2：删除旧的 Vercel AI SDK 依赖**

从 dependencies 中移除：`ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/openai`, `@ai-sdk/anthropic`

- [ ] **步骤 3：安装依赖**

运行：`cd server && npm install`
预期：依赖安装成功

- [ ] **步骤 4：Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: replace Vercel AI SDK with LangChain.js dependencies"
```

---

### 任务 2：重构工具注册服务

**文件：**
- 修改：`server/src/modules/tools/tool-registry.service.ts`

- [ ] **步骤 1：修改工具注册服务，使用 DynamicStructuredTool**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { QueryToolsService } from './query-tools.service';
import { EmployeeToolsService } from './employee-tools.service';
import { UtilityToolsService } from './utility-tools.service';
import { AnalysisToolsService } from './analysis-tools.service';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);

  constructor(
    private queryTools: QueryToolsService,
    private employeeTools: EmployeeToolsService,
    private utilityTools: UtilityToolsService,
    private analysisTools: AnalysisToolsService,
  ) {
    this.logger.log('工具注册完成');
  }

  getLangChainTools() {
    return [
      DynamicStructuredTool.create({
        name: 'query_by_structure',
        description: '按结构化条件查询员工，支持部门、职位、薪酬等级、年龄范围等条件',
        schema: z.object({
          conditions_json: z.string().describe('JSON格式的查询条件，如{"department": "技术部", "age_min": 25, "age_max": 40}'),
        }),
        func: async ({ conditions_json }) => {
          return await this.queryTools.queryByStructure(conditions_json);
        },
      }),
      DynamicStructuredTool.create({
        name: 'search_by_keyword',
        description: '按关键词搜索员工，支持名字、部门、职位等字段的模糊搜索',
        schema: z.object({
          keyword: z.string().describe('搜索关键词'),
        }),
        func: async ({ keyword }) => {
          return await this.queryTools.searchByKeyword(keyword);
        },
      }),
      DynamicStructuredTool.create({
        name: 'get_employee_info',
        description: '获取员工的详细基础信息，包括姓名、部门、职位、薪酬等',
        schema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        func: async ({ employee_id }) => {
          return await this.employeeTools.getEmployeeInfo(employee_id);
        },
      }),
      DynamicStructuredTool.create({
        name: 'get_employee_projects',
        description: '获取员工的项目历史记录，包括项目名称、角色、技术栈、复杂度等',
        schema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        func: async ({ employee_id }) => {
          return await this.employeeTools.getEmployeeProjects(employee_id);
        },
      }),
      DynamicStructuredTool.create({
        name: 'get_employee_feedback',
        description: '获取员工的反馈评价信息，包括评分、反馈内容、统计数据',
        schema: z.object({
          employee_id: z.number().describe('员工ID'),
          limit: z.number().optional().describe('返回反馈数量限制，默认10条'),
        }),
        func: async ({ employee_id, limit }) => {
          return await this.employeeTools.getEmployeeFeedback(employee_id, limit || 10);
        },
      }),
      DynamicStructuredTool.create({
        name: 'format_employee_data',
        description: '将员工原始数据格式化为易读的格式',
        schema: z.object({
          employee: z.any().describe('员工数据对象'),
        }),
        func: async ({ employee }) => {
          return this.utilityTools.formatEmployeeData(employee);
        },
      }),
      DynamicStructuredTool.create({
        name: 'summarize_projects',
        description: '总结员工的项目经历，包括技术栈、复杂度分布等',
        schema: z.object({
          projects: z.array(z.any()).describe('项目列表'),
        }),
        func: async ({ projects }) => {
          return this.utilityTools.summarizeProjects(projects);
        },
      }),
      DynamicStructuredTool.create({
        name: 'summarize_feedback',
        description: '总结员工的反馈数据，包括按类别分组、评价等级等',
        schema: z.object({
          feedbacks: z.any().describe('反馈数据对象，包含feedbacks列表和statistics'),
        }),
        func: async ({ feedbacks }) => {
          return this.utilityTools.summarizeFeedback(feedbacks);
        },
      }),
      DynamicStructuredTool.create({
        name: 'format_comparison',
        description: '格式化多个员工的对比数据',
        schema: z.object({
          employees: z.array(z.any()).describe('员工列表'),
        }),
        func: async ({ employees }) => {
          return this.utilityTools.formatComparison(employees);
        },
      }),
      DynamicStructuredTool.create({
        name: 'extract_key_insights',
        description: '提取员工的关键信息和指标',
        schema: z.object({
          employee_data: z.any().describe('员工数据对象'),
        }),
        func: async ({ employee_data }) => {
          return this.utilityTools.extractKeyInsights(employee_data);
        },
      }),
      DynamicStructuredTool.create({
        name: 'evaluate_technical_strength',
        description: '评估员工的技术能力，基于项目复杂度、技术多样性和贡献度',
        schema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        func: async ({ employee_id }) => {
          return await this.analysisTools.evaluateTechnicalStrength(employee_id);
        },
      }),
      DynamicStructuredTool.create({
        name: 'evaluate_communication_ability',
        description: '评估员工的沟通能力，基于反馈数据',
        schema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        func: async ({ employee_id }) => {
          return await this.analysisTools.evaluateCommunicationAbility(employee_id);
        },
      }),
      DynamicStructuredTool.create({
        name: 'evaluate_leadership_ability',
        description: '评估员工的领导力，基于管理规模、职位级别和反馈',
        schema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        func: async ({ employee_id }) => {
          return await this.analysisTools.evaluateLeadershipAbility(employee_id);
        },
      }),
      DynamicStructuredTool.create({
        name: 'rank_candidates',
        description: '对多个员工候选进行综合评分和排名',
        schema: z.object({
          employee_ids: z.array(z.number()).describe('候选员工ID列表'),
          weights: z.object({
            technical: z.number().optional(),
            communication: z.number().optional(),
            leadership: z.number().optional(),
          }).optional().describe('评分权重'),
        }),
        func: async ({ employee_ids, weights }) => {
          return await this.analysisTools.rankCandidates(employee_ids, weights as any);
        },
      }),
    ];
  }
}
```

- [ ] **步骤 2：验证编译**

运行：`cd server && npx tsc --noEmit`
预期：编译通过，无错误

- [ ] **步骤 3：Commit**

```bash
git add server/src/modules/tools/tool-registry.service.ts
git commit -m "refactor: replace Vercel AI SDK tool() with LangChain DynamicStructuredTool"
```

---

### 任务 3：重构 Agent 服务

**文件：**
- 修改：`server/src/modules/agent/agent.service.ts`

- [ ] **步骤 1：重写 agent.service.ts，使用 LangChain AgentExecutor**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { SessionService } from '../session/session.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly maxIterations: number;

  constructor(
    private configService: ConfigService,
    private toolRegistry: ToolRegistryService,
    private sessionService: SessionService,
  ) {
    this.maxIterations = this.configService.get<number>('AGENT_MAX_ITERATIONS') || 6;
  }

  private getModel() {
    const baseURL = this.configService.get<string>('OPEN_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4';
    const apiKey = this.configService.get<string>('OPEN_API_KEY') || '';
    const modelName = this.configService.get<string>('OPEN_MODEL') || 'glm-4-flash';

    return new ChatOpenAI({
      modelName,
      baseURL,
      apiKey,
      temperature: 0.1,
    });
  }

  private buildSystemPrompt(): string {
    return `你是一个智能员工查询助手，能够帮助用户查询和分析员工信息。

你有以下能力：
- 查询员工信息（按条件查询、按关键词搜索）
- 获取员工的项目经历和反馈评价
- 格式化和总结员工数据
- 评估员工的技术能力、沟通能力和领导力
- 对候选员工进行综合排名

你必须遵循以下规则：
1. 理解用户的自然语言查询，并将其转换为具体的查询和分析任务
2. 使用提供的工具来获取信息和进行分析
3. 思考每一步的操作，然后执行相应的工具
4. 根据工具返回的结果，进行进一步的分析和总结
5. 始终以JSON格式返回结果，包含成功标志、数据和消息

开始对话。`;
  }

  private buildPrompt() {
    return ChatPromptTemplate.fromMessages([
      ['system', this.buildSystemPrompt()],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }

  async queryWithAgent(question: string, conversationHistory: any[] = []): Promise<any> {
    try {
      this.logger.log(`Agent处理查询: ${question}`);

      const tools = this.toolRegistry.getLangChainTools();
      const model = this.getModel();
      const prompt = this.buildPrompt();

      const chatHistory = conversationHistory.map(msg =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );

      const agent = createToolCallingAgent({
        llm: model,
        tools,
        prompt,
      });

      const executor = new AgentExecutor({
        agent,
        tools,
        maxIterations: this.maxIterations,
        verbose: true,
      });

      const result = await executor.invoke({
        input: question,
        chat_history: chatHistory,
      });

      this.logger.log(`Agent处理完成: ${result.output}`);

      return {
        success: true,
        data: {
          answer: result.output,
          steps: result.steps?.length || 0,
          toolCalls: result.steps?.flatMap((s: any) => s.toolCalls?.map((tc: any) => tc.toolName) || []) || [],
        },
        message: '查询完成',
      };
    } catch (e: any) {
      this.logger.error(`Agent处理失败: ${e.message}`);
      return {
        success: false,
        data: null,
        message: `处理失败: ${e.message}`,
      };
    }
  }
}
```

- [ ] **步骤 2：验证编译**

运行：`cd server && npx tsc --noEmit`
预期：编译通过，无错误

- [ ] **步骤 3：Commit**

```bash
git add server/src/modules/agent/agent.service.ts
git commit -m "refactor: replace Vercel AI SDK generateText with LangChain AgentExecutor"
```

---

### 任务 4：重构流式响应控制器

**文件：**
- 修改：`server/src/modules/streaming/streaming.controller.ts`

- [ ] **步骤 1：重写 streaming.controller.ts，使用 LangChain 流式输出**

```typescript
import {
  Controller, Get, Post, Query as QueryParam, Req, Res, Sse, Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ResponseData } from '../../common/dto/response.dto';
import { ToolRegistryService } from '../tools/tool-registry.service';

@ApiTags('test')
@Controller('api')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(
    private configService: ConfigService,
    private toolRegistry: ToolRegistryService,
  ) {}

  @Post('test')
  async test(@Req() req: Request) {
    return new ResponseData(0, { aaa: 111 });
  }

  @Get('streamingResponse')
  streamTextDemo(): Observable<string> {
    const words = '你好，这是一个流式输出的示例。我们会逐字显示这段文字，就像打字机一样。';
    let index = 0;

    return new Observable((subscriber) => {
      const interval = setInterval(() => {
        if (index < words.length) {
          subscriber.next(words[index]);
          index++;
        } else {
          clearInterval(interval);
          subscriber.complete();
        }
      }, 50);
    });
  }

  @Sse('eventSourceResponse')
  eventSourceDemo(): Observable<MessageEvent> {
    let i = 0;
    return new Observable((subscriber) => {
      const interval = setInterval(() => {
        if (i < 10) {
          subscriber.next(new MessageEvent('message', {
            data: JSON.stringify({ data: `消息块 ${i}: 模拟流式数据`, event: 'message' }),
          }));
          i++;
        } else {
          clearInterval(interval);
          subscriber.complete();
        }
      }, 500);
    });
  }

  @Get('stream')
  async stream(@QueryParam('prompt') prompt: string, @Res() res: any) {
    const baseURL = this.configService.get<string>('OPEN_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4';
    const apiKey = this.configService.get<string>('OPEN_API_KEY') || '';
    const modelName = this.configService.get<string>('OPEN_MODEL') || 'glm-4-flash';

    const model = new ChatOpenAI({
      modelName,
      baseURL,
      apiKey,
      temperature: 0.1,
    });

    const tools = this.toolRegistry.getLangChainTools();
    const chatPrompt = ChatPromptTemplate.fromMessages([
      ['system', '你是一个智能助手。请简洁回答用户的问题。'],
      ['human', '{input}'],
    ]);

    const agent = createToolCallingAgent({
      llm: model,
      tools,
      prompt: chatPrompt,
    });

    const executor = new AgentExecutor({
      agent,
      tools,
      maxIterations: 6,
      verbose: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await executor.stream({ input: prompt });
    
    for await (const chunk of stream) {
      if (chunk.output) {
        res.write(`data: ${JSON.stringify({ text: chunk.output })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }
}
```

- [ ] **步骤 2：验证编译**

运行：`cd server && npx tsc --noEmit`
预期：编译通过，无错误

- [ ] **步骤 3：Commit**

```bash
git add server/src/modules/streaming/streaming.controller.ts
git commit -m "refactor: replace Vercel AI SDK streamText with LangChain stream"
```

---

### 任务 5：验证启动和功能

**文件：**
- 修改：`server/src/modules/agent/agent.module.ts`（如需要）

- [ ] **步骤 1：检查 agent.module.ts 是否需要修改**

运行：`cd server && npm run start:dev`
预期：服务启动成功，无错误

- [ ] **步骤 2：测试 API 接口**

运行：`curl -X POST http://localhost:8000/api/query -H "Content-Type: application/json" -d '{"question": "查询技术部的员工"}'`
预期：返回成功响应，包含查询结果

- [ ] **步骤 3：测试流式接口**

运行：`curl http://localhost:8000/api/stream?prompt=你好`
预期：返回 SSE 流式响应

- [ ] **步骤 4：测试健康检查**

运行：`curl http://localhost:8000/api/health`
预期：返回 `{"code":0,"data":{"status":"healthy",...},"msg":"success"}`

- [ ] **步骤 5：Commit**

```bash
git add -A
git commit -m "refactor: complete LangChain.js migration, all tests passed"
```

---

## 自检

**1. 规格覆盖度：**
- ✅ 依赖替换
- ✅ 工具注册重构
- ✅ Agent 核心逻辑重构
- ✅ 流式响应重构
- ✅ API 兼容性

**2. 占位符扫描：**
- ✅ 无占位符或 TODO

**3. 类型一致性：**
- ✅ 所有类型、方法签名一致

---

## 执行交接

计划已完成并保存到 `docs/superpowers/plans/2026-06-29-langchain-refactor.md`。两种执行方式：

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查，快速迭代

**2. 内联执行** - 在当前会话中使用 executing-plans 执行任务，批量执行并设有检查点

**选哪种方式？**