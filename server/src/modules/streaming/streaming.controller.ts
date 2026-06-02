/**
 * 流式响应控制器
 * 提供多种流式输出方式的测试接口，包括 SSE、Observable 等
 */
import {
  Controller, Get, Post, Query as QueryParam, Req, Res, Sse, Logger,
} from '@nestjs/common'; // NestJS 控制器装饰器和工具
import { ApiTags } from '@nestjs/swagger'; // Swagger 标签装饰器
import { Observable } from 'rxjs'; // RxJS 可观察对象
import type { Request } from 'express'; // Express 请求类型
import { ConfigService } from '@nestjs/config'; // 配置服务
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'; // AI SDK OpenAI 兼容层
import { streamText, stepCountIs } from 'ai'; // AI SDK 流式文本生成
import { ResponseData } from '../../common/dto/response.dto'; // 统一响应数据格式
import { ToolRegistryService } from '../tools/tool-registry.service'; // 工具注册服务

/**
 * StreamingController - 流式响应控制器
 * 提供流式输出测试接口
 */
@ApiTags('test')
@Controller('api')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name); // 日志实例

  /**
   * 构造函数
   * @param configService 配置服务
   * @param toolRegistry 工具注册服务
   */
  constructor(
    private configService: ConfigService,
    private toolRegistry: ToolRegistryService,
  ) {}

  /**
   * 测试接口
   * POST /api/test
   * @param req 请求对象
   * @returns 测试响应数据
   */
  @Post('test')
  async test(@Req() req: Request) {
    return new ResponseData(0, { aaa: 111 });
  }

  /**
   * Observable 流式响应示例
   * GET /api/streamingResponse
   * 使用 RxJS Observable 实现逐字输出
   * @returns Observable<string> - 逐字符输出的字符串流
   */
  @Get('streamingResponse')
  streamTextDemo(): Observable<string> {
    const words = '你好，这是一个流式输出的示例。我们会逐字显示这段文字，就像打字机一样。';
    let index = 0;

    return new Observable((subscriber) => {
      const interval = setInterval(() => {
        if (index < words.length) {
          subscriber.next(words[index]); // 发送单个字符
          index++;
        } else {
          clearInterval(interval);
          subscriber.complete(); // 完成流
        }
      }, 50); // 每 50ms 发送一个字符
    });
  }

  /**
   * Server-Sent Events (SSE) 示例
   * GET /api/eventSourceResponse
   * 使用 NestJS @Sse 装饰器实现 SSE 流式响应
   * @returns Observable<MessageEvent> - SSE 消息流
   */
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
      }, 500); // 每 500ms 发送一条消息
    });
  }

  /**
   * AI 流式响应接口
   * GET /api/stream?prompt=<prompt>
   * 调用大模型进行流式文本生成，支持工具调用
   * @param prompt 用户输入的提示词
   * @param res Express 响应对象
   */
  @Get('stream')
  async stream(@QueryParam('prompt') prompt: string, @Res() res: any) {
    // 创建 OpenAI 兼容客户端
    const client = createOpenAICompatible({
      name: 'llm-provider',
      apiKey: this.configService.get<string>('OPEN_API_KEY') || '',
      baseURL: this.configService.get<string>('OPEN_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4',
    });
    // 获取模型实例
    const model = client(this.configService.get<string>('OPEN_MODEL') || 'glm-4-flash');

    // 调用 AI SDK 进行流式文本生成
    const result = streamText({
      model,
      prompt,
      tools: this.toolRegistry.getVercelTools(), // 注册的工具
      stopWhen: stepCountIs(6), // 最多执行 6 步
    });

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 流式输出每个文本块
    for await (const textPart of result.textStream) {
      res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
    }

    // 发送结束标记
    res.write('data: [DONE]\n\n');
    res.end();
  }
}