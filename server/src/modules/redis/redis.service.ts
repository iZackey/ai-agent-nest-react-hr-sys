/**
 * Redis 服务类
 * 封装 Redis 操作，提供基础缓存功能和业务特定的缓存方法
 */
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'; // NestJS 装饰器和生命周期接口
import { ConfigService } from '@nestjs/config'; // 配置服务
import Redis from 'ioredis'; // ioredis 客户端库

/**
 * RedisService - Redis 缓存服务
 * 实现 OnModuleDestroy 接口，在模块销毁时关闭 Redis 连接
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name); // 日志实例
  private readonly client: Redis; // Redis 客户端实例

  /**
   * 构造函数
   * @param configService 配置服务，用于获取 Redis 连接参数
   */
  constructor(private configService: ConfigService) {
    // 创建 Redis 客户端
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost', // Redis 主机地址
      port: this.configService.get<number>('REDIS_PORT') || 6379, // Redis 端口
      maxRetriesPerRequest: 3, // 每个请求最大重试次数
    });

    // 监听错误事件
    this.client.on('error', (err) => {
      this.logger.warn(`Redis 连接错误: ${err.message}`);
    });
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，不存在返回 null
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttlSeconds 过期时间（秒），可选
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds); // 设置带过期时间
    } else {
      await this.client.set(key, value); // 永久缓存
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 缓存员工信息
   * @param employeeId 员工 ID
   * @param data 员工数据
   * @param ttl 过期时间（秒），默认 300 秒（5分钟）
   */
  async cacheEmployeeInfo(employeeId: string, data: any, ttl = 300): Promise<void> {
    await this.set(`employee:${employeeId}`, JSON.stringify(data), ttl);
  }

  /**
   * 获取缓存的员工信息
   * @param employeeId 员工 ID
   * @returns 员工数据，不存在返回 null
   */
  async getCachedEmployeeInfo(employeeId: string): Promise<any | null> {
    const cached = await this.get(`employee:${employeeId}`);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * 缓存 Agent 响应结果
   * @param questionHash 问题的哈希值（用于唯一标识）
   * @param response 响应数据
   * @param ttl 过期时间（秒），默认 60 秒
   */
  async cacheAgentResponse(questionHash: string, response: any, ttl = 60): Promise<void> {
    await this.set(`agent:${questionHash}`, JSON.stringify(response), ttl);
  }

  /**
   * 获取缓存的 Agent 响应
   * @param questionHash 问题的哈希值
   * @returns 响应数据，不存在返回 null
   */
  async getCachedAgentResponse(questionHash: string): Promise<any | null> {
    const cached = await this.get(`agent:${questionHash}`);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * 模块销毁时执行
   * 关闭 Redis 连接，释放资源
   */
  onModuleDestroy() {
    this.client.disconnect();
  }
}