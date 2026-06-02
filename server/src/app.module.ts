/**
 * NestJS 应用根模块
 * 负责组织和配置整个应用的模块依赖关系
 */
import { Module } from '@nestjs/common'; // NestJS 模块装饰器
import { ConfigModule } from '@nestjs/config'; // 配置管理模块
import { DatabaseModule } from './db/database.module'; // 数据库模块
import { SessionModule } from './modules/session/session.module'; // 会话管理模块
import { ToolsModule } from './modules/tools/tools.module'; // 工具函数模块
import { AgentModule } from './modules/agent/agent.module'; // AI Agent 核心模块
import { QueryModule } from './modules/query/query.module'; // 查询模块
import { StreamingModule } from './modules/streaming/streaming.module'; // 流式响应模块
import { RedisModule } from './modules/redis/redis.module'; // Redis 缓存模块
import configuration from './config/configuration'; // 配置加载函数

/**
 * AppModule - 应用根模块
 * 作为整个应用的入口模块，聚合所有业务模块和基础设施模块
 */
@Module({
  imports: [
    // 配置模块配置
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块，所有模块可直接注入 ConfigService
      load: [configuration], // 加载自定义配置函数
      envFilePath: ['.env'], // 指定环境变量文件路径
    }),
    DatabaseModule, // 数据库连接模块（MySQL）
    RedisModule, // Redis 缓存模块
    SessionModule, // 会话管理模块
    ToolsModule, // 工具函数模块
    AgentModule, // AI Agent 核心模块
    QueryModule, // 查询处理模块
    StreamingModule, // 流式响应模块
  ],
})
export class AppModule {}