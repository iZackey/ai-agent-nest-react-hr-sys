import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, stepCountIs } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
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
    const baseURL = this.configService.get<string>('OPEN_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4';
    const apiKey = this.configService.get<string>('OPEN_API_KEY') || '';
    const modelName = this.configService.get<string>('OPEN_MODEL') || 'glm-4-flash';

    const client = createOpenAICompatible({
      name: 'llm-provider',
      apiKey,
      baseURL,
    });
    return client(modelName);
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
        stopWhen: stepCountIs(this.maxIterations),
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
      this.logger.error(`完整错误: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
      return {
        success: false,
        data: null,
        message: `处理失败: ${e.message}`,
      };
    }
  }
}
