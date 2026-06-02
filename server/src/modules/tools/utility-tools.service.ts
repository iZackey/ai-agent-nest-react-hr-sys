import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UtilityToolsService {
  private readonly logger = new Logger(UtilityToolsService.name);

  formatEmployeeData(employee: any): string {
    try {
      if (!employee) {
        return JSON.stringify({ success: false, message: '员工数据为空' });
      }
      return JSON.stringify({
        success: true,
        data: {
          基本信息: {
            员工ID: employee.id,
            姓名: employee.name,
            年龄: employee.age,
            邮箱: employee.email,
            电话: employee.phone,
          },
          工作信息: {
            部门: employee.department,
            职位: employee.position,
            入职日期: String(employee.hireDate || employee.hire_date || ''),
            薪酬等级: employee.salaryLevel || employee.salary_level,
            状态: employee.status,
            直属经理ID: employee.managerId || employee.manager_id,
          },
        },
      });
    } catch (e) {
      this.logger.error(`格式化员工数据失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `格式化失败: ${e.message}` });
    }
  }

  summarizeProjects(projects: any[]): string {
    try {
      if (!projects || projects.length === 0) {
        return JSON.stringify({
          success: true,
          data: { totalProjects: 0, summary: '该员工暂无项目记录' },
        });
      }

      const technologiesSet = new Set<string>();
      let totalContribution = 0;
      const complexityDistribution: Record<string, number> = {};

      for (const project of projects) {
        const techs = (project.technologies || '').split(',');
        techs.forEach((t: string) => { if (t.trim()) technologiesSet.add(t.trim()); });

        totalContribution += parseFloat(project.contributionLevel || project.contribution_level || '0');

        const complexity = project.complexity || '未知';
        complexityDistribution[complexity] = (complexityDistribution[complexity] || 0) + 1;
      }

      const avgContribution = totalContribution / projects.length;

      return JSON.stringify({
        success: true,
        data: {
          totalProjects: projects.length,
          averageContributionLevel: Math.round(avgContribution * 100) / 100,
          technologies: [...technologiesSet],
          complexityDistribution,
          projectsDetail: projects.map((p) => ({
            name: p.name,
            role: p.role,
            contributionLevel: p.contributionLevel || p.contribution_level,
            complexity: p.complexity,
            period: `${p.startDate || p.start_date} 至 ${p.endDate || p.end_date}`,
          })),
        },
      });
    } catch (e) {
      this.logger.error(`总结项目失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `总结失败: ${e.message}` });
    }
  }

  summarizeFeedback(feedbacks: any): string {
    try {
      if (!feedbacks || !feedbacks.feedbacks || feedbacks.feedbacks.length === 0) {
        return JSON.stringify({ success: true, data: { summary: '该员工暂无反馈记录' } });
      }

      const feedbackList = feedbacks.feedbacks;
      const statistics = feedbacks.statistics || {};
      const feedbackByCategory: Record<string, any> = {};

      for (const feedback of feedbackList) {
        const category = feedback.category || '其他';
        if (!feedbackByCategory[category]) {
          feedbackByCategory[category] = { count: 0, scores: [], feedbacks: [] };
        }
        feedbackByCategory[category].count++;
        feedbackByCategory[category].scores.push(feedback.score || 0);
        feedbackByCategory[category].feedbacks.push(feedback.feedbackText || feedback.feedback_text || '');
      }

      const categorySummary: Record<string, any> = {};
      for (const [category, data] of Object.entries(feedbackByCategory)) {
        const avgScore = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length;
        categorySummary[category] = {
          count: data.count,
          averageScore: Math.round(avgScore * 10) / 10,
          feedbackSamples: data.feedbacks.slice(0, 2),
        };
      }

      return JSON.stringify({
        success: true,
        data: {
          totalFeedbacks: statistics.total || 0,
          overallAverageScore: statistics.averageScore || statistics.average_score || 0,
          categories: statistics.categories || [],
          categoryDetails: categorySummary,
          evaluationLevel: this.getEvaluationLevel(statistics.averageScore || statistics.average_score || 0),
        },
      });
    } catch (e) {
      this.logger.error(`总结反馈失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `总结失败: ${e.message}` });
    }
  }

  formatComparison(employees: any[]): string {
    try {
      if (!employees || employees.length === 0) {
        return JSON.stringify({ success: false, message: '没有员工数据可用于对比' });
      }
      return JSON.stringify({
        success: true,
        data: {
          totalEmployees: employees.length,
          employees: employees.map((e) => ({
            id: e.id, name: e.name, department: e.department,
            position: e.position, age: e.age,
            salaryLevel: e.salaryLevel || e.salary_level,
            status: e.status,
          })),
          departments: [...new Set(employees.map((e) => e.department).filter(Boolean))],
          positions: [...new Set(employees.map((e) => e.position).filter(Boolean))],
          salaryLevels: [...new Set(employees.map((e) => e.salaryLevel || e.salary_level).filter(Boolean))],
        },
      });
    } catch (e) {
      this.logger.error(`格式化对比数据失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `格式化失败: ${e.message}` });
    }
  }

  extractKeyInsights(employeeData: any): string {
    try {
      return JSON.stringify({
        success: true,
        data: {
          profile: {
            name: employeeData.name,
            department: employeeData.department,
            position: employeeData.position,
            tenureYears: this.calculateTenure(employeeData.hireDate || employeeData.hire_date),
            status: employeeData.status,
          },
          keyMetrics: {
            contact: { email: employeeData.email, phone: employeeData.phone },
          },
        },
      });
    } catch (e) {
      this.logger.error(`提取关键信息失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `提取失败: ${e.message}` });
    }
  }

  private getEvaluationLevel(avgScore: number): string {
    if (avgScore >= 4.5) return '优秀';
    if (avgScore >= 4.0) return '良好';
    if (avgScore >= 3.0) return '中等';
    return '需要改进';
  }

  private calculateTenure(hireDate: any): string {
    try {
      if (!hireDate) return '未知';
      const date = new Date(hireDate);
      const now = new Date();
      const years = Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return years > 0 ? `${years}年` : '不足1年';
    } catch {
      return '未知';
    }
  }
}
