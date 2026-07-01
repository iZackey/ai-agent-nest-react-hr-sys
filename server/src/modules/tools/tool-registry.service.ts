import { Injectable, Logger } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { QueryToolsService } from './query-tools.service';
import { EmployeeToolsService } from './employee-tools.service';
import { UtilityToolsService } from './utility-tools.service';
import { AnalysisToolsService } from './analysis-tools.service';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);

  constructor(
    private queryTools: QueryToolsService,
    private employeeTools: EmployeeToolsService,
    private utilityTools: UtilityToolsService,
    private analysisTools: AnalysisToolsService,
  ) {
    this.logger.log('工具注册完成');
  }

  getLangChainTools() {
    return [
      tool(
        async (conditions: Record<string, any>) => {
          return await this.queryTools.queryByStructure(JSON.stringify(conditions));
        },
        {
          name: 'query_by_structure',
          description: '按结构化条件查询员工，支持部门、职位、薪酬等级、年龄范围等条件',
          schema: z.object({
            department: z.string().optional().describe('部门名称'),
            position: z.string().optional().describe('职位'),
            salaryLevel: z.string().optional().describe('薪酬等级'),
            status: z.string().optional().describe('状态'),
            age_min: z.number().optional().describe('最小年龄'),
            age_max: z.number().optional().describe('最大年龄'),
          }),
        },
      ),
      tool(
        async ({ keyword }: { keyword: string }) => {
          return await this.queryTools.searchByKeyword(keyword);
        },
        {
          name: 'search_by_keyword',
          description: '按关键词搜索员工，支持名字、部门、职位等字段的模糊搜索',
          schema: z.object({
            keyword: z.string().describe('搜索关键词'),
          }),
        },
      ),
      tool(
        async ({ employee_id }: { employee_id: string | number }) => {
          return await this.employeeTools.getEmployeeInfo(Number(employee_id));
        },
        {
          name: 'get_employee_info',
          description: '获取员工的详细基础信息，包括姓名、部门、职位、薪酬等',
          schema: z.object({
            employee_id: z.union([z.string(), z.number()]).describe('员工ID'),
          }),
        },
      ),
      tool(
        async ({ employee_id }: { employee_id: string | number }) => {
          return await this.employeeTools.getEmployeeProjects(Number(employee_id));
        },
        {
          name: 'get_employee_projects',
          description: '获取员工的项目历史记录，包括项目名称、角色、技术栈、复杂度等',
          schema: z.object({
            employee_id: z.union([z.string(), z.number()]).describe('员工ID'),
          }),
        },
      ),
      tool(
        async ({ employee_id, limit }: { employee_id: string | number; limit?: number }) => {
          return await this.employeeTools.getEmployeeFeedback(Number(employee_id), limit || 10);
        },
        {
          name: 'get_employee_feedback',
          description: '获取员工的反馈评价信息，包括评分、反馈内容、统计数据',
          schema: z.object({
            employee_id: z.union([z.string(), z.number()]).describe('员工ID'),
            limit: z.number().optional().describe('返回反馈数量限制，默认10条'),
          }),
        },
      ),
      tool(
        async ({ employee }: { employee: any }) => {
          return this.utilityTools.formatEmployeeData(employee);
        },
        {
          name: 'format_employee_data',
          description: '将员工原始数据格式化为易读的格式',
          schema: z.object({
            employee: z.any().describe('员工数据对象'),
          }),
        },
      ),
      tool(
        async ({ projects }: { projects: any[] }) => {
          return this.utilityTools.summarizeProjects(projects);
        },
        {
          name: 'summarize_projects',
          description: '总结员工的项目经历，包括技术栈、复杂度分布等',
          schema: z.object({
            projects: z.array(z.any()).describe('项目列表'),
          }),
        },
      ),
      tool(
        async ({ feedbacks }: { feedbacks: any }) => {
          return this.utilityTools.summarizeFeedback(feedbacks);
        },
        {
          name: 'summarize_feedback',
          description: '总结员工的反馈数据，包括按类别分组、评价等级等',
          schema: z.object({
            feedbacks: z.any().describe('反馈数据对象，包含feedbacks列表和statistics'),
          }),
        },
      ),
      tool(
        async ({ employees }: { employees: any[] }) => {
          return this.utilityTools.formatComparison(employees);
        },
        {
          name: 'format_comparison',
          description: '格式化多个员工的对比数据',
          schema: z.object({
            employees: z.array(z.any()).describe('员工列表'),
          }),
        },
      ),
      tool(
        async ({ employee_data }: { employee_data: any }) => {
          return this.utilityTools.extractKeyInsights(employee_data);
        },
        {
          name: 'extract_key_insights',
          description: '提取员工的关键信息和指标',
          schema: z.object({
            employee_data: z.any().describe('员工数据对象'),
          }),
        },
      ),
      tool(
        async ({ employee_id }: { employee_id: string | number }) => {
          return await this.analysisTools.evaluateTechnicalStrength(Number(employee_id));
        },
        {
          name: 'evaluate_technical_strength',
          description: '评估员工的技术能力，基于项目复杂度、技术多样性和贡献度',
          schema: z.object({
            employee_id: z.union([z.string(), z.number()]).describe('员工ID'),
          }),
        },
      ),
      tool(
        async ({ employee_id }: { employee_id: string | number }) => {
          return await this.analysisTools.evaluateCommunicationAbility(Number(employee_id));
        },
        {
          name: 'evaluate_communication_ability',
          description: '评估员工的沟通能力，基于反馈数据',
          schema: z.object({
            employee_id: z.union([z.string(), z.number()]).describe('员工ID'),
          }),
        },
      ),
      tool(
        async ({ employee_id }: { employee_id: string | number }) => {
          return await this.analysisTools.evaluateLeadershipAbility(Number(employee_id));
        },
        {
          name: 'evaluate_leadership_ability',
          description: '评估员工的领导力，基于管理规模、职位级别和反馈',
          schema: z.object({
            employee_id: z.union([z.string(), z.number()]).describe('员工ID'),
          }),
        },
      ),
      tool(
        async ({ employee_ids, weights }: { employee_ids: (string | number)[]; weights?: Record<string, number> }) => {
          return await this.analysisTools.rankCandidates(employee_ids.map(Number), weights as any);
        },
        {
          name: 'rank_candidates',
          description: '对多个员工候选进行综合评分和排名',
          schema: z.object({
            employee_ids: z.array(z.union([z.string(), z.number()])).describe('候选员工ID列表'),
            weights: z.object({
              technical: z.number().optional(),
              communication: z.number().optional(),
              leadership: z.number().optional(),
            }).optional().describe('评分权重'),
          }),
        },
      ),
    ];
  }
}