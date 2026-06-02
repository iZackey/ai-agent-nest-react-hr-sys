/**
 * 数据库模块
 * 负责配置和管理 TypeORM 数据库连接
 */
import { Module } from '@nestjs/common'; // NestJS 模块装饰器
import { TypeOrmModule } from '@nestjs/typeorm'; // TypeORM 集成模块
import { ConfigModule, ConfigService } from '@nestjs/config'; // 配置服务

/**
 * DatabaseModule - 数据库连接模块
 * 使用 TypeORM 异步配置 MySQL 数据库连接
 */
@Module({
  imports: [
    // TypeORM 异步配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // 导入配置模块
      inject: [ConfigService], // 注入配置服务
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const, // 数据库类型：MySQL
        host: configService.get<string>('DB_HOST'), // 数据库主机地址
        port: configService.get<number>('DB_PORT'), // 数据库端口
        username: configService.get<string>('DB_USERNAME'), // 数据库用户名
        password: configService.get<string>('DB_PASSWORD'), // 数据库密码
        database: configService.get<string>('DB_DATABASE'), // 数据库名称
        entities: [__dirname + '/../models/*.entity{.ts,.js}'], // 实体类路径
        synchronize: false, // 禁用自动同步（生产环境建议关闭）
        poolSize: 20, // 连接池大小
        extra: { connectionLimit: 20 }, // 额外连接参数
      }),
    }),
  ],
})
export class DatabaseModule {}