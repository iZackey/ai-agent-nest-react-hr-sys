import { Injectable, Logger } from '@nestjs/common';
import { tool, Tool } from 'ai';
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

  /** 返回 Vercel AI SDK 格式的工具定义 */
  getVercelTools(): Record<string, Tool> {
    return {
      // 查询工具
      query_by_structure: tool({
        description: '按结构化条件查询员工，支持部门、职位、薪酬等级、年龄范围等条件',
        inputSchema: z.object({
          conditions_json: z.string().describe('JSON格式的查询条件，如{"department": "技术部", "age_min": 25, "age_max": 40}'),
        }),
        execute: async ({ conditions_json }) => {
          return await this.queryTools.queryByStructure(conditions_json);
        },
      }),
      search_by_keyword: tool({
        description: '按关键词搜索员工，支持名字、部门、职位等字段的模糊搜索',
        inputSchema: z.object({
          keyword: z.string().describe('搜索关键词'),
        }),
        execute: async ({ keyword }) => {
          return await this.queryTools.searchByKeyword(keyword);
        },
      }),

      // 员工工具
      get_employee_info: tool({
        description: '获取员工的详细基础信息，包括姓名、部门、职位、薪酬等',
        inputSchema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.employeeTools.getEmployeeInfo(employee_id);
        },
      }),
      get_employee_projects: tool({
        description: '获取员工的项目历史记录，包括项目名称、角色、技术栈、复杂度等',
        inputSchema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.employeeTools.getEmployeeProjects(employee_id);
        },
      }),
      get_employee_feedback: tool({
        description: '获取员工的反馈评价信息，包括评分、反馈内容、统计数据',
        inputSchema: z.object({
          employee_id: z.number().describe('员工ID'),
          limit: z.number().optional().describe('返回反馈数量限制，默认10条'),
        }),
        execute: async ({ employee_id, limit }) => {
          return await this.employeeTools.getEmployeeFeedback(employee_id, limit || 10);
        },
      }),

      // 格式化工具
      format_employee_data: tool({
        description: '将员工原始数据格式化为易读的格式',
        inputSchema: z.object({
          employee: z.any().describe('员工数据对象'),
        }),
        execute: async ({ employee }) => {
          return this.utilityTools.formatEmployeeData(employee);
        },
      }),
      summarize_projects: tool({
        description: '总结员工的项目经历，包括技术栈、复杂度分布等',
        inputSchema: z.object({
          projects: z.array(z.any()).describe('项目列表'),
        }),
        execute: async ({ projects }) => {
          return this.utilityTools.summarizeProjects(projects);
        },
      }),
      summarize_feedback: tool({
        description: '总结员工的反馈数据，包括按类别分组、评价等级等',
        inputSchema: z.object({
          feedbacks: z.any().describe('反馈数据对象，包含feedbacks列表和statistics'),
        }),
        execute: async ({ feedbacks }) => {
          return this.utilityTools.summarizeFeedback(feedbacks);
        },
      }),
      format_comparison: tool({
        description: '格式化多个员工的对比数据',
        inputSchema: z.object({
          employees: z.array(z.any()).describe('员工列表'),
        }),
        execute: async ({ employees }) => {
          return this.utilityTools.formatComparison(employees);
        },
      }),
      extract_key_insights: tool({
        description: '提取员工的关键信息和指标',
        inputSchema: z.object({
          employee_data: z.any().describe('员工数据对象'),
        }),
        execute: async ({ employee_data }) => {
          return this.utilityTools.extractKeyInsights(employee_data);
        },
      }),

      // 分析工具
      evaluate_technical_strength: tool({
        description: '评估员工的技术能力，基于项目复杂度、技术多样性和贡献度',
        inputSchema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.analysisTools.evaluateTechnicalStrength(employee_id);
        },
      }),
      evaluate_communication_ability: tool({
        description: '评估员工的沟通能力，基于反馈数据',
        inputSchema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.analysisTools.evaluateCommunicationAbility(employee_id);
        },
      }),
      evaluate_leadership_ability: tool({
        description: '评估员工的领导力，基于管理规模、职位级别和反馈',
        inputSchema: z.object({
          employee_id: z.number().describe('员工ID'),
        }),
        execute: async ({ employee_id }) => {
          return await this.analysisTools.evaluateLeadershipAbility(employee_id);
        },
      }),
      rank_candidates: tool({
        description: '对多个员工候选进行综合评分和排名',
        inputSchema: z.object({
          employee_ids: z.array(z.number()).describe('候选员工ID列表'),
          weights: z.object({
            technical: z.number().optional(),
            communication: z.number().optional(),
            leadership: z.number().optional(),
          }).optional().describe('评分权重'),
        }),
        execute: async ({ employee_ids, weights }) => {
          return await this.analysisTools.rankCandidates(employee_ids, weights as any);
        },
      }),
    };
  }
}
