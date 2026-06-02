/**
 * Redis 模块
 * 提供 Redis 缓存服务，作为全局模块供其他模块使用
 */
import { Global, Module } from '@nestjs/common'; // NestJS 全局模块和模块装饰器
import { ConfigModule } from '@nestjs/config'; // 配置模块
import { RedisService } from './redis.service'; // Redis 服务类

/**
 * RedisModule - Redis 缓存模块
 * @Global() 装饰器将其标记为全局模块，在任何模块中都可注入 RedisService
 */
@Global()
@Module({
  imports: [ConfigModule], // 导入配置模块以获取 Redis 连接配置
  providers: [RedisService], // 注册 RedisService 为服务提供者
  exports: [RedisService], // 导出 RedisService 供其他模块使用
})
export class RedisModule {}