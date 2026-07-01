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
import { SessionService } from '../session/session.service';

@ApiTags('test')
@Controller('api')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(
    private configService: ConfigService,
    private toolRegistry: ToolRegistryService,
    private sessionService: SessionService,
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
  async stream(
    @QueryParam('prompt') prompt: string,
    @Res() res: any,
    @QueryParam('sessionId') sessionId?: string,
  ) {
    const baseURL = this.configService.get<string>('OPEN_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4';
    const apiKey = this.configService.get<string>('OPEN_API_KEY') || '';
    const modelName = this.configService.get<string>('OPEN_MODEL') || 'glm-4-flash';

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      // 获取或创建会话，并获取历史记录
      const session = await this.sessionService.getOrCreateSession('default_user', sessionId);
      const history = await this.sessionService.getConversationHistory(session.id, 10);

      // 构建带历史上下文的 prompt
      const historyMessages = history.map((msg) => {
        const role = msg.role === 'user' ? 'human' : 'assistant';
        return `${role}: ${msg.content}`;
      }).join('\n\n');

      const contextPrompt = historyMessages
        ? `以下是之前的对话历史，请结合上下文回答用户的新问题：

${historyMessages}

---

当前用户问题：${prompt}`
        : prompt;

      const tools = this.toolRegistry.getLangChainTools();
      const model = new ChatOpenAI({
        modelName,
        apiKey,
        temperature: 0.1,
        streaming: true,
        configuration: {
          baseURL,
        },
      });

      const chatPrompt = ChatPromptTemplate.fromMessages([
        ['system', '你是一个智能员工查询助手，能够帮助用户查询和分析员工信息。如果用户的问题涉及之前对话中的内容，请结合上下文回答。'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
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

      const result = await executor.invoke({ input: contextPrompt });
      const agentAnswer = result.output || '';

      const streamModel = new ChatOpenAI({
        modelName,
        apiKey,
        temperature: 0.1,
        streaming: true,
        configuration: {
          baseURL,
        },
      });

      let finalPrompt = contextPrompt;
      if (agentAnswer && agentAnswer.trim() && !agentAnswer.includes('未找到') && !agentAnswer.includes('没有结果')) {
        finalPrompt = `基于以下信息回答用户问题：\n\n用户问题：${contextPrompt}\n\n参考信息：${agentAnswer}`;
      }

      const responsePrompt = ChatPromptTemplate.fromMessages([
        ['system', '你是一个智能员工查询助手，能够帮助用户查询和分析员工信息。如果用户的问题涉及之前对话中的内容，请结合上下文回答。'],
        ['human', '{input}'],
      ]);

      const chain = responsePrompt.pipe(streamModel);
      const stream = await chain.stream({ input: finalPrompt });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }

      // 保存对话到会话历史
      await this.sessionService.saveMessage(session.id, 'user', prompt);
      await this.sessionService.saveMessage(session.id, 'assistant', fullResponse);

      res.write(`data: ${JSON.stringify({ done: true, sessionId: session.id })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error(`流式响应错误: ${error}`);
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : '未知错误' })}\n\n`);
      res.end();
    }
  }
}
