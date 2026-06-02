# AI Agent 智能员工查询系统 — NestJS 迁移实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Python/FastAPI 智能员工查询 AI Agent 系统完整迁移到 TypeScript/NestJS，保持 API 完全兼容。

**架构：** 模块级 1:1 映射迁移。NestJS Controllers 对应 FastAPI Routes，Providers 对应 Services，TypeORM Entities 对应 SQLAlchemy Models。Agent 循环从手动正则 ReAct 升级为 Vercel AI SDK 原生工具调用。

**技术栈：** NestJS 10+, TypeORM, MySQL 8.0, Vercel AI SDK (@ai-sdk/core), Zod, class-validator, ioredis, @nestjs/swagger, Jest

---

## 文件清单

以下是本计划将创建的所有文件及其职责：

| 文件 | 职责 |
|------|------|
| `package.json` | 项目依赖和脚本 |
| `tsconfig.json` | TypeScript 编译配置 |
| `tsconfig.build.json` | 构建时 TS 配置 |
| `nest-cli.json` | NestJS CLI 配置 |
| `.env` / `.env.example` | 环境变量 |
| `src/main.ts` | NestJS 启动入口 (替代 `app/main.py` + `main.py`) |
| `src/app.module.ts` | 根模块，组装所有子模块 |
| `src/config/configuration.ts` | 环境变量配置模式 (替代 `app/config.py`) |
| `src/core/constants.ts` | 常量定义 (替代 `app/core/constants.py`) |
| `src/core/exceptions/*.ts` | 异常体系 (替代 `app/core/exceptions.py`) |
| `src/common/filters/http-exception.filter.ts` | 全局异常过滤器 (替代 `app/middleware/exception_handler.py`) |
| `src/common/interceptors/logging.interceptor.ts` | 日志拦截器 (替代 `app/utils/logger.py` 部分) |
| `src/common/dto/response.dto.ts` | 统一响应格式 (替代 `app/schemas/response.py`) |
| `src/db/database.module.ts` | TypeORM 数据库模块 (替代 `app/db/database.py` + `session.py`) |
| `src/models/*.entity.ts` | 6 个 TypeORM 实体 (替代 `app/models/*.py`) |
| `src/schemas/*.ts` | 请求 DTO + 验证 (替代 `app/schemas/*.py`) |
| `src/modules/session/session.service.ts` | 会话管理 (替代 `app/services/session_service.py`) |
| `src/modules/tools/query-tools.service.ts` | 查询工具 (替代 `app/tools/query_tools.py`) |
| `src/modules/tools/employee-tools.service.ts` | 员工数据工具 (替代 `app/tools/employee_tools.py`) |
| `src/modules/tools/utility-tools.service.ts` | 格式化工具 (替代 `app/tools/utility_tools.py`) |
| `src/modules/tools/analysis-tools.service.ts` | 分析评估工具 (替代 `app/tools/analysis_tools.py`) |
| `src/modules/tools/tool-registry.service.ts` | 工具注册中心 (替代 `app/services/tool_registry.py`) |
| `src/modules/agent/agent.service.ts` | ReAct Agent 核心 (替代 `app/services/agent_service.py`) |
| `src/modules/query/query.controller.ts` | 主查询/评估/排名 API (替代 `app/routes/queries.py`) |
| `src/modules/streaming/streaming.controller.ts` | 流式输出 API (替代 `app/routes/test.py`) |
| `src/modules/redis/redis.service.ts` | Redis 缓存服务 (新增) |
| `src/utils/cost-tracker.ts` | API 成本追踪 (替代 `app/utils/cost_tracker.py`) |
| `src/utils/logger.ts` | 日志工具 (替代 `app/utils/logger.py`) |
| `sql/schema.sql` | 数据库 schema (复用源项目) |
| `scripts/seed-data.ts` | 种子数据 (替代 `scripts/seed_data.py`) |
| `static/index.html` | 前端演示 (复用源项目) |
| `static/sse.html` | SSE 演示 (复用源项目) |
| `docker-compose.yml` | Docker 编排 (重写) |
| `Dockerfile` | 容器构建 (重写) |
| `test/app.e2e-spec.ts` | E2E 测试 |
| `test/jest-e2e.json` | E2E Jest 配置 |

---

### 任务 1：项目脚手架搭建

**文件：**
- 创建：`package.json`
- 创建：`tsconfig.json`
- 创建：`tsconfig.build.json`
- 创建：`nest-cli.json`
- 创建：`.env`
- 创建：`.env.example`
- 创建：`.gitignore`

- [ ] **步骤 1：初始化 NestJS 项目**

在 `D:\MyProject\MyDemoProject\app-ai-agent-test-nestjs` 目录下初始化：

```bash
cd "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs"
npx @nestjs/cli@latest new . --package-manager npm --skip-git --skip-install
```

如果 CLI 交互提示，选择 npm。

- [ ] **步骤 2：安装核心依赖**

```bash
cd "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs"

# NestJS 核心
npm install @nestjs/common @nestjs/core @nestjs/platform-express rxjs reflect-metadata

# TypeORM + MySQL
npm install typeorm mysql2

# 配置
npm install @nestjs/config

# 验证
npm install class-validator class-transformer

# Swagger
npm install @nestjs/swagger

# Vercel AI SDK
npm install ai @ai-sdk/openai @ai-sdk/anthropic zod

# Redis
npm install ioredis @nestjs/cache-manager cache-manager

# SSE
npm install@sse

# 日志
npm install winston nest-winston

# UUID
npm install uuid
npm install -D @types/uuid

# 开发依赖
npm install -D @nestjs/testing jest ts-jest @types/jest @types/express
```

- [ ] **步骤 3：创建 `.env` 文件**

```env
# 应用配置
APP_NAME=Employee Query Agent
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=info

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=employee_agent

# LLM 配置
LLM_PROVIDER=qwen
CLAUDE_API_KEY=sk-ant-your-api-key-here
CLAUDE_MODEL=claude-opus-4-6
OPEN_API_KEY=sk-your-qwen-api-key
OPEN_MODEL=qwen-plus
OPEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Agent 配置
AGENT_MAX_ITERATIONS=6

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 服务器
PORT=8000
```

- [ ] **步骤 4：创建 `.env.example`**

与 `.env` 相同但 API key 留空。

- [ ] **步骤 5：创建 `.gitignore`**

```
node_modules/
dist/
.env
logs/*.log
*.log
```

- [ ] **步骤 6：确认项目可编译**

```bash
cd "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs"
npx nest build
```

预期：编译成功，无错误。

- [ ] **步骤 7：Commit**

```bash
git init
git add .
git commit -m "chore: 初始化 NestJS 项目脚手架"
```

---

### 任务 2：配置模块与常量

**文件：**
- 创建：`src/config/configuration.ts`
- 创建：`src/core/constants.ts`

- [ ] **步骤 1：创建配置模式**

```typescript
// src/config/configuration.ts
export default () => ({
  // 应用配置
  APP_NAME: process.env.APP_NAME || 'Employee Query Agent',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  DEBUG: process.env.DEBUG === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // 数据库配置
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USERNAME: process.env.DB_USERNAME || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_DATABASE: process.env.DB_DATABASE || 'employee_agent',

  // LLM 配置
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'qwen',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-opus-4-6',
  OPEN_API_KEY: process.env.OPEN_API_KEY || '',
  OPEN_MODEL: process.env.OPEN_MODEL || 'qwen-plus',
  OPEN_BASE_URL: process.env.OPEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',

  // Agent 配置
  AGENT_MAX_ITERATIONS: parseInt(process.env.AGENT_MAX_ITERATIONS, 10) || 6,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,

  // 服务器
  PORT: parseInt(process.env.PORT, 10) || 8000,
});
```

- [ ] **步骤 2：创建常量定义**

```typescript
// src/core/constants.ts
export const EMPLOYEE_STATUS = {
  ACTIVE: '在职',
  INACTIVE: '离职',
  LEAVE: '休假',
} as const;

export const PROJECT_COMPLEXITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const CONTRIBUTION_LEVEL = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const FEEDBACK_CATEGORY = {
  COMMUNICATION: '沟通',
  TECHNICAL: '技术能力',
  LEADERSHIP: '领导力',
  TEAMWORK: '协作',
} as const;

export const POSITIONS = [
  '实习生', '初级工程师', '中级工程师', '高级工程师',
  '技术负责人', '经理', '总监', '副总裁',
] as const;

export const DEPARTMENTS = [
  '销售部', '市场部', '技术部', '产品部',
  '运营部', '人力资源部', '财务部', '法律部',
] as const;

export const COMPLEXITY_WEIGHTS: Record<string, number> = {
  '低': 1,
  '中': 2,
  '高': 3,
  '非常高': 4,
};

export const LEADERSHIP_POSITION_WEIGHTS: Record<string, number> = {
  'CTO': 1.0,
  '总经理': 1.0,
  'VP': 0.9,
  '经理': 0.7,
  '主管': 0.5,
  '组长': 0.3,
  '员工': 0.0,
};
```

