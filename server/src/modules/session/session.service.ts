/**
 * 会话服务类
 * 提供会话管理功能，包括会话创建、查询、消息记录和会话关闭
 */
import { Injectable, Logger } from '@nestjs/common'; // NestJS 装饰器和日志工具
import { InjectRepository } from '@nestjs/typeorm'; // TypeORM 仓库注入装饰器
import { Repository } from 'typeorm'; // TypeORM 仓库类型
import { v4 as uuidv4 } from 'uuid'; // UUID 生成工具
import { ConversationSession } from '../../models/session.entity'; // 会话实体
import { ConversationMessage } from '../../models/conversation-message.entity'; // 会话消息实体

/**
 * SessionService - 会话服务
 * 管理用户与 AI Agent 的对话会话生命周期
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name); // 日志实例

  /**
   * 构造函数
   * @param sessionRepo 会话仓库
   * @param messageRepo 消息仓库
   */
  constructor(
    @InjectRepository(ConversationSession)
    private sessionRepo: Repository<ConversationSession>,
    @InjectRepository(ConversationMessage)
    private messageRepo: Repository<ConversationMessage>,
  ) {}

  /**
   * 获取或创建会话
   * 如果提供了有效的 sessionId 则返回该会话，否则创建新会话
   * @param userId 用户 ID
   * @param sessionId 会话 ID（可选）
   * @returns 会话实体
   */
  async getOrCreateSession(userId: string, sessionId?: string): Promise<ConversationSession> {
    // 如果提供了会话 ID，尝试查找已有会话
    if (sessionId) {
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId, userId },
      });
      if (session) {
        // 更新最后活动时间
        session.lastActivity = new Date();
        await this.sessionRepo.save(session);
        return session;
      }
    }

    // 创建新会话
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

  /**
   * 获取会话历史消息
   * @param sessionId 会话 ID
   * @param limit 返回消息数量限制，默认 20
   * @returns 消息列表
   */
  async getConversationHistory(sessionId: string, limit: number = 20): Promise<any[]> {
    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' }, // 按创建时间升序
      take: limit,
    });

    // 转换为简洁的消息格式
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));
  }

  /**
   * 保存会话消息
   * @param sessionId 会话 ID
   * @param role 角色（user/assistant）
   * @param content 消息内容
   */
  async saveMessage(sessionId: string, role: string, content: string): Promise<void> {
    const message = this.messageRepo.create({
      id: uuidv4(),
      sessionId,
      role,
      content,
    });
    await this.messageRepo.save(message);

    // 更新会话最后活动时间
    await this.sessionRepo.update(
      { id: sessionId },
      { lastActivity: new Date() },
    );
    this.logger.log(`保存消息 - 会话: ${sessionId}, 角色: ${role}`);
  }

  /**
   * 列出会话列表
   * @param userId 用户 ID（可选），指定后只返回该用户的会话
   * @param activeOnly 是否只返回活跃会话，默认 false
   * @returns 会话列表
   */
  async listSessions(userId?: string, activeOnly = false): Promise<any[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (activeOnly) where.isActive = true;

    const sessions = await this.sessionRepo.find({
      where,
      order: { lastActivity: 'DESC' }, // 按最后活动时间降序
      take: 50,
    });

    // 为每个会话获取最后一条用户消息作为摘要
    const result = await Promise.all(
      sessions.map(async (session) => {
        const lastMsg = await this.messageRepo.findOne({
          where: { sessionId: session.id, role: 'user' },
          order: { createdAt: 'DESC' },
        });
        return {
          id: session.id,
          userId: session.userId,
          isActive: session.isActive,
          createdAt: session.createdAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
          closedAt: session.closedAt?.toISOString() || null,
          lastMessage: lastMsg?.content?.slice(0, 100) || '新会话', // 截取前 100 字符
          messageCount: await this.messageRepo.count({
            where: { sessionId: session.id },
          }),
        };
      }),
    );

    return result;
  }

  /**
   * 关闭会话
   * 将会话标记为非活跃状态，并记录关闭时间
   * @param sessionId 会话 ID
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.sessionRepo.update(
      { id: sessionId },
      { isActive: false, closedAt: new Date() },
    );
    this.logger.log(`关闭会话 - 会话ID: ${sessionId}`);
  }
}