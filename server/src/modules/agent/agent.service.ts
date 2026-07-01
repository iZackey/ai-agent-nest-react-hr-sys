import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
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

    return new ChatOpenAI({
      modelName,
      apiKey,
      temperature: 0.1,
      configuration: {
        baseURL,
      },
    });
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

  private buildPrompt() {
    return ChatPromptTemplate.fromMessages([
      ['system', this.buildSystemPrompt()],
      ['placeholder', '{chat_history}'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);
  }

  async queryWithAgent(question: string, conversationHistory: any[] = []): Promise<any> {
    try {
      this.logger.log(`Agent处理查询: ${question}`);

      const tools = this.toolRegistry.getLangChainTools();
      const model = this.getModel();
      const prompt = this.buildPrompt();

      const chatHistory = conversationHistory.map(msg =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );

      const agent = createToolCallingAgent({
        llm: model,
        tools,
        prompt,
      });

      const executor = new AgentExecutor({
        agent,
        tools,
        maxIterations: this.maxIterations,
        verbose: true,
      });

      const result = await executor.invoke({
        input: question,
        chat_history: chatHistory,
      });

      this.logger.log(`Agent处理完成: ${result.output}`);

      return {
        success: true,
        data: {
          answer: result.output,
          steps: result.steps?.length || 0,
          toolCalls: result.steps?.flatMap((s: any) => s.toolCalls?.map((tc: any) => tc.toolName) || []) || [],
        },
        message: '查询完成',
      };
    } catch (e: any) {
      this.logger.error(`Agent处理失败: ${e.message}`);
      return {
        success: false,
        data: null,
        message: `处理失败: ${e.message}`,
      };
    }
  }
}