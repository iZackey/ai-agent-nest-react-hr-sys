import {
  Controller, Post, Get, Body, Param, Query, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseData } from '../../common/dto/response.dto';
import { QueryRequest } from '../../schemas/query.schema';
import { EvaluateRequest, RankRequest } from '../../schemas/evaluate.schema';
import { AgentService } from '../agent/agent.service';
import { SessionService } from '../session/session.service';
import { AnalysisToolsService } from '../tools/analysis-tools.service';
import { QueryToolsService } from '../tools/query-tools.service';

@ApiTags('queries')
@Controller('api')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private agentService: AgentService,
    private sessionService: SessionService,
    private analysisTools: AnalysisToolsService,
    private queryTools: QueryToolsService,
  ) {}

  @Post('query')
  @ApiOperation({ summary: '智能查询端点' })
  async query(@Body() request: QueryRequest) {
    this.logger.log(`收到查询请求: ${request.question}`);

    // 获取或创建会话
    const session = await this.sessionService.getOrCreateSession(
      'default_user',
      request.sessionId,
    );

    // 获取会话历史
    const history = await this.sessionService.getConversationHistory(session.id, 10);

    // 使用 Agent 处理查询
    const result = await this.agentService.queryWithAgent(request.question, history);

    // 保存消息
    await this.sessionService.saveMessage(session.id, 'user', request.question);
    await this.sessionService.saveMessage(session.id, 'assistant', JSON.stringify(result.data || {}));

    return new ResponseData(0, {
      sessionId: session.id,
      result: result.data,
      message: result.message || '查询完成',
    });
  }

  @Get('sessions')
  @ApiOperation({ summary: '获取会话列表' })
  async listSessions(
    @Query('userId') userId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const sessions = await this.sessionService.listSessions(
      userId,
      activeOnly === 'true',
    );
    return new ResponseData(0, { total: sessions.length, sessions });
  }

  @Get('sessions/:sessionId/history')
  @ApiOperation({ summary: '获取会话历史' })
  async getSessionHistory(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit: number = 20,
  ) {
    const history = await this.sessionService.getConversationHistory(sessionId, limit);
    return new ResponseData(0, {
      sessionId,
      messages: history,
      count: history.length,
    });
  }

  @Post('sessions/:sessionId/close')
  @ApiOperation({ summary: '关闭会话' })
  async closeSession(@Param('sessionId') sessionId: string) {
    await this.sessionService.closeSession(sessionId);
    return new ResponseData(0, { sessionId, status: 'closed' });
  }

  @Post('evaluate/technical')
  @ApiOperation({ summary: '评估员工技术能力' })
  async evaluateTechnical(@Body() request: EvaluateRequest) {
    const results: any[] = [];
    for (const empId of request.employeeIds) {
      const resultJson = await this.analysisTools.evaluateTechnicalStrength(empId);
      const parsed = JSON.parse(resultJson);
      results.push(parsed.data || {});
    }
    return new ResponseData(0, { total: results.length, evaluations: results });
  }

  @Post('evaluate/communication')
  @ApiOperation({ summary: '评估员工沟通能力' })
  async evaluateCommunication(@Body() request: EvaluateRequest) {
    const results: any[] = [];
    for (const empId of request.employeeIds) {
      const resultJson = await this.analysisTools.evaluateCommunicationAbility(empId);
      const parsed = JSON.parse(resultJson);
      results.push(parsed.data || {});
    }
    return new ResponseData(0, { total: results.length, evaluations: results });
  }

  @Post('evaluate/leadership')
  @ApiOperation({ summary: '评估员工领导力' })
  async evaluateLeadership(@Body() request: EvaluateRequest) {
    const results: any[] = [];
    for (const empId of request.employeeIds) {
      const resultJson = await this.analysisTools.evaluateLeadershipAbility(empId);
      const parsed = JSON.parse(resultJson);
      results.push(parsed.data || {});
    }
    return new ResponseData(0, { total: results.length, evaluations: results });
  }

  @Post('rank')
  @ApiOperation({ summary: '排名候选员工' })
  async rankCandidates(@Body() request: RankRequest) {
    request.validateMetrics();
    const resultJson = await this.analysisTools.rankCandidates(request.employeeIds, request.metrics);
    const parsed = JSON.parse(resultJson);
    return new ResponseData(0, parsed.data || {});
  }

  @Post('find-employees')
  @ApiOperation({ summary: '根据姓名查找员工ID' })
  async findEmployeesByNames(@Body() body: { names: string[] }) {
    const { names } = body;
    if (!names || names.length === 0) {
      return new ResponseData(0, { employees: [] });
    }
    const employees = await this.queryTools.findEmployeesByNames(names);
    return new ResponseData(0, { employees });
  }
}