- [ ] **步骤 3：Commit**

```bash
git add src/config/configuration.ts src/core/constants.ts
git commit -m "feat: 添加配置模块和常量定义"
```

---

### 任务 3：异常体系与通用层

**文件：**
- 创建：`src/core/exceptions/app.exception.ts`
- 创建：`src/core/exceptions/validation.exception.ts`
- 创建：`src/core/exceptions/session.exception.ts`
- 创建：`src/core/exceptions/agent.exception.ts`
- 创建：`src/core/exceptions/database.exception.ts`
- 创建：`src/core/exceptions/tool.exception.ts`
- 创建：`src/common/dto/response.dto.ts`
- 创建：`src/common/filters/http-exception.filter.ts`
- 创建：`src/common/interceptors/logging.interceptor.ts`

- [ ] **步骤 1：创建异常类**

```typescript
// src/core/exceptions/app.exception.ts
import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  code: number;
  msg: string;
  data: any;

  constructor(code: number, msg: string, data: any = null) {
    super(msg, code);
    this.code = code;
    this.msg = msg;
    this.data = data;
  }
}
```

```typescript
// src/core/exceptions/validation.exception.ts
import { AppException } from './app.exception';

export class ValidationException extends AppException {
  constructor(msg: string) {
    super(400, msg, null);
  }
}
```

```typescript
// src/core/exceptions/session.exception.ts
import { AppException } from './app.exception';

export class SessionException extends AppException {
  constructor(msg: string) {
    super(400, msg, null);
  }
}
```

```typescript
// src/core/exceptions/agent.exception.ts
import { AppException } from './app.exception';

export class AgentException extends AppException {
  constructor(msg: string = '查询处理失败') {
    super(500, msg, null);
  }
}
```

```typescript
// src/core/exceptions/database.exception.ts
import { AppException } from './app.exception';

export class DatabaseException extends AppException {
  constructor(msg: string = '服务器内部错误') {
    super(500, msg, null);
  }
}
```

```typescript
// src/core/exceptions/tool.exception.ts
import { AppException } from './app.exception';

export class ToolException extends AppException {
  constructor(msg: string = '工具执行失败') {
    super(500, msg, null);
  }
}
```

- [ ] **步骤 2：创建统一响应 DTO**

```typescript
// src/common/dto/response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ResponseData<T = any> {
  @ApiProperty({ description: '状态码，0 表示成功' })
  code: number;

  @ApiProperty({ description: '响应数据' })
  data: T;

  @ApiProperty({ description: '响应消息' })
  msg: string;

  constructor(code: number, data: T, msg: string = 'success') {
    this.code = code;
    this.data = data;
    this.msg = msg;
  }
}
```

- [ ] **步骤 3：创建全局异常过滤器**

```typescript
// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../../core/exceptions/app.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    if (exception instanceof AppException) {
      this.logger.error(
        `AppException - Path: ${request.url}, Code: ${exception.code}, Msg: ${exception.msg}`,
      );
      return response.status(exception.code).json({
        code: exception.code,
        data: exception.data,
        msg: exception.msg,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let msg = '请求处理失败';
      if (typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
        const messages = (exceptionResponse as any).message;
        msg = Array.isArray(messages) ? messages[0] : messages;
      }

      this.logger.warn(`ValidationError - Path: ${request.url}`);
      return response.status(status).json({
        code: status,
        data: null,
        msg: `参数验证失败: ${msg}`,
      });
    }

    // 未预期的异常
    this.logger.error(
      `UnhandledException - Path: ${request.url}, Error: ${exception}`,
      exception instanceof Error ? exception.stack : undefined,
    );
    return response.status(500).json({
      code: 500,
      data: null,
      msg: '服务器内部错误',
    });
  }
}
```

- [ ] **步骤 4：创建日志拦截器**

```typescript
// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}
```

- [ ] **步骤 5：Commit**

```bash
git add src/core/exceptions/ src/common/
git commit -m "feat: 添加异常体系、统一响应和全局过滤器"
```

---

### 任务 4：数据库层 — TypeORM 实体

**文件：**
- 创建：`src/models/base.entity.ts`
- 创建：`src/models/employee.entity.ts`
- 创建：`src/models/project.entity.ts`
- 创建：`src/models/employee-project.entity.ts`
- 创建：`src/models/employee-feedback.entity.ts`
- 创建：`src/models/session.entity.ts`
- 创建：`src/models/conversation-message.entity.ts`
- 创建：`src/db/database.module.ts`
- 复制：`sql/schema.sql`（从源项目）

- [ ] **步骤 1：创建基础实体**

```typescript
// src/models/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

```typescript
// src/models/session.entity.ts
import {
  Entity,
  Column,
  OneToMany,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationMessage } from './conversation-message.entity';

@Entity('conversation_sessions')
export class ConversationSession {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 100 })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_activity', type: 'timestamp' })
  lastActivity: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'session_metadata', type: 'json', nullable: true })
  sessionMetadata: any;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ConversationMessage, (msg) => msg.session, { cascade: true })
  messages: ConversationMessage[];
}
```

```typescript
// src/models/conversation-message.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ConversationSession } from './session.entity';

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'session_id', type: 'varchar', length: 36 })
  sessionId: string;

  @Column({ type: 'varchar', length: 20 })
  role: string;

  @Column({ type: 'longtext' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ConversationSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ConversationSession;
}
```

```typescript
// src/models/employee.entity.ts
import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployeeProject } from './employee-project.entity';
import { EmployeeFeedback } from './employee-feedback.entity';

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int' })
  age: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  department: string;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate: Date;

  @Column({ name: 'salary_level', type: 'varchar', length: 50 })
  salaryLevel: string;

  @Column({ type: 'varchar', length: 20, default: '在职' })
  status: string;

  @Column({ name: 'manager_id', type: 'int', nullable: true })
  managerId: number | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'manager_id' })
  manager: Employee;

  @OneToMany(() => EmployeeProject, (ep) => ep.employee)
  projects: EmployeeProject[];

  @OneToMany(() => EmployeeFeedback, (fb) => fb.employee)
  feedbacks: EmployeeFeedback[];
}
```

```typescript
// src/models/project.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployeeProject } from './employee-project.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'varchar', length: 20 })
  complexity: string;

  @OneToMany(() => EmployeeProject, (ep) => ep.project)
  employees: EmployeeProject[];
}
```

```typescript
// src/models/employee-project.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';
import { Project } from './project.entity';

@Entity('employee_projects')
export class EmployeeProject extends BaseEntity {
  @Column({ name: 'employee_id', type: 'int' })
  employeeId: number;

  @Column({ name: 'project_id', type: 'int' })
  projectId: number;

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @Column({ type: 'text' })
  technologies: string;

  @Column({ name: 'contribution_level', type: 'varchar', length: 20 })
  contributionLevel: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @ManyToOne(() => Employee, (e) => e.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Project, (p) => p.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
```

```typescript
// src/models/employee-feedback.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('employee_feedback')
export class EmployeeFeedback extends BaseEntity {
  @Column({ name: 'employee_id', type: 'int' })
  employeeId: number;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'float' })
  score: number;

  @Column({ name: 'feedback_text', type: 'text' })
  feedbackText: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100 })
  createdBy: string;

  @ManyToOne(() => Employee, (e) => e.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
```

- [ ] **步骤 2：创建数据库模块**

```typescript
// src/db/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/../models/*.entity{.ts,.js}'],
        synchronize: false,
        poolSize: 20,
        extra: {
          connectionLimit: 20,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **步骤 3：复制 SQL schema**

```bash
cp "D:/MyProject/MyDemoProject/app-ai-agent-test/sql/schema.sql" "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs/sql/schema.sql"
```

- [ ] **步骤 4：Commit**

```bash
git add src/models/ src/db/ sql/
git commit -m "feat: 添加 TypeORM 实体和数据库模块"
```

---

### 任务 5：Schema/DTO 层

**文件：**
- 创建：`src/schemas/query.schema.ts`
- 创建：`src/schemas/employee.schema.ts`
- 创建：`src/schemas/evaluate.schema.ts`

- [ ] **步骤 1：创建查询请求 DTO**

```typescript
// src/schemas/query.schema.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, plainToInstance } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const FORBIDDEN_KEYWORDS = ['DROP', 'DELETE', 'TRUNCATE', ';', '--'];

export class QueryRequest {
  @ApiProperty({ description: '用户查询问题', example: '查询技术部的员工' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question: string;

  @ApiPropertyOptional({ description: '会话 ID', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  @MinLength(32)
  @MaxLength(36)
  sessionId?: string;

  validateQuestion() {
    if (!this.question || !this.question.trim()) {
      throw new Error('问题不能为空');
    }
    const upper = this.question.toUpperCase();
    for (const kw of FORBIDDEN_KEYWORDS) {
      if (upper.includes(kw)) {
        throw new Error('问题包含禁用关键字');
      }
    }
    this.question = this.question.trim();
  }
}
```

```typescript
// src/schemas/evaluate.schema.ts
import { IsArray, IsNumber, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EvaluateRequest {
  @ApiProperty({ description: '员工 ID 列表', example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  employeeIds: number[];
}

export class RankRequest {
  @ApiProperty({ description: '候选员工 ID 列表', example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsNumber({}, { each: true })
  employeeIds: number[];

  @ApiProperty({
    description: '评分指标和权重',
    example: { technical: 0.4, communication: 0.3, leadership: 0.3 },
  })
  @IsObject()
  metrics: Record<string, number>;

  validateMetrics() {
    const total = Object.values(this.metrics).reduce((sum, v) => sum + v, 0);
    if (total < 0.99 || total > 1.01) {
      throw new Error('权重之和必须为 1.0');
    }
  }
}

// 辅助：用于 class-validator 的 @IsObject
import { IsObject } from 'class-validator';
```

```typescript
// src/schemas/employee.schema.ts
import { ApiProperty } from '@nestjs/swagger';

export class EmployeeDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() age: number;
  @ApiProperty() email: string;
  @ApiProperty() phone: string;
  @ApiProperty() department: string;
  @ApiProperty() position: string;
  @ApiProperty() hireDate: string;
  @ApiProperty() salaryLevel: string;
  @ApiProperty() status: string;
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/schemas/
git commit -m "feat: 添加请求 DTO 和数据验证"
```

---

### 任务 6：Session 服务

**文件：**
- 创建：`src/modules/session/session.module.ts`
- 创建：`src/modules/session/session.service.ts`

- [ ] **步骤 1：创建 SessionService**

```typescript
// src/modules/session/session.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationSession } from '../../models/session.entity';
import { ConversationMessage } from '../../models/conversation-message.entity';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(ConversationSession)
    private sessionRepo: Repository<ConversationSession>,
    @InjectRepository(ConversationMessage)
    private messageRepo: Repository<ConversationMessage>,
  ) {}

  async getOrCreateSession(userId: string, sessionId?: string): Promise<ConversationSession> {
    if (sessionId) {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId, userId },
      });
      if (session) {
        session.lastActivity = new Date();
        await this.sessionRepo.save(session);
        return session;
      }
    }

    const newSession = this.sessionRepo.create({
      id: uuidv4(),
      userId,
      lastActivity: new Date(),
      isActive: true,
    });
    const saved = await this.sessionRepo.save(newSession);
    this.logger.log(`创建新会话 - 用户: ${userId}, 会话ID: ${saved.id}`);
    return saved;
  }

  async getConversationHistory(sessionId: string, limit: number = 20): Promise<any[]> {
    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));
  }

  async saveMessage(sessionId: string, role: string, content: string): Promise<void> {
    const message = this.messageRepo.create({
      id: uuidv4(),
      sessionId,
      role,
      content,
    });
    await this.messageRepo.save(message);

    await this.sessionRepo.update(
      { id: sessionId },
      { lastActivity: new Date() },
    );
    this.logger.log(`保存消息 - 会话: ${sessionId}, 角色: ${role}`);
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { isActive: false, closedAt: new Date() },
    );
    this.logger.log(`关闭会话 - 会话ID: ${sessionId}`);
  }
}
```

```typescript
// src/modules/session/session.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationSession } from '../../models/session.entity';
import { ConversationMessage } from '../../models/conversation-message.entity';
import { SessionService } from './session.service';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationSession, ConversationMessage])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
```

- [ ] **步骤 2：Commit**

```bash
git add src/modules/session/
git commit -m "feat: 添加会话管理服务"
```

---

### 任务 7：工具层 — 查询工具和员工工具

**文件：**
- 创建：`src/modules/tools/query-tools.service.ts`
- 创建：`src/modules/tools/employee-tools.service.ts`

- [ ] **步骤 1：创建查询工具服务**

```typescript
// src/modules/tools/query-tools.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../models/employee.entity';

@Injectable()
export class QueryToolsService {
  private readonly logger = new Logger(QueryToolsService.name);

  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  async queryByStructure(conditionsJson: string): Promise<string> {
    try {
      const conditions = JSON.parse(conditionsJson);
      const qb = this.employeeRepo
        .createQueryBuilder('e')
        .select([
          'e.id', 'e.name', 'e.age', 'e.department', 'e.position',
          'e.hireDate', 'e.salaryLevel', 'e.status', 'e.email', 'e.phone',
        ])
        .orderBy('e.hireDate', 'DESC')
        .limit(50);

      for (const [key, value] of Object.entries(conditions)) {
        if (key.endsWith('_min') && key.startsWith('age')) {
          qb.andWhere('e.age >= :age_min', { age_min: value });
        } else if (key.endsWith('_max') && key.startsWith('age')) {
          qb.andWhere('e.age <= :age_max', { age_max: value });
        } else if (['department', 'position', 'salaryLevel', 'status'].includes(key)) {
          qb.andWhere(`e.${key} = :${key}`, { [key]: value });
        }
      }

      const employees = await qb.getMany();
      this.logger.log(`结构化查询成功 - 条件: ${conditionsJson}, 结果: ${employees.length}条`);

      return JSON.stringify({
        success: true,
        data: employees,
        message: `找到 ${employees.length} 个匹配的员工`,
      });
    } catch (e) {
      this.logger.error(`结构化查询失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `查询失败: ${e.message}` });
    }
  }

  async searchByKeyword(keyword: string): Promise<string> {
    try {
      const employees = await this.employeeRepo
        .createQueryBuilder('e')
        .select([
          'e.id', 'e.name', 'e.age', 'e.department', 'e.position',
          'e.hireDate', 'e.salaryLevel', 'e.status', 'e.email', 'e.phone',
        ])
        .where('e.name LIKE :kw', { kw: `%${keyword}%` })
        .orWhere('e.department LIKE :kw', { kw: `%${keyword}%` })
        .orWhere('e.position LIKE :kw', { kw: `%${keyword}%` })
        .orderBy('e.hireDate', 'DESC')
        .limit(30)
        .getMany();

      this.logger.log(`关键词搜索 - 关键词: ${keyword}, 结果: ${employees.length}条`);
      return JSON.stringify({
        success: true,
        data: employees,
        message: `找到 ${employees.length} 个匹配的员工`,
      });
    } catch (e) {
      this.logger.error(`关键词搜索失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `搜索失败: ${e.message}` });
    }
  }
}
```

- [ ] **步骤 2：创建员工数据工具服务**

```typescript
// src/modules/tools/employee-tools.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../models/employee.entity';
import { EmployeeProject } from '../../models/employee-project.entity';
import { EmployeeFeedback } from '../../models/employee-feedback.entity';

@Injectable()
export class EmployeeToolsService {
  private readonly logger = new Logger(EmployeeToolsService.name);

  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeProject)
    private empProjectRepo: Repository<EmployeeProject>,
    @InjectRepository(EmployeeFeedback)
    private feedbackRepo: Repository<EmployeeFeedback>,
  ) {}

  async getEmployeeInfo(employeeId: number): Promise<string> {
    try {
      const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
      if (!employee) {
        return JSON.stringify({ success: false, data: null, message: `员工ID ${employeeId} 不存在` });
      }
      this.logger.log(`获取员工信息 - ID: ${employeeId}`);
      return JSON.stringify({ success: true, data: employee, message: '获取成功' });
    } catch (e) {
      this.logger.error(`获取员工信息失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `获取失败: ${e.message}` });
    }
  }

  async getEmployeeProjects(employeeId: number): Promise<string> {
    try {
      const results = await this.empProjectRepo
        .createQueryBuilder('ep')
        .leftJoinAndSelect('ep.project', 'p')
        .select([
          'ep.id', 'p.name', 'p.description', 'ep.role', 'ep.technologies',
          'p.startDate', 'p.endDate', 'ep.contributionLevel', 'p.complexity',
        ])
        .where('ep.employeeId = :empId', { empId: employeeId })
        .orderBy('p.endDate', 'DESC')
        .limit(20)
        .getMany();

      this.logger.log(`获取员工项目 - ID: ${employeeId}, 项目数: ${results.length}`);
      return JSON.stringify({
        success: true,
        data: results,
        message: `找到 ${results.length} 个项目`,
      });
    } catch (e) {
      this.logger.error(`获取员工项目失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `获取失败: ${e.message}` });
    }
  }

  async getEmployeeFeedback(employeeId: number, limit: number = 10): Promise<string> {
    try {
      const feedbacks = await this.feedbackRepo
        .createQueryBuilder('fb')
        .where('fb.employeeId = :empId', { empId: employeeId })
        .orderBy('fb.createdAt', 'DESC')
        .limit(limit)
        .getMany();

      const avgScore = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length
        : 0;
      const categories = [...new Set(feedbacks.map((f) => f.category))];

      this.logger.log(`获取员工反馈 - ID: ${employeeId}, 反馈数: ${feedbacks.length}`);
      return JSON.stringify({
        success: true,
        data: {
          feedbacks,
          statistics: {
            total: feedbacks.length,
            averageScore: Math.round(avgScore * 10) / 10,
            categories,
          },
        },
        message: `找到 ${feedbacks.length} 条反馈`,
      });
    } catch (e) {
      this.logger.error(`获取员工反馈失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `获取失败: ${e.message}` });
    }
  }
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/modules/tools/query-tools.service.ts src/modules/tools/employee-tools.service.ts
git commit -m "feat: 添加查询工具和员工数据工具服务"
```

---

### 任务 8：工具层 — 格式化工具和分析工具

**文件：**
- 创建：`src/modules/tools/utility-tools.service.ts`
- 创建：`src/modules/tools/analysis-tools.service.ts`

- [ ] **步骤 1：创建格式化工具服务**

```typescript
// src/modules/tools/utility-tools.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UtilityToolsService {
  private readonly logger = new Logger(UtilityToolsService.name);

  formatEmployeeData(employee: any): string {
    try {
      if (!employee) {
        return JSON.stringify({ success: false, message: '员工数据为空' });
      }
      return JSON.stringify({
        success: true,
        data: {
          基本信息: {
            员工ID: employee.id,
            姓名: employee.name,
            年龄: employee.age,
            邮箱: employee.email,
            电话: employee.phone,
          },
          工作信息: {
            部门: employee.department,
            职位: employee.position,
            入职日期: String(employee.hireDate || employee.hire_date || ''),
            薪酬等级: employee.salaryLevel || employee.salary_level,
            状态: employee.status,
            直属经理ID: employee.managerId || employee.manager_id,
          },
        },
      });
    } catch (e) {
      this.logger.error(`格式化员工数据失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `格式化失败: ${e.message}` });
    }
  }

  summarizeProjects(projects: any[]): string {
    try {
      if (!projects || projects.length === 0) {
        return JSON.stringify({
          success: true,
          data: { totalProjects: 0, summary: '该员工暂无项目记录' },
        });
      }

      const technologiesSet = new Set<string>();
      let totalContribution = 0;
      const complexityDistribution: Record<string, number> = {};

      for (const project of projects) {
        const techs = (project.technologies || '').split(',');
        techs.forEach((t: string) => { if (t.trim()) technologiesSet.add(t.trim()); });

        totalContribution += parseFloat(project.contributionLevel || project.contribution_level || '0');

        const complexity = project.complexity || '未知';
        complexityDistribution[complexity] = (complexityDistribution[complexity] || 0) + 1;
      }

      const avgContribution = totalContribution / projects.length;

      return JSON.stringify({
        success: true,
        data: {
          totalProjects: projects.length,
          averageContributionLevel: Math.round(avgContribution * 100) / 100,
          technologies: [...technologiesSet],
          complexityDistribution,
          projectsDetail: projects.map((p) => ({
            name: p.name,
            role: p.role,
            contributionLevel: p.contributionLevel || p.contribution_level,
            complexity: p.complexity,
            period: `${p.startDate || p.start_date} 至 ${p.endDate || p.end_date}`,
          })),
        },
      });
    } catch (e) {
      this.logger.error(`总结项目失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `总结失败: ${e.message}` });
    }
  }

  summarizeFeedback(feedbacks: any): string {
    try {
      if (!feedbacks || !feedbacks.feedbacks || feedbacks.feedbacks.length === 0) {
        return JSON.stringify({ success: true, data: { summary: '该员工暂无反馈记录' } });
      }

      const feedbackList = feedbacks.feedbacks;
      const statistics = feedbacks.statistics || {};
      const feedbackByCategory: Record<string, any> = {};

      for (const feedback of feedbackList) {
        const category = feedback.category || '其他';
        if (!feedbackByCategory[category]) {
          feedbackByCategory[category] = { count: 0, scores: [], feedbacks: [] };
        }
        feedbackByCategory[category].count++;
        feedbackByCategory[category].scores.push(feedback.score || 0);
        feedbackByCategory[category].feedbacks.push(feedback.feedbackText || feedback.feedback_text || '');
      }

      const categorySummary: Record<string, any> = {};
      for (const [category, data] of Object.entries(feedbackByCategory)) {
        const avgScore = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
        categorySummary[category] = {
          count: data.count,
          averageScore: Math.round(avgScore * 10) / 10,
          feedbackSamples: data.feedbacks.slice(0, 2),
        };
      }

      return JSON.stringify({
        success: true,
        data: {
          totalFeedbacks: statistics.total || 0,
          overallAverageScore: statistics.averageScore || statistics.average_score || 0,
          categories: statistics.categories || [],
          categoryDetails: categorySummary,
          evaluationLevel: this.getEvaluationLevel(statistics.averageScore || statistics.average_score || 0),
        },
      });
    } catch (e) {
      this.logger.error(`总结反馈失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `总结失败: ${e.message}` });
    }
  }

  formatComparison(employees: any[]): string {
    try {
      if (!employees || employees.length === 0) {
        return JSON.stringify({ success: false, message: '没有员工数据可用于对比' });
      }
      return JSON.stringify({
        success: true,
        data: {
          totalEmployees: employees.length,
          employees: employees.map((e) => ({
            id: e.id, name: e.name, department: e.department,
            position: e.position, age: e.age,
            salaryLevel: e.salaryLevel || e.salary_level,
            status: e.status,
          })),
          departments: [...new Set(employees.map((e) => e.department).filter(Boolean))],
          positions: [...new Set(employees.map((e) => e.position).filter(Boolean))],
          salaryLevels: [...new Set(employees.map((e) => e.salaryLevel || e.salary_level).filter(Boolean))],
        },
      });
    } catch (e) {
      this.logger.error(`格式化对比数据失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `格式化失败: ${e.message}` });
    }
  }

  extractKeyInsights(employeeData: any): string {
    try {
      return JSON.stringify({
        success: true,
        data: {
          profile: {
            name: employeeData.name,
            department: employeeData.department,
            position: employeeData.position,
            tenureYears: this.calculateTenure(employeeData.hireDate || employeeData.hire_date),
            status: employeeData.status,
          },
          keyMetrics: {
            contact: { email: employeeData.email, phone: employeeData.phone },
          },
        },
      });
    } catch (e) {
      this.logger.error(`提取关键信息失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `提取失败: ${e.message}` });
    }
  }

  private getEvaluationLevel(avgScore: number): string {
    if (avgScore >= 4.5) return '优秀';
    if (avgScore >= 4.0) return '良好';
    if (avgScore >= 3.0) return '中等';
    return '需要改进';
  }

  private calculateTenure(hireDate: any): string {
    try {
      if (!hireDate) return '未知';
      const date = new Date(hireDate);
      const now = new Date();
      const years = Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return years > 0 ? `${years}年` : '不足1年';
    } catch {
      return '未知';
    }
  }
}
```

- [ ] **步骤 2：创建分析工具服务**

```typescript
// src/modules/tools/analysis-tools.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../models/employee.entity';
import { EmployeeProject } from '../../models/employee-project.entity';
import { EmployeeFeedback } from '../../models/employee-feedback.entity';
import { COMPLEXITY_WEIGHTS, LEADERSHIP_POSITION_WEIGHTS } from '../../core/constants';

@Injectable()
export class AnalysisToolsService {
  private readonly logger = new Logger(AnalysisToolsService.name);

  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeProject)
    private empProjectRepo: Repository<EmployeeProject>,
    @InjectRepository(EmployeeFeedback)
    private feedbackRepo: Repository<EmployeeFeedback>,
  ) {}

  async evaluateTechnicalStrength(employeeId: number): Promise<string> {
    try {
      const projects = await this.empProjectRepo
        .createQueryBuilder('ep')
        .leftJoinAndSelect('ep.project', 'p')
        .where('ep.employeeId = :empId', { empId: employeeId })
        .orderBy('p.endDate', 'DESC')
        .getMany();

      if (projects.length === 0) {
        return JSON.stringify({
          success: true,
          data: { employeeId, technicalScore: 0, level: '无法评估', reason: '员工没有项目经历' },
        });
      }

      let complexityScore = 0;
      const technologyDiversity = new Set<string>();
      let contributionTotal = 0;

      for (const project of projects) {
        const complexity = project.project?.complexity || '中';
        complexityScore += COMPLEXITY_WEIGHTS[complexity] || 2;

        const techs = (project.technologies || '').split(',');
        techs.forEach((t) => { if (t.trim()) technologyDiversity.add(t.trim()); });

        contributionTotal += parseFloat(project.contributionLevel || '0');
      }

      const projectCount = projects.length;
      const avgComplexityScore = complexityScore / projectCount;
      const avgContribution = contributionTotal / projectCount;
      const techDiversityScore = Math.min(technologyDiversity.size / 3.0, 1.0) * 100;

      const technicalScore = avgComplexityScore * 15 + avgContribution * 20 + techDiversityScore * 0.65;
      const level = this.getLevelFromScore(technicalScore);

      return JSON.stringify({
        success: true,
        data: {
          employeeId,
          technicalScore: Math.round(technicalScore * 10) / 10,
          level,
          metrics: {
            averageProjectComplexity: Math.round(avgComplexityScore * 10) / 10,
            averageContributionLevel: Math.round(avgContribution * 100) / 100,
            technologyDiversity: technologyDiversity.size,
            technologies: [...technologyDiversity].sort(),
            projectCount,
          },
          assessment: this.getTechnicalAssessment(technicalScore, avgComplexityScore, technologyDiversity.size),
        },
      });
    } catch (e) {
      this.logger.error(`技术能力评估失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `评估失败: ${e.message}` });
    }
  }

  async evaluateCommunicationAbility(employeeId: number): Promise<string> {
    try {
      const feedbacks = await this.feedbackRepo
        .createQueryBuilder('fb')
        .where('fb.employeeId = :empId', { empId: employeeId })
        .andWhere('fb.category IN (:...categories)', {
          categories: ['沟通', '协作', '反馈能力', '影响力'],
        })
        .orderBy('fb.createdAt', 'DESC')
        .limit(20)
        .getMany();

      if (feedbacks.length === 0) {
        return JSON.stringify({
          success: true,
          data: { employeeId, communicationScore: 0, level: '无法评估', reason: '员工没有沟通相关的反馈数据' },
        });
      }

      const categoryScores: Record<string, number[]> = {};
      for (const feedback of feedbacks) {
        const category = feedback.category || '其他';
        if (!categoryScores[category]) categoryScores[category] = [];
        categoryScores[category].push(feedback.score);
      }

      const categoryAvg: Record<string, number> = {};
      let overallTotal = 0;
      for (const [category, scores] of Object.entries(categoryScores)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        categoryAvg[category] = Math.round(avg * 10) / 10;
        overallTotal += avg;
      }

      const communicationScore = Object.keys(categoryScores).length > 0
        ? (overallTotal / Object.keys(categoryScores).length) * 20
        : 0;

      const level = this.getLevelFromScore(communicationScore);

      return JSON.stringify({
        success: true,
        data: {
          employeeId,
          communicationScore: Math.round(communicationScore * 10) / 10,
          level,
          categoryScores: categoryAvg,
          feedbackCount: feedbacks.length,
          assessment: this.getCommunicationAssessment(communicationScore, categoryAvg),
        },
      });
    } catch (e) {
      this.logger.error(`沟通能力评估失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `评估失败: ${e.message}` });
    }
  }

  async evaluateLeadershipAbility(employeeId: number): Promise<string> {
    try {
      // 管理人数
      const managedCount = await this.employeeRepo
        .createQueryBuilder('e')
        .where('e.managerId = :empId', { empId: employeeId })
        .andWhere('e.status = :status', { status: '在职' })
        .getCount();

      // 领导力反馈
      const feedbacks = await this.feedbackRepo
        .createQueryBuilder('fb')
        .where('fb.employeeId = :empId', { empId: employeeId })
        .andWhere('fb.category IN (:...categories)', {
          categories: ['领导力', '决策能力', '团队建设', '指导能力'],
        })
        .orderBy('fb.createdAt', 'DESC')
        .limit(15)
        .getMany();

      // 员工职位
      const empInfo = await this.employeeRepo.findOne({ where: { id: employeeId } });

      let feedbackScore = 0;
      if (feedbacks.length > 0) {
        feedbackScore = (feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length) * 20;
      }

      const managementScore = Math.min(managedCount / 10.0, 1.0) * 30;
      const positionScore = this.getPositionLeadershipWeight(empInfo?.position || '') * 20;

      const leadershipScore = feedbackScore + managementScore + positionScore;
      const level = this.getLevelFromScore(leadershipScore);

      return JSON.stringify({
        success: true,
        data: {
          employeeId,
          leadershipScore: Math.round(leadershipScore * 10) / 10,
          level,
          metrics: {
            managedTeamSize: managedCount,
            leadershipFeedbackCount: feedbacks.length,
            position: empInfo?.position || '未知',
            salaryLevel: empInfo?.salaryLevel || '未知',
          },
          scoreBreakdown: {
            feedbackScore: Math.round(feedbackScore * 10) / 10,
            managementScore: Math.round(managementScore * 10) / 10,
            positionScore: Math.round(positionScore * 10) / 10,
          },
          assessment: this.getLeadershipAssessment(leadershipScore, managedCount),
        },
      });
    } catch (e) {
      this.logger.error(`领导力评估失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `评估失败: ${e.message}` });
    }
  }

  async rankCandidates(
    employeeIds: number[],
    weights: Record<string, number> = { technical: 0.4, communication: 0.3, leadership: 0.3 },
  ): Promise<string> {
    try {
      if (!employeeIds || employeeIds.length === 0) {
        return JSON.stringify({ success: false, message: '候选员工列表为空' });
      }

      const candidatesScores = [];

      for (const empId of employeeIds) {
        const empInfo = await this.employeeRepo
          .createQueryBuilder('e')
          .select(['e.id', 'e.name', 'e.position', 'e.department'])
          .where('e.id = :empId', { empId })
          .getOne();

        if (!empInfo) continue;

        const techEval = JSON.parse(await this.evaluateTechnicalStrength(empId));
        const techScore = techEval.data?.technicalScore || 0;

        const commEval = JSON.parse(await this.evaluateCommunicationAbility(empId));
        const commScore = commEval.data?.communicationScore || 0;

        const leadEval = JSON.parse(await this.evaluateLeadershipAbility(empId));
        const leadScore = leadEval.data?.leadershipScore || 0;

        const totalScore =
          techScore * (weights.technical || 0.4) +
          commScore * (weights.communication || 0.3) +
          leadScore * (weights.leadership || 0.3);

        candidatesScores.push({
          employeeId: empId,
          name: empInfo.name,
          position: empInfo.position,
          department: empInfo.department,
          scores: {
            technical: Math.round(techScore * 10) / 10,
            communication: Math.round(commScore * 10) / 10,
            leadership: Math.round(leadScore * 10) / 10,
          },
          totalScore: Math.round(totalScore * 10) / 10,
        });
      }

      candidatesScores.sort((a, b) => b.totalScore - a.totalScore);

      return JSON.stringify({
        success: true,
        data: {
          totalCandidates: candidatesScores.length,
          weights,
          ranking: candidatesScores,
          topCandidate: candidatesScores[0] || null,
        },
      });
    } catch (e) {
      this.logger.error(`员工排名失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `排名失败: ${e.message}` });
    }
  }

  private getLevelFromScore(score: number): string {
    if (score >= 80) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 60) return '中等';
    if (score >= 50) return '及格';
    return '需要改进';
  }

  private getTechnicalAssessment(score: number, complexity: number, techCount: number): string {
    if (score >= 80) return `员工拥有出色的技术能力，参与过${complexity.toFixed(1)}平均复杂度的项目，掌握${techCount}项技术栈`;
    if (score >= 70) return `员工具有良好的技术基础，技术栈覆盖广泛(${techCount}项)`;
    return '员工需要继续提升技术能力和项目经验';
  }

  private getCommunicationAssessment(score: number, categories: Record<string, number>): string {
    if (score >= 70) return '员工沟通能力突出，能够有效地与团队成员协作';
    if (score >= 50) return '员工具有基本的沟通能力，可继续改进';
    return '员工需要加强沟通和协作能力';
  }

  private getLeadershipAssessment(score: number, managedCount: number): string {
    if (score >= 70) return `员工展现出色的领导力，管理${managedCount}名团队成员`;
    if (score >= 50 && managedCount > 0) return `员工具有初步的领导能力，管理${managedCount}名团队成员`;
    return '员工暂无明显的管理经验或领导力表现';
  }

  private getPositionLeadershipWeight(position: string): number {
    for (const [pos, weight] of Object.entries(LEADERSHIP_POSITION_WEIGHTS)) {
      if (position.includes(pos)) return weight;
    }
    return 0.0;
  }
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/modules/tools/utility-tools.service.ts src/modules/tools/analysis-tools.service.ts
git commit -m "feat: 添加格式化工具和分析评估工具服务"
```

---

### 任务 9：工具注册中心

**文件：**
- 创建：`src/modules/tools/tool-registry.service.ts`
- 创建：`src/modules/tools/tools.module.ts`

- [ ] **步骤 1：创建工具注册中心**

```typescript
// src/modules/tools/tool-registry.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { tool, CoreTool } from 'ai';
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

  /** 返回 Vercel AI SDK 格式的工具定义 */
  getVercelTools(): Record<string, CoreTool> {
    return {
      // 查询工具
      query_by_structure: tool({
        description: '按结构化条件查询员工，支持部门、职位、薪酬等级、年龄范围等条件',
        parameters: z.object({
          conditions_json: z.string().describe('JSON格式的查询条件，如{"department": "技术部", "age_min": 25, "age_max": 40}'),
        }),
        execute: async ({ conditions_json }) => {
          return await this.queryTools.queryByStructure(conditions_json);
        },
      }),
      search_by_keyword: tool({
        description: '按关键词搜索员工，支持名字、部门、职位等字段的模糊搜索',
        parameters: z.object({
          keyword: z.string().describe('搜索关键词'),
        }),
        execute: async ({ keyword }) => {
          return await this.queryTools.searchByKeyword(keyword);
        },
      }),

      // 员工工具
      get_employee_info: tool({
        description: '获取员工的详细基础信息，包括姓名、部门、职位、薪酬等',
        parameters: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.employeeTools.getEmployeeInfo(employee_id);
        },
      }),
      get_employee_projects: tool({
        description: '获取员工的项目历史记录，包括项目名称、角色、技术栈、复杂度等',
        parameters: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.employeeTools.getEmployeeProjects(employee_id);
        },
      }),
      get_employee_feedback: tool({
        description: '获取员工的反馈评价信息，包括评分、反馈内容、统计数据',
        parameters: z.object({
          employee_id: z.number().describe('员工ID'),
          limit: z.number().optional().describe('返回反馈数量限制，默认10条'),
        }),
        execute: async ({ employee_id, limit }) => {
          return await this.employeeTools.getEmployeeFeedback(employee_id, limit || 10);
        },
      }),

      // 格式化工具
      format_employee_data: tool({
        description: '将员工原始数据格式化为易读的格式',
        parameters: z.object({
          employee: z.any().describe('员工数据对象'),
        }),
        execute: async ({ employee }) => {
          return this.utilityTools.formatEmployeeData(employee);
        },
      }),
      summarize_projects: tool({
        description: '总结员工的项目经历，包括技术栈、复杂度分布等',
        parameters: z.object({
          projects: z.array(z.any()).describe('项目列表'),
        }),
        execute: async ({ projects }) => {
          return this.utilityTools.summarizeProjects(projects);
        },
      }),
      summarize_feedback: tool({
        description: '总结员工的反馈数据，包括按类别分组、评价等级等',
        parameters: z.object({
          feedbacks: z.any().describe('反馈数据对象，包含feedbacks列表和statistics'),
        }),
        execute: async ({ feedbacks }) => {
          return this.utilityTools.summarizeFeedback(feedbacks);
        },
      }),
      format_comparison: tool({
        description: '格式化多个员工的对比数据',
        parameters: z.object({
          employees: z.array(z.any()).describe('员工列表'),
        }),
        execute: async ({ employees }) => {
          return this.utilityTools.formatComparison(employees);
        },
      }),
      extract_key_insights: tool({
        description: '提取员工的关键信息和指标',
        parameters: z.object({
          employee_data: z.any().describe('员工数据对象'),
        }),
        execute: async ({ employee_data }) => {
          return this.utilityTools.extractKeyInsights(employee_data);
        },
      }),

      // 分析工具
      evaluate_technical_strength: tool({
        description: '评估员工的技术能力，基于项目复杂度、技术多样性和贡献度',
        parameters: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.analysisTools.evaluateTechnicalStrength(employee_id);
        },
      }),
      evaluate_communication_ability: tool({
        description: '评估员工的沟通能力，基于反馈数据',
        parameters: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.analysisTools.evaluateCommunicationAbility(employee_id);
        },
      }),
      evaluate_leadership_ability: tool({
        description: '评估员工的领导力，基于管理规模、职位级别和反馈',
        parameters: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.analysisTools.evaluateLeadershipAbility(employee_id);
        },
      }),
      rank_candidates: tool({
        description: '对多个员工候选进行综合评分和排名',
        parameters: z.object({
          employee_ids: z.array(z.number()).describe('候选员工ID列表'),
          weights: z.object({
            technical: z.number().optional(),
            communication: z.number().optional(),
            leadership: z.number().optional(),
          }).optional().describe('评分权重'),
        }),
        execute: async ({ employee_ids, weights }) => {
          return await this.analysisTools.rankCandidates(employee_ids, weights as any);
        },
      }),
    };
  }
}
```

```typescript
// src/modules/tools/tools.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../models/employee.entity';
import { EmployeeProject } from '../../models/employee-project.entity';
import { EmployeeFeedback } from '../../models/employee-feedback.entity';
import { QueryToolsService } from './query-tools.service';
import { EmployeeToolsService } from './employee-tools.service';
import { UtilityToolsService } from './utility-tools.service';
import { AnalysisToolsService } from './analysis-tools.service';
import { ToolRegistryService } from './tool-registry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EmployeeProject, EmployeeFeedback]),
  ],
  providers: [
    QueryToolsService,
    EmployeeToolsService,
    UtilityToolsService,
    AnalysisToolsService,
    ToolRegistryService,
  ],
  exports: [ToolRegistryService, AnalysisToolsService],
})
export class ToolsModule {}
```

- [ ] **步骤 2：Commit**

```bash
git add src/modules/tools/tool-registry.service.ts src/modules/tools/tools.module.ts
git commit -m "feat: 添加工具注册中心（Vercel AI SDK 格式）"
```

---

### 任务 10：Agent 服务

**文件：**
- 创建：`src/modules/agent/agent.service.ts`
- 创建：`src/modules/agent/agent.module.ts`
- 创建：`src/utils/cost-tracker.ts`

- [ ] **步骤 1：创建成本追踪工具**

```typescript
// src/utils/cost-tracker.ts
import { Logger } from '@nestjs/common';

export class CostTracker {
  private readonly logger = new Logger(CostTracker.name);
  private static readonly INPUT_COST = 0.003 / 1000;
  private static readonly OUTPUT_COST = 0.015 / 1000;

  estimateCost(promptTokens: number, completionTokens: number): number {
    const inputCost = promptTokens * CostTracker.INPUT_COST;
    const outputCost = completionTokens * CostTracker.OUTPUT_COST;
    return Math.round((inputCost + outputCost) * 10000) / 10000;
  }

  logCost(cost: number, query: string = '') {
    if (query) {
      this.logger.log(`API成本 - 查询: ${query.substring(0, 50)}..., 成本: ¥${cost.toFixed(4)}`);
    } else {
      this.logger.log(`API成本 - ¥${cost.toFixed(4)}`);
    }
  }
}
```

- [ ] **步骤 2：创建 Agent 服务**

```typescript
// src/modules/agent/agent.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
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
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'qwen';

    if (provider === 'anthropic') {
      const anthropic = createAnthropic({
        apiKey: this.configService.get<string>('CLAUDE_API_KEY'),
      });
      return anthropic(this.configService.get<string>('CLAUDE_MODEL') || 'claude-opus-4-6');
    }

    // 默认使用 Qwen via OpenAI 兼容接口
    const qwen = createOpenAI({
      baseURL: this.configService.get<string>('OPEN_BASE_URL'),
      apiKey: this.configService.get<string>('OPEN_API_KEY'),
    });
    return qwen(this.configService.get<string>('OPEN_MODEL') || 'qwen-plus');
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

  async queryWithAgent(question: string, conversationHistory: any[] = []): Promise<any> {
    try {
      this.logger.log(`Agent处理查询: ${question}`);

      // 构建消息列表
      const messages: any[] = [];

      // 添加对话历史
      if (conversationHistory) {
        for (const msg of conversationHistory) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // 添加当前问题
      messages.push({
        role: 'user',
        content: question,
      });

      // 使用 Vercel AI SDK 执行工具调用
      const result = await generateText({
        model: this.getModel(),
        system: this.buildSystemPrompt(),
        messages,
        tools: this.toolRegistry.getVercelTools(),
        maxSteps: this.maxIterations,
      });

      this.logger.log(`Agent处理完成，使用了 ${result.steps.length} 个步骤`);

      return {
        success: true,
        data: {
          answer: result.text,
          steps: result.steps.length,
          toolCalls: result.steps
            .flatMap((s) => s.toolCalls || [])
            .map((tc) => tc.toolName),
        },
        message: '查询完成',
      };
    } catch (e) {
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

```typescript
// src/modules/agent/agent.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentService } from './agent.service';
import { SessionModule } from '../session/session.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [ConfigModule, SessionModule, ToolsModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
```

- [ ] **步骤 3：Commit**

```bash
git add src/modules/agent/ src/utils/cost-tracker.ts
git commit -m "feat: 添加 Agent 服务（Vercel AI SDK 工具调用）"
```

---

### 任务 11：Redis 缓存模块

**文件：**
- 创建：`src/modules/redis/redis.service.ts`
- 创建：`src/modules/redis/redis.module.ts`

- [ ] **步骤 1：创建 Redis 服务**

```typescript
// src/modules/redis/redis.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis 连接错误: ${err.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async cacheEmployeeInfo(employeeId: string, data: any, ttl = 300): Promise<void> {
    await this.set(`employee:${employeeId}`, JSON.stringify(data), ttl);
  }

  async getCachedEmployeeInfo(employeeId: string): Promise<any | null> {
    const cached = await this.get(`employee:${employeeId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheAgentResponse(questionHash: string, response: any, ttl = 60): Promise<void> {
    await this.set(`agent:${questionHash}`, JSON.stringify(response), ttl);
  }

  async getCachedAgentResponse(questionHash: string): Promise<any | null> {
    const cached = await this.get(`agent:${questionHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
```

```typescript
// src/modules/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

- [ ] **步骤 2：Commit**

```bash
git add src/modules/redis/
git commit -m "feat: 添加 Redis 缓存模块"
```

---

### 任务 12：API 控制器

**文件：**
- 创建：`src/modules/query/query.controller.ts`
- 创建：`src/modules/query/query.module.ts`
- 创建：`src/modules/streaming/streaming.controller.ts`
- 创建：`src/modules/streaming/streaming.module.ts`

- [ ] **步骤 1：创建主查询控制器**

```typescript
// src/modules/query/query.controller.ts
import {
  Controller, Post, Get, Body, Param, Query, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseData } from '../../common/dto/response.dto';
import { QueryRequest } from '../../schemas/query.schema';
import { EvaluateRequest, RankRequest } from '../../schemas/evaluate.schema';
import { AgentService } from '../agent/agent.service';
import { SessionService } from '../session/session.service';
import { AnalysisToolsService } from '../tools/analysis-tools.service';

@ApiTags('queries')
@Controller('api')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private agentService: AgentService,
    private sessionService: SessionService,
    private analysisTools: AnalysisToolsService,
  ) {}

  @Post('query')
  @ApiOperation({ summary: '智能查询端点' })
  async query(@Body() request: QueryRequest) {
    this.logger.log(`收到查询请求: ${request.question}`);

    // 获取或创建会话
    const session = await this.sessionService.getOrCreateSession(
      'default_user',
      request.sessionId,
    );

    // 获取会话历史
    const history = await this.sessionService.getConversationHistory(session.id, 10);

    // 使用 Agent 处理查询
    const result = await this.agentService.queryWithAgent(request.question, history);

    // 保存消息
    await this.sessionService.saveMessage(session.id, 'user', request.question);
    await this.sessionService.saveMessage(session.id, 'assistant', JSON.stringify(result.data || {}));

    return new ResponseData(0, {
      sessionId: session.id,
      result: result.data,
      message: result.message || '查询完成',
    });
  }

  @Get('sessions/:sessionId/history')
  @ApiOperation({ summary: '获取会话历史' })
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit: number = 20,
  ) {
    const history = await this.sessionService.getConversationHistory(sessionId, limit);
    return new ResponseData(0, {
      sessionId,
      messages: history,
      count: history.length,
    });
  }

  @Post('sessions/:sessionId/close')
  @ApiOperation({ summary: '关闭会话' })
  async closeSession(@Param('sessionId') sessionId: string) {
    await this.sessionService.closeSession(sessionId);
    return new ResponseData(0, { sessionId, status: 'closed' });
  }

  @Post('evaluate/technical')
  @ApiOperation({ summary: '评估员工技术能力' })
  async evaluateTechnical(@Body() request: EvaluateRequest) {
    const results = [];
    for (const empId of request.employeeIds) {
      const resultJson = await this.analysisTools.evaluateTechnicalStrength(empId);
      const parsed = JSON.parse(resultJson);
      results.push(parsed.data || {});
    }
    return new ResponseData(0, { total: results.length, evaluations: results });
  }

  @Post('evaluate/communication')
  @ApiOperation({ summary: '评估员工沟通能力' })
  async evaluateCommunication(@Body() request: EvaluateRequest) {
    const results = [];
    for (const empId of request.employeeIds) {
      const resultJson = await this.analysisTools.evaluateCommunicationAbility(empId);
      const parsed = JSON.parse(resultJson);
      results.push(parsed.data || {});
    }
    return new ResponseData(0, { total: results.length, evaluations: results });
  }

  @Post('evaluate/leadership')
  @ApiOperation({ summary: '评估员工领导力' })
  async evaluateLeadership(@Body() request: EvaluateRequest) {
    const results = [];
    for (const empId of request.employeeIds) {
      const resultJson = await this.analysisTools.evaluateLeadershipAbility(empId);
      const parsed = JSON.parse(resultJson);
      results.push(parsed.data || {});
    }
    return new ResponseData(0, { total: results.length, evaluations: results });
  }

  @Post('rank')
  @ApiOperation({ summary: '排名候选员工' })
  async rankCandidates(@Body() request: RankRequest) {
    request.validateMetrics();
    const resultJson = await this.analysisTools.rankCandidates(request.employeeIds, request.metrics);
    const parsed = JSON.parse(resultJson);
    return new ResponseData(0, parsed.data || {});
  }
}
```

```typescript
// src/modules/query/query.module.ts
import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { AgentModule } from '../agent/agent.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [AgentModule, ToolsModule],
  controllers: [QueryController],
})
export class QueryModule {}
```

- [ ] **步骤 2：创建流式输出控制器**

```typescript
// src/modules/streaming/streaming.controller.ts
import {
  Controller, Get, Post, Query as QueryParam, Req, Sse, Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable, from, mergeMap } from 'rxjs';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
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
  async test(@Body() body: any) {
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
  stream(@QueryParam('prompt') prompt: string, @Req() request: Request) {
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'qwen';
    let model: any;

    if (provider === 'anthropic') {
      const anthropic = createAnthropic({
        apiKey: this.configService.get<string>('CLAUDE_API_KEY'),
      });
      model = anthropic(this.configService.get<string>('CLAUDE_MODEL') || 'claude-opus-4-6');
    } else {
      const qwen = createOpenAI({
        baseURL: this.configService.get<string>('OPEN_BASE_URL'),
        apiKey: this.configService.get<string>('OPEN_API_KEY'),
      });
      model = qwen(this.configService.get<string>('OPEN_MODEL') || 'qwen-plus');
    }

    const result = streamText({
      model,
      prompt,
      tools: this.toolRegistry.getVercelTools(),
      maxSteps: 6,
    });

    return result.textStream;
  }
}
```

```typescript
// src/modules/streaming/streaming.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamingController } from './streaming.controller';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [ConfigModule, ToolsModule],
  controllers: [StreamingController],
})
export class StreamingModule {}
```

- [ ] **步骤 3：Commit**

```bash
git add src/modules/query/ src/modules/streaming/
git commit -m "feat: 添加查询和流式输出 API 控制器"
```

---

### 任务 13：根模块与启动入口

**文件：**
- 修改：`src/app.module.ts`
- 修改：`src/main.ts`

- [ ] **步骤 1：创建根模块**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { SessionModule } from './modules/session/session.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AgentModule } from './modules/agent/agent.module';
import { QueryModule } from './modules/query/query.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { RedisModule } from './modules/redis/redis.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    RedisModule,
    SessionModule,
    ToolsModule,
    AgentModule,
    QueryModule,
    StreamingModule,
  ],
})
export class AppModule {}
```

- [ ] **步骤 2：创建启动入口**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // 全局前缀
  app.setGlobalPrefix('');

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  });

  // 静态文件
  app.useStaticAssets(join(__dirname, '..', 'static'), { prefix: '/static' });

  // 健康检查
  app.use('/api/health', (req: express.Request, res: express.Response) => {
    res.json({
      code: 0,
      data: { status: 'healthy', timestamp: new Date().toISOString() },
      msg: 'success',
    });
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Employee Query Agent')
    .setDescription('智能员工查询 AI Agent API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);
  logger.log(`应用启动成功，端口: ${port}`);
  logger.log(`Swagger 文档: http://localhost:${port}/api/docs`);
}
bootstrap();
```

- [ ] **步骤 3：验证编译**

```bash
cd "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs"
npx nest build
```

预期：编译成功，无错误。

- [ ] **步骤 4：Commit**

```bash
git add src/app.module.ts src/main.ts
git commit -m "feat: 添加根模块和启动入口（含 Swagger）"
```

---

### 任务 14：静态文件和 SQL 脚本

**文件：**
- 复制：`static/index.html`
- 复制：`static/sse.html`

- [ ] **步骤 1：复制静态文件和 SQL**

```bash
cp "D:/MyProject/MyDemoProject/app-ai-agent-test/static/index.html" "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs/static/index.html"
cp "D:/MyProject/MyDemoProject/app-ai-agent-test/static/sse.html" "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs/static/sse.html"
```

- [ ] **步骤 2：Commit**

```bash
git add static/ sql/
git commit -m "chore: 添加静态文件和 SQL schema"
```

---

### 任务 15：种子数据脚本

**文件：**
- 创建：`scripts/seed-data.ts`

- [ ] **步骤 1：创建种子数据脚本**

```typescript
// scripts/seed-data.ts
import { DataSource } from 'typeorm';
import * as path from 'path';

// 环境变量（手动加载，不依赖 NestJS）
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USERNAME = process.env.DB_USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_DATABASE = process.env.DB_DATABASE || 'employee_agent';

const DEPARTMENTS = ['技术部', '产品部', '运营部', '市场部', '财务部', '人力资源部', '销售部'];
const POSITIONS = ['工程师', '高级工程师', '技术主管', '产品经理', '运营经理', '市场总监', '销售代表', '财务管理员', 'HR经理', 'CTO'];
const SALARY_LEVELS = ['初级', '中级', '高级', '专家', '管理层'];
const TECHNOLOGIES = ['Python', 'Java', 'JavaScript', 'Go', 'Rust', 'C++', 'React', 'Vue.js', 'Angular', 'Django', 'Spring', 'FastAPI', 'Node.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure'];
const PROJECT_NAMES = ['员工管理系统', '客户关系管理系统', '供应链管理', '数据分析平台', '实时通信系统', '电商平台', '内容管理系统', '财务管理系统', '人力资源管理系统', '移动应用开发'];
const FEEDBACK_CATEGORIES = ['沟通', '协作', '技术能力', '领导力', '反馈能力', '创新能力', '执行力', '学习能力', '影响力'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seed() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      数据库模拟数据生成工具           ║');
  console.log('╚════════════════════════════════════════╝\n');

  const dataSource = new DataSource({
    type: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  await dataSource.initialize();

  try {
    // 生成员工
    console.log('正在生成 1500 名员工...');
    const now = new Date();
    for (let i = 0; i < 1500; i++) {
      const hireDate = new Date(now.getTime() - randomInt(365, 3650) * 24 * 60 * 60 * 1000);
      await dataSource.query(
        `INSERT INTO employees (name, age, email, phone, department, position, hire_date, salary_level, status, manager_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `员工_${i + 1}`, randomInt(22, 60), `employee_${i + 1}@company.com`,
          `1${randomInt(3, 9)}${randomInt(100000000, 999999999)}`,
          randomChoice(DEPARTMENTS), randomChoice(POSITIONS), hireDate,
          randomChoice(SALARY_LEVELS), Math.random() > 0.1 ? '在职' : '离职', null,
        ],
      );
      if ((i + 1) % 100 === 0) console.log(`  已生成 ${i + 1}/1500 名员工`);
    }

    // 设置管理关系
    console.log('正在设置员工管理关系...');
    const employees = await dataSource.query('SELECT id FROM employees');
    for (const emp of employees) {
      if (Math.random() > 0.5) {
        const possibleManagers = employees.filter((e: any) => e.id !== emp.id);
        const manager = randomChoice(possibleManagers);
        await dataSource.query('UPDATE employees SET manager_id = ? WHERE id = ?', [manager.id, emp.id]);
      }
    }

    // 生成项目
    console.log('正在生成 300 个项目...');
    for (let i = 0; i < 300; i++) {
      const startDate = new Date(now.getTime() - randomInt(365, 1825) * 24 * 60 * 60 * 1000);
      const duration = randomInt(30, 365);
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
      await dataSource.query(
        `INSERT INTO projects (name, description, start_date, end_date, complexity)
         VALUES (?, ?, ?, ?, ?)`,
        [`${randomChoice(PROJECT_NAMES)}_v${i + 1}`, `这是项目 ${i + 1} 的描述`, startDate, endDate, randomChoice(['低', '中', '高', '非常高'])],
      );
      if ((i + 1) % 50 === 0) console.log(`  已生成 ${i + 1}/300 个项目`);
    }

    // 生成员工-项目关联
    console.log('正在生成员工-项目关联数据...');
    const projects = await dataSource.query('SELECT id, start_date, end_date FROM projects');
    let assocCount = 0;
    for (const emp of employees) {
      const projectCount = randomInt(2, 5);
      const selectedProjects = randomSample(projects, projectCount);
      for (const proj of selectedProjects) {
        await dataSource.query(
          `INSERT INTO employee_projects (employee_id, project_id, role, technologies, contribution_level, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            emp.id, proj.id, randomChoice(['开发', '测试', '设计', '产品', '架构', '运维']),
            randomSample(TECHNOLOGIES, randomInt(2, 5)).join(', '),
            (Math.random() * 0.7 + 0.3).toFixed(2), proj.start_date, proj.end_date,
          ],
        );
        assocCount++;
        if (assocCount % 500 === 0) console.log(`  已生成 ${assocCount} 条关联记录`);
      }
    }

    // 生成反馈
    console.log('正在生成员工反馈数据...');
    let fbCount = 0;
    for (const emp of employees) {
      const fbNum = randomInt(2, 5);
      for (let j = 0; j < fbNum; j++) {
        await dataSource.query(
          `INSERT INTO employee_feedback (employee_id, category, score, feedback_text, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [
            emp.id, randomChoice(FEEDBACK_CATEGORIES), randomInt(3, 5),
            `这是针对${emp.name}的反馈记录`, `评价者_${randomInt(1, 100)}`,
          ],
        );
        fbCount++;
        if (fbCount % 1000 === 0) console.log(`  已生成 ${fbCount} 条反馈记录`);
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║      数据生成完成！                   ║');
    console.log('╚════════════════════════════════════════╝\n');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('数据生成失败:', err);
  process.exit(1);
});
```

- [ ] **步骤 2：Commit**

```bash
git add scripts/
git commit -m "feat: 添加种子数据生成脚本"
```

---

### 任务 16：Docker 配置

**文件：**
- 创建：`docker-compose.yml`
- 创建：`Dockerfile`

- [ ] **步骤 1：创建 Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY static ./static
COPY sql ./sql

EXPOSE 8000
CMD ["node", "dist/main.js"]
```

- [ ] **步骤 2：创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: employee_agent_mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: employee_agent
      MYSQL_USER: app_user
      MYSQL_PASSWORD: app_password
      MYSQL_CHARSET: utf8mb4
      MYSQL_COLLATION: utf8mb4_unicode_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - employee_agent_network

  redis:
    image: redis:7-alpine
    container_name: employee_agent_redis
    ports:
      - "6379:6379"
    networks:
      - employee_agent_network

  app:
    build: .
    container_name: employee_agent_app
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USERNAME: app_user
      DB_PASSWORD: app_password
      DB_DATABASE: employee_agent
      LLM_PROVIDER: qwen
      CLAUDE_API_KEY: ${CLAUDE_API_KEY}
      OPEN_API_KEY: ${OPEN_API_KEY}
      OPEN_MODEL: qwen-plus
      OPEN_BASE_URL: https://dashscope.aliyuncs.com/compatible-mode/v1
      REDIS_HOST: redis
      REDIS_PORT: 6379
      PORT: 8000
    ports:
      - "8000:8000"
    volumes:
      - ./logs:/app/logs
    networks:
      - employee_agent_network
    restart: unless-stopped

volumes:
  mysql_data:
    driver: local

networks:
  employee_agent_network:
    driver: bridge
```

- [ ] **步骤 3：Commit**

```bash
git add docker-compose.yml Dockerfile
git commit -m "feat: 添加 Docker 配置（含 Redis）"
```

---

### 任务 17：验证与端到端测试

**文件：**
- 修改：`test/app.e2e-spec.ts`

- [ ] **步骤 1：编写健康检查 E2E 测试**

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.code).toBe(0);
        expect(res.body.data.status).toBe('healthy');
      });
  });
});
```

- [ ] **步骤 2：运行编译验证**

```bash
cd "D:/MyProject/MyDemoProject/app-ai-agent-test-nestjs"
npx nest build
```

预期：编译成功。

- [ ] **步骤 3：Commit**

```bash
git add test/
git commit -m "test: 添加健康检查 E2E 测试"
```

---

## 自检结果

**1. 规格覆盖度：** 设计文档的每个章节都有对应任务覆盖：
- 配置 → 任务 2
- 数据库实体 → 任务 4
- Schema/DTO → 任务 5
- Session 服务 → 任务 6
- 13 个工具 → 任务 7, 8, 9
- 工具注册 → 任务 9
- Agent 服务 → 任务 10
- API 路由 → 任务 12
- Redis → 任务 11
- 流式输出 → 任务 12
- Swagger → 任务 13
- Docker → 任务 16
- 测试 → 任务 17

**2. 占位符扫描：** 无 TODO/TBD/待定。

**3. 类型一致性：** 所有任务中引用的方法名、属性名和参数类型与定义处一致。
