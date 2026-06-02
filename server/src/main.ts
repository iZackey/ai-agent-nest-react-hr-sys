/**
 * NestJS 应用入口文件
 * 负责启动应用、配置全局中间件、过滤器、拦截器等
 */
import { NestFactory } from '@nestjs/core'; // NestJS 核心工厂类，用于创建应用实例
import { ValidationPipe, Logger } from '@nestjs/common'; // 验证管道和日志工具
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Swagger 文档生成模块
import { AppModule } from './app.module'; // 应用根模块
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // 全局异常过滤器
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // 全局日志拦截器
import { NestExpressApplication } from '@nestjs/platform-express'; // Express 平台应用类型
import { join } from 'path'; // 路径处理工具

/**
 * 应用启动引导函数
 * 负责配置和启动 NestJS 应用
 */
async function bootstrap() {
  // 创建 NestJS 应用实例，指定使用 Express 平台
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 创建日志实例，标签为 'Bootstrap'
  const logger = new Logger('Bootstrap');

  // 设置全局路由前缀（当前为空，即无前缀）
  app.setGlobalPrefix('');
  
  // 注册全局验证管道
  // - transform: 自动将请求体转换为 DTO 类实例
  // - whitelist: 自动移除未在 DTO 中定义的属性
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  
  // 注册全局异常过滤器，统一处理异常响应格式
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 注册全局日志拦截器，记录所有请求和响应
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // 配置 CORS 跨域
  // - origin: '*' 允许所有来源
  // - methods: '*' 允许所有 HTTP 方法
  // - allowedHeaders: '*' 允许所有请求头
  // - credentials: true 允许携带凭证
  app.enableCors({ origin: '*', methods: '*', allowedHeaders: '*', credentials: true });
  
  // 配置静态资源服务
  // - 静态文件目录: 项目根目录下的 static 文件夹
  // - 请求前缀: /static
  app.useStaticAssets(join(__dirname, '..', '..', 'static'), { prefix: '/static' });

  /**
   * 健康检查接口
   * GET /api/health
   * 返回应用健康状态
   */
  app.use('/api/health', (req: any, res: any) => {
    res.json({
      code: 0,
      data: { status: 'healthy', timestamp: new Date().toISOString() },
      msg: 'success'
    });
  });

  /**
   * Swagger API 文档配置
   */
  const config = new DocumentBuilder()
    .setTitle('Employee Query Agent') // API 文档标题
    .setDescription('智能员工查询 AI Agent API') // API 文档描述
    .setVersion('1.0') // API 版本
    .build(); // 构建文档配置
  
  // 根据配置创建 Swagger 文档
  const document = SwaggerModule.createDocument(app, config);
  // 配置 Swagger UI 访问路径为 /api/docs
  SwaggerModule.setup('api/docs', app, document);

  /**
   * 启动应用监听
   */
  // 获取端口号，优先使用环境变量 PORT，默认 8000
  const port = process.env.PORT || 8000;
  
  // 启动应用，监听指定端口
  await app.listen(port);
  
  // 输出启动日志
  logger.log(`应用启动成功，端口: ${port}`);
  logger.log(`Swagger 文档: http://localhost:${port}/api/docs`);
}

// 调用启动函数
bootstrap();