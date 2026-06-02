/**
 * 会话管理模块
 * 负责管理用户与 AI Agent 的对话会话和消息记录
 */
import { Module } from '@nestjs/common'; // NestJS 模块装饰器
import { TypeOrmModule } from '@nestjs/typeorm'; // TypeORM 集成模块
import { ConversationSession } from '../../models/session.entity'; // 会话实体
import { ConversationMessage } from '../../models/conversation-message.entity'; // 会话消息实体
import { SessionService } from './session.service'; // 会话服务

/**
 * SessionModule - 会话管理模块
 * 提供会话创建、查询、消息记录等功能
 */
@Module({
  imports: [
    // 注册会话相关的实体到 TypeORM
    TypeOrmModule.forFeature([ConversationSession, ConversationMessage]),
  ],
  providers: [SessionService], // 注册会话服务
  exports: [SessionService], // 导出会话服务供其他模块使用
})
export class SessionModule {}