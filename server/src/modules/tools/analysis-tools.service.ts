/**
 * ============================================================
 * 员工能力分析工具服务 (AnalysisToolsService)
 * ============================================================
 *
 * 本服务是 AI Agent 的"分析类工具"，用于对员工进行多维度能力量化评估。
 * 与 employee-tools.service.ts（数据查询类工具）不同，本服务侧重于"计算与分析"。
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  整体架构                                              │
 * │                                                         │
 * │  候选人排名 rankCandidates()                             │
 * │       │                                                 │
 * │       ├── evaluateTechnicalStrength()   技术能力评估     │
 * │       ├── evaluateCommunicationAbility() 沟通能力评估    │
 * │       └── evaluateLeadershipAbility()   领导力评估       │
 * │                                                         │
 * │  每个评估方法都遵循相同的模式：                            │
 * │  1. 从数据库查询原始数据                                  │
 * │  2. 遍历数据，累加各项指标                               │
 * │  3. 计算加权综合评分                                     │
 * │  4. 转换为等级和文字评估                                  │
 * │  5. 返回 JSON 字符串供 Agent 解析                        │
 * └─────────────────────────────────────────────────────────┘
 *
 * 返回格式约定（所有公共方法统一）：
 *   成功时：{ success: true,  data: { ... }, message?: string }
 *   失败时：{ success: false, message: "错误信息" }
 *
 * 评分等级标准（通用）：
 *   优秀：≥80  |  良好：≥70  |  中等：≥60  |  及格：≥50  |  需要改进：<50
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../models/employee.entity';
import { EmployeeProject } from '../../models/employee-project.entity';
import { EmployeeFeedback } from '../../models/employee-feedback.entity';
import { COMPLEXITY_WEIGHTS, LEADERSHIP_POSITION_WEIGHTS } from '../../core/constants';

@Injectable()
export class AnalysisToolsService {
  private readonly logger = new Logger(AnalysisToolsService.name);

  // ================================================================
  // 构造函数 — 注入三个 TypeORM 仓储
  // ================================================================
  // 为什么需要三个仓储？
  //   - employeeRepo：查询员工基本信息（职位、部门、上下级关系）
  //   - empProjectRepo：查询员工参与的项目（用于技术能力评估）
  //   - feedbackRepo：查询反馈记录（用于沟通能力和领导力评估）
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeProject)
    private empProjectRepo: Repository<EmployeeProject>,
    @InjectRepository(EmployeeFeedback)
    private feedbackRepo: Repository<EmployeeFeedback>,
  ) {}

  // ================================================================
  // 公共方法 1：技术能力评估
  // ================================================================

  /**
   * 评估员工的技术能力，返回 0~100 的量化评分。
   *
   * ── 评分逻辑详解 ──────────────────────────────────────────
   *
   * 综合评分由三个维度加权得出：
   *
   *   technicalScore = avgComplexityScore × 15
   *                  + avgContribution × 20
   *                  + techDiversityScore × 0.65
   *
   *  维度              │ 数据来源               │ 计算方式                │ 权重
   *  ─────────────────┼──────────────────────┼───────────────────────┼───────
   *  项目复杂度得分     │ project.complexity    │ 复杂度权重累加后取均值   │ × 15
   *  贡献度得分        │ ep.contributionLevel  │ 贡献级别累加后取均值     │ × 20
   *  技术栈广度得分     │ ep.technologies       │ 不同技术数量 / 3 × 100  │ × 0.65
   *
   *  复杂度权重映射（来自 COMPLEXITY_WEIGHTS 常量）：
   *    '低' → 1,  '中' → 2,  '高' → 3,  '非常高' → 4
   *
   *  技术栈广度封顶规则：掌握 3 项及以上不同技术即得满分 100。
   *
   * ── 使用示例 ──────────────────────────────────────────────
   *
   *  // Agent 调用
   *  const result = await analysisToolsService.evaluateTechnicalStrength(42);
   *  // 返回：
   *  // {
   *  //   "success": true,
   *  //   "data": {
   *  //     "employeeId": 42,
   *  //     "technicalScore": 76.5,
   *  //     "level": "良好",
   *  //     "metrics": {
   *  //       "averageProjectComplexity": 2.3,
   *  //       "averageContributionLevel": 78.5,
   *  //       "technologyDiversity": 5,
   *  //       "technologies": ["Java", "Python", "React", "SQL", "Docker"],
   *  //       "projectCount": 8
   *  //     },
   *  //     "assessment": "员工具有良好的技术基础，技术栈覆盖广泛(5项)"
   *  //   }
   *  // }
   *
   * ── 边界情况 ──────────────────────────────────────────────
   *
   *  - 员工无项目经历：返回 technicalScore = 0, level = '无法评估'
   *  - project.complexity 缺失：默认按 '中'（权重 2）处理
   *  - technologies 字段为空：不计入技术栈广度统计
   *  - contributionLevel 解析失败：按 0 处理（parseFloat 返回 NaN 时）
   *
   * @param employeeId - 要评估的员工 ID
   * @returns JSON 字符串，包含评分结果或错误信息
   */
  async evaluateTechnicalStrength(employeeId: number): Promise<string> {
    try {
      // ── 第 1 步：查询员工的项目经历 ────────────────────────
      // 使用 LEFT JOIN 关联项目表，获取项目复杂度等信息
      // 按项目结束日期降序排列（最近的项目排在前面）
      const projects = await this.empProjectRepo
        .createQueryBuilder('ep')
        .leftJoinAndSelect('ep.project', 'p')
        .where('ep.employeeId = :empId', { empId: employeeId })
        .orderBy('p.endDate', 'DESC')
        .getMany();

      // ── 第 2 步：处理无项目经历的边界情况 ──────────────────
      if (projects.length === 0) {
        return JSON.stringify({
          success: true,
          data: { employeeId, technicalScore: 0, level: '无法评估', reason: '员工没有项目经历' },
        });
      }

      // ── 第 3 步：遍历所有项目，累加各维度指标 ──────────────
      let complexityScore = 0;              // 累加的项目复杂度总分
      const technologyDiversity = new Set<string>();  // 用 Set 自动去重，记录掌握的不同技术
      let contributionTotal = 0;            // 累加的贡献度总分

      for (const project of projects) {
        // 3a. 累加项目复杂度得分
        //     如果项目没有关联或没有设置复杂度，默认使用 '中'（权重 2）
        const complexity = project.project?.complexity || '中';
        complexityScore += COMPLEXITY_WEIGHTS[complexity] || 2;

        // 3b. 收集技术栈（逗号分隔的字符串拆分为数组）
        //     例如 "Java,Spring Boot,MySQL" → ['Java', 'Spring Boot', 'MySQL']
        //     空字符串和空白项会被过滤掉
        const techs = (project.technologies || '').split(',');
        techs.forEach((t) => { if (t.trim()) technologyDiversity.add(t.trim()); });

        // 3c. 累加贡献度（contributionLevel 存储为字符串，需要转换为数字）
        contributionTotal += parseFloat(project.contributionLevel || '0');
      }

      // ── 第 4 步：计算各项平均分和最终评分 ──────────────────
      const projectCount = projects.length;
      const avgComplexityScore = complexityScore / projectCount;  // 平均复杂度得分
      const avgContribution = contributionTotal / projectCount;    // 平均贡献度

      // 技术栈广度得分：掌握 3 项及以上技术即封顶为 100 分
      // 例：掌握 2 项 → (2/3)×100 ≈ 66.7；掌握 5 项 → min(5/3, 1)×100 = 100
      const techDiversityScore = Math.min(technologyDiversity.size / 3.0, 1.0) * 100;

      // 最终技术综合评分 = 复杂度 × 15 + 贡献度 × 20 + 技术广度 × 0.65
      // 三个维度的满分贡献：4×15=60 + 100×20=2000 + 100×0.65=65
      // 实际上各项指标的量级不同，加权后综合评分大致在 0~100 范围
      const technicalScore = avgComplexityScore * 15 + avgContribution * 20 + techDiversityScore * 0.65;

      // ── 第 5 步：转换为等级标签 ────────────────────────────
      const level = this.getLevelFromScore(technicalScore);

      // ── 第 6 步：组装返回结果 ──────────────────────────────
      return JSON.stringify({
        success: true,
        data: {
          employeeId,
          technicalScore: Math.round(technicalScore * 10) / 10,      // 保留一位小数
          level,
          metrics: {
            averageProjectComplexity: Math.round(avgComplexityScore * 10) / 10,
            averageContributionLevel: Math.round(avgContribution * 100) / 100,
            technologyDiversity: technologyDiversity.size,
            technologies: [...technologyDiversity].sort(),  // 技术栈按字母排序，方便展示
            projectCount,
          },
          assessment: this.getTechnicalAssessment(technicalScore, avgComplexityScore, technologyDiversity.size),
        },
      });
    } catch (e) {
      this.logger.error(`技术能力评估失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `评估失败: ${e.message}` });
    }
  }

  // ================================================================
  // 公共方法 2：沟通能力评估
  // ================================================================

  /**
   * 评估员工的沟通协作能力，基于历史反馈记录进行量化评分。
   *
   * ── 评分逻辑详解 ──────────────────────────────────────────
   *
   *  第 1 步：从反馈表中筛选与"沟通"相关的记录
   *           筛选条件：category 属于 ['沟通', '协作', '反馈能力', '影响力']
   *           只取最近 20 条（按 createdAt 降序），避免过于久远的数据影响评估
   *
   *  第 2 步：按 category（反馈类别）分组，计算每个类别的平均分
   *           例如：'沟通' 类别有 5 条记录，分数分别是 [85, 90, 78, 88, 92]
   *                 → 该类别平均分 = (85+90+78+88+92) / 5 = 86.6
   *
   *  第 3 步：计算所有类别的平均分的平均值，乘以系数 20 得到最终评分
   *           communicationScore = (各类别均值之和 / 类别数) × 20
   *
   *  为什么乘以 20？
   *     反馈分数通常在 0~5 分范围内，乘以 20 后映射到 0~100 分。
   *     例：平均分 4.3 → 4.3 × 20 = 86 分
   *
   * ── 使用示例 ──────────────────────────────────────────────
   *
   *  const result = await analysisToolsService.evaluateCommunicationAbility(42);
   *  // 返回：
   *  // {
   *  //   "success": true,
   *  //   "data": {
   *  //     "employeeId": 42,
   *  //     "communicationScore": 82.5,
   *  //     "level": "优秀",
   *  //     "categoryScores": { "沟通": 4.3, "协作": 4.1, "影响力": 3.8 },
   *  //     "feedbackCount": 12,
   *  //     "assessment": "员工沟通能力突出，能够有效地与团队成员协作"
   *  //   }
   *  // }
   *
   * ── 边界情况 ──────────────────────────────────────────────
   *
   *  - 员工没有任何沟通类反馈：返回 communicationScore = 0, level = '无法评估'
   *  - feedback.category 为空：归入 '其他' 类别
   *  - 只有一个类别有数据：只计算该类别的均值
   *
   * @param employeeId - 要评估的员工 ID
   * @returns JSON 字符串，包含评分结果或错误信息
   */
  async evaluateCommunicationAbility(employeeId: number): Promise<string> {
    try {
      // ── 第 1 步：查询沟通相关的反馈记录 ────────────────────
      // IN 查询筛选 4 个相关类别，取最近 20 条
      const feedbacks = await this.feedbackRepo
        .createQueryBuilder('fb')
        .where('fb.employeeId = :empId', { empId: employeeId })
        .andWhere('fb.category IN (:...categories)', {
          categories: ['沟通', '协作', '反馈能力', '影响力'],
        })
        .orderBy('fb.createdAt', 'DESC')
        .limit(20)
        .getMany();

      // ── 第 2 步：处理无反馈数据的边界情况 ──────────────────
      if (feedbacks.length === 0) {
        return JSON.stringify({
          success: true,
          data: { employeeId, communicationScore: 0, level: '无法评估', reason: '员工没有沟通相关的反馈数据' },
        });
      }

      // ── 第 3 步：按反馈类别分组，收集各分类的分数 ──────────
      // categoryScores 结构示例：
      //   { "沟通": [85, 90, 78], "协作": [88, 92], "影响力": [75] }
      const categoryScores: Record<string, number[]> = {};
      for (const feedback of feedbacks) {
        const category = feedback.category || '其他';
        if (!categoryScores[category]) categoryScores[category] = [];
        categoryScores[category].push(feedback.score);
      }

      // ── 第 4 步：计算各分类的平均分 ────────────────────────
      // categoryAvg 结构示例：
      //   { "沟通": 84.3, "协作": 90.0, "影响力": 75.0 }
      const categoryAvg: Record<string, number> = {};
      let overallTotal = 0;
      for (const [category, scores] of Object.entries(categoryScores)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        categoryAvg[category] = Math.round(avg * 10) / 10;  // 保留一位小数
        overallTotal += avg;
      }

      // ── 第 5 步：计算最终沟通评分 ──────────────────────────
      // communicationScore = (所有类别均值之和 / 类别数) × 20
      // 系数 20 将 0~5 分映射到 0~100 分
      const communicationScore = Object.keys(categoryScores).length > 0
        ? (overallTotal / Object.keys(categoryScores).length) * 20
        : 0;

      // ── 第 6 步：转换等级并返回结果 ────────────────────────
      const level = this.getLevelFromScore(communicationScore);

      return JSON.stringify({
        success: true,
        data: {
          employeeId,
          communicationScore: Math.round(communicationScore * 10) / 10,
          level,
          categoryScores: categoryAvg,    // 各分类的平均分，帮助 Agent 了解具体哪些方面强/弱
          feedbackCount: feedbacks.length, // 参与评估的反馈条数，数据量越少结论可信度越低
          assessment: this.getCommunicationAssessment(communicationScore, categoryAvg),
        },
      });
    } catch (e) {
      this.logger.error(`沟通能力评估失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `评估失败: ${e.message}` });
    }
  }

  // ================================================================
  // 公共方法 3：领导力评估
  // ================================================================

  /**
   * 评估员工的领导力，综合管理规模、反馈数据和职位级别三个维度。
   *
   * ── 评分逻辑详解 ──────────────────────────────────────────
   *
   *  领导力评分 = 反馈得分 + 管理得分 + 职位得分
   *
   *  ┌──────────────┬──────────────────────┬──────────────────────┬────────┐
   *  │ 维度          │ 数据来源             │ 计算方式             │ 满分   │
   *  ├──────────────┼──────────────────────┼──────────────────────┼────────┤
   *  │ 反馈得分      │ 领导力相关反馈       │ 反馈均分 × 20        │ 100    │
   *  │ 管理得分      │ 下属人数             │ (人数/10) × 30       │ 30     │
   *  │ 职位得分      │ 员工职位名称         │ 职位权重 × 20        │ 20     │
   *  └──────────────┴──────────────────────┴──────────────────────┴────────┘
   *
   *  反馈维度筛选类别：['领导力', '决策能力', '团队建设', '指导能力']
   *  取最近 15 条反馈记录进行评估。
   *
   *  管理得分封顶规则：管理 10 人即达到满分 30 分（管理再多的人也不额外加分）。
   *
   *  职位权重映射（来自 LEADERSHIP_POSITION_WEIGHTS 常量）：
   *    'CTO' → 1.0,  '总经理' → 1.0,  'VP' → 0.9,  '经理' → 0.7,
   *    '主管' → 0.5,  '组长' → 0.3,  '员工' → 0.0
   *
   *  注意：使用 String.includes() 做模糊匹配。
   *  例如职位为 '高级经理'，会匹配到 '经理'（权重 0.7），而非 '员工'（权重 0.0）。
   *  遍历顺序由 Object.entries() 决定，若有多个前缀命中，取第一个匹配项。
   *
   * ── 使用示例 ──────────────────────────────────────────────
   *
   *  const result = await analysisToolsService.evaluateLeadershipAbility(42);
   *  // 返回：
   *  // {
   *  //   "success": true,
   *  //   "data": {
   *  //     "employeeId": 42,
   *  //     "leadershipScore": 68.5,
   *  //     "level": "中等",
   *  //     "metrics": { "managedTeamSize": 5, "leadershipFeedbackCount": 8, ... },
   *  //     "scoreBreakdown": {
   *  //       "feedbackScore": 45.0,   ← 反馈维度得分
   *  //       "managementScore": 15.0,  ← 管理维度得分
   *  //       "positionScore": 8.5     ← 职位维度得分
   *  //     },
   *  //     "assessment": "员工具有初步的领导能力，管理5名团队成员"
   *  //   }
   *  // }
   *
   * ── 边界情况 ──────────────────────────────────────────────
   *
   *  - 无领导力反馈记录：feedbackScore = 0，仅靠管理规模和职位得分
   *  - 无下属（managedCount = 0）：managementScore = 0
   *  - 职位名称不匹配任何权重：positionScore = 0
   *  - 员工信息不存在：empInfo 为 null，职位和薪资标记为 '未知'
   *
   * @param employeeId - 要评估的员工 ID
   * @returns JSON 字符串，包含评分结果或错误信息
   */
  async evaluateLeadershipAbility(employeeId: number): Promise<string> {
    try {
      // ── 第 1 步：查询管理的下属人数 ────────────────────────
      // 条件：managerId 指向当前员工，且状态为 '在职'
      // 这个数字反映了实际的管理幅度（span of control）
      const managedCount = await this.employeeRepo
        .createQueryBuilder('e')
        .where('e.managerId = :empId', { empId: employeeId })
        .andWhere('e.status = :status', { status: '在职' })
        .getCount();

      // ── 第 2 步：查询领导力相关的反馈记录 ──────────────────
      // 筛选 4 个领导力相关类别，取最近 15 条
      const feedbacks = await this.feedbackRepo
        .createQueryBuilder('fb')
        .where('fb.employeeId = :empId', { empId: employeeId })
        .andWhere('fb.category IN (:...categories)', {
          categories: ['领导力', '决策能力', '团队建设', '指导能力'],
        })
        .orderBy('fb.createdAt', 'DESC')
        .limit(15)
        .getMany();

      // ── 第 3 步：查询员工职位信息 ──────────────────────────
      // 职位用于计算职位维度的领导力权重
      const empInfo = await this.employeeRepo.findOne({ where: { id: employeeId } });

      // ── 第 4 步：计算反馈得分 ──────────────────────────────
      // 公式：反馈均分 × 20（将 0~5 分映射到 0~100 分）
      // 无反馈时 feedbackScore 保持为 0
      let feedbackScore = 0;
      if (feedbacks.length > 0) {
        feedbackScore = (feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length) * 20;
      }

      // ── 第 5 步：计算管理得分 ──────────────────────────────
      // 公式：min(下属人数 / 10, 1.0) × 30
      // 管理 10 人即封顶 30 分；管理 5 人得 15 分；管理 0 人得 0 分
      const managementScore = Math.min(managedCount / 10.0, 1.0) * 30;

      // ── 第 6 步：计算职位得分 ──────────────────────────────
      // 根据职位名称查找对应的领导力权重，再乘以 20
      // 例如 '经理' → 权重 0.7 → 得分 14
      const positionScore = this.getPositionLeadershipWeight(empInfo?.position || '') * 20;

      // ── 第 7 步：汇总为领导力综合评分 ──────────────────────
      // 三个维度简单相加（满分 150），不进行归一化
      // 评分等级判断时仍然按 0~100 范围划分（超过 80 即'优秀'）
      const leadershipScore = feedbackScore + managementScore + positionScore;
      const level = this.getLevelFromScore(leadershipScore);

      // ── 第 8 步：组装返回结果 ──────────────────────────────
      return JSON.stringify({
        success: true,
        data: {
          employeeId,
          leadershipScore: Math.round(leadershipScore * 10) / 10,
          level,
          metrics: {
            managedTeamSize: managedCount,
            leadershipFeedbackCount: feedbacks.length,
            position: empInfo?.position || '未知',
            salaryLevel: empInfo?.salaryLevel || '未知',
          },
          scoreBreakdown: {
            feedbackScore: Math.round(feedbackScore * 10) / 10,
            managementScore: Math.round(managementScore * 10) / 10,
            positionScore: Math.round(positionScore * 10) / 10,
          },
          assessment: this.getLeadershipAssessment(leadershipScore, managedCount),
        },
      });
    } catch (e) {
      this.logger.error(`领导力评估失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `评估失败: ${e.message}` });
    }
  }

  // ================================================================
  // 公共方法 4：候选人综合排名
  // ================================================================

  /**
   * 对多名候选人进行多维度综合评估并排名。
   *
   * ── 排名逻辑详解 ──────────────────────────────────────────
   *
   *  这是本服务最上层的方法，Agent 在需要"从多人中选出最优"时会调用它。
   *
   *  处理流程：
   *    for each 候选人:
   *      1. 查询基本信息（姓名、职位、部门）
   *      2. 调用 evaluateTechnicalStrength()  → 技术评分
   *      3. 调用 evaluateCommunicationAbility() → 沟通评分
   *      4. 调用 evaluateLeadershipAbility()    → 领导力评分
   *      5. 加权求和：totalScore = tech × w₁ + comm × w₂ + lead × w₃
   *    按 totalScore 降序排列
   *    返回排名列表 + 最优候选人
   *
   *  默认权重：technical=0.4, communication=0.3, leadership=0.3
   *  可通过 weights 参数自定义，例如侧重技术的岗位可以设为 { technical: 0.6, ... }
   *
   * ── 使用示例 ──────────────────────────────────────────────
   *
   *  // 从 3 名候选人中选出最优人选（使用默认权重）
   *  const result = await analysisToolsService.rankCandidates([10, 25, 38]);
   *
   *  // 自定义权重：技术岗，更看重技术能力
   *  const result = await analysisToolsService.rankCandidates(
   *    [10, 25, 38],
   *    { technical: 0.6, communication: 0.2, leadership: 0.2 }
   *  );
   *
   *  // 返回：
   *  // {
   *  //   "success": true,
   *  //   "data": {
   *  //     "totalCandidates": 3,
   *  //     "weights": { "technical": 0.6, "communication": 0.2, "leadership": 0.2 },
   *  //     "ranking": [
   *  //       { "employeeId": 25, "name": "张三", "position": "高级工程师", "department": "技术部",
   *  //         "scores": { "technical": 85.2, "communication": 72.0, "leadership": 60.5 },
   *  //         "totalScore": 77.7 },
   *  //       ...
   *  //     ],
   *  //     "topCandidate": { ... }  // 排名第一的候选人（方便 Agent 快速获取结果）
   *  //   }
   *  // }
   *
   * ── 边界情况 ──────────────────────────────────────────────
   *
   *  - 空列表：返回 success=false, message='候选员工列表为空'
   *  - 员工 ID 不存在：跳过该候选人，不计入排名
   *  - 权重中缺少某个维度：使用默认值（technical=0.4, communication=0.3, leadership=0.3）
   *  - 所有候选人都不存在：返回空 ranking 和 topCandidate=null
   *
   * @param employeeIds - 待排名的员工 ID 数组
   * @param weights - 各评估维度的权重，默认 { technical: 0.4, communication: 0.3, leadership: 0.3 }
   * @returns JSON 字符串，包含排名结果或错误信息
   */
  async rankCandidates(
    employeeIds: number[],
    weights: Record<string, number> = { technical: 0.4, communication: 0.3, leadership: 0.3 },
  ): Promise<string> {
    try {
      // ── 第 1 步：校验输入参数 ──────────────────────────────
      if (!employeeIds || employeeIds.length === 0) {
        return JSON.stringify({ success: false, message: '候选员工列表为空' });
      }

      // ── 第 2 步：定义候选人评分收集数组 ────────────────────
      const candidatesScores: Array<{
        employeeId: number;
        name: string;
        position: string;
        department: string;
        scores: { technical: number; communication: number; leadership: number };
        totalScore: number;
      }> = [];

      // ── 第 3 步：逐个评估每位候选人 ────────────────────────
      for (const empId of employeeIds) {
        // 3a. 查询基本信息（只选择需要的字段，减少数据传输量）
        const empInfo = await this.employeeRepo
          .createQueryBuilder('e')
          .select(['e.id', 'e.name', 'e.position', 'e.department'])
          .where('e.id = :empId', { empId })
          .getOne();

        // 3b. 跳过不存在的员工（不报错，静默跳过）
        if (!empInfo) continue;

        // 3c. 调用三个评估方法获取各维度评分
        //     注意：这些方法返回 JSON 字符串，需要 parse 后取值
        const techEval = JSON.parse(await this.evaluateTechnicalStrength(empId));
        const techScore = techEval.data?.technicalScore || 0;

        const commEval = JSON.parse(await this.evaluateCommunicationAbility(empId));
        const commScore = commEval.data?.communicationScore || 0;

        const leadEval = JSON.parse(await this.evaluateLeadershipAbility(empId));
        const leadScore = leadEval.data?.leadershipScore || 0;

        // 3d. 按权重计算加权总分
        //     totalScore = techScore × 0.4 + commScore × 0.3 + leadScore × 0.3
        //     如果权重中缺少某个维度，使用对应的默认值兜底
        const totalScore =
          techScore * (weights.technical || 0.4) +
          commScore * (weights.communication || 0.3) +
          leadScore * (weights.leadership || 0.3);

        // 3e. 收集候选人评分数据
        candidatesScores.push({
          employeeId: empId,
          name: empInfo.name,
          position: empInfo.position,
          department: empInfo.department,
          scores: {
            technical: Math.round(techScore * 10) / 10,
            communication: Math.round(commScore * 10) / 10,
            leadership: Math.round(leadScore * 10) / 10,
          },
          totalScore: Math.round(totalScore * 10) / 10,
        });
      }

      // ── 第 4 步：按总分降序排列（得分高的排在前面）─────────
      candidatesScores.sort((a, b) => b.totalScore - a.totalScore);

      // ── 第 5 步：组装返回结果 ──────────────────────────────
      return JSON.stringify({
        success: true,
        data: {
          totalCandidates: candidatesScores.length,
          weights,                             // 返回实际使用的权重，方便 Agent 确认
          ranking: candidatesScores,           // 完整排名列表
          topCandidate: candidatesScores[0] || null,  // 最优候选人（方便快速获取）
        },
      });
    } catch (e) {
      this.logger.error(`员工排名失败: ${e.message}`);
      return JSON.stringify({ success: false, message: `排名失败: ${e.message}` });
    }
  }

  // ================================================================
  // 私有方法 — 辅助函数
  // ================================================================

  /**
   * 将 0~100 的分数转换为 5 级等级标签。
   *
   * 等级划分标准：
   *   ┌──────────┬───────────┬───────────────────────┐
   *   │ 分数范围  │ 等级       │ 含义                   │
   *   ├──────────┼───────────┼───────────────────────┤
   *   │ ≥ 80     │ 优秀       │ 该维度表现非常突出      │
   *   │ ≥ 70     │ 良好       │ 该维度表现良好          │
   *   │ ≥ 60     │ 中等       │ 该维度达到基本要求      │
   *   │ ≥ 50     │ 及格       │ 该维度勉强达标          │
   *   │ < 50     │ 需要改进   │ 该维度存在明显不足      │
   *   └──────────┴───────────┴───────────────────────┘
   *
   * 被所有三个评估方法（技术/沟通/领导力）复用。
   *
   * @param score - 综合评分（0~100）
   * @returns 中文等级标签
   */
  private getLevelFromScore(score: number): string {
    if (score >= 80) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 60) return '中等';
    if (score >= 50) return '及格';
    return '需要改进';
  }

  /**
   * 根据技术能力评分生成一段简短的人类可读评估文字。
   *
   * 评估内容会根据分数段不同而变化，高分段会包含具体的指标数据
   * （平均复杂度、技术栈数量），帮助 Agent 在对话中引用具体数据。
   *
   * @param score - 技术综合评分
   * @param complexity - 平均项目复杂度得分
   * @param techCount - 掌握的不同技术数量
   * @returns 评估文字（一句话）
   */
  private getTechnicalAssessment(score: number, complexity: number, techCount: number): string {
    if (score >= 80) return `员工拥有出色的技术能力，参与过${complexity.toFixed(1)}平均复杂度的项目，掌握${techCount}项技术栈`;
    if (score >= 70) return `员工具有良好的技术基础，技术栈覆盖广泛(${techCount}项)`;
    return '员工需要继续提升技术能力和项目经验';
  }

  /**
   * 根据沟通能力评分生成一段简短的评估文字。
   *
   * @param score - 沟通综合评分
   * @param categories - 各反馈类别的平均分（目前未在文字中使用，预留用于更细致的描述）
   * @returns 评估文字（一句话）
   */
  private getCommunicationAssessment(score: number, categories: Record<string, number>): string {
    if (score >= 70) return '员工沟通能力突出，能够有效地与团队成员协作';
    if (score >= 50) return '员工具有基本的沟通能力，可继续改进';
    return '员工需要加强沟通和协作能力';
  }

  /**
   * 根据领导力评分和管理规模生成一段简短的评估文字。
   *
   * @param score - 领导力综合评分
   * @param managedCount - 管理的下属人数
   * @returns 评估文字（一句话）
   */
  private getLeadershipAssessment(score: number, managedCount: number): string {
    if (score >= 70) return `员工展现出色的领导力，管理${managedCount}名团队成员`;
    if (score >= 50 && managedCount > 0) return `员工具有初步的领导能力，管理${managedCount}名团队成员`;
    return '员工暂无明显的管理经验或领导力表现';
  }

  /**
   * 根据职位名称查找对应的领导力权重值。
   *
   * ── 匹配逻辑 ──────────────────────────────────────────────
   *
   *  使用 String.includes() 做模糊匹配：
   *    员工职位 = '高级经理'  →  匹配到 '经理'（权重 0.7）✓
   *    员工职位 = '技术主管'  →  匹配到 '主管'（权重 0.5）✓
   *    员工职位 = '实习生'    →  不匹配任何前缀 → 返回 0.0
   *
   *  权重完整映射（LEADERSHIP_POSITION_WEIGHTS 常量）：
   *    CTO → 1.0    总经理 → 1.0    VP → 0.9
   *    经理 → 0.7    主管 → 0.5     组长 → 0.3    员工 → 0.0
   *
   * @param position - 员工的职位名称
   * @returns 领导力权重值（0.0 ~ 1.0），无匹配时返回 0.0
   */
  private getPositionLeadershipWeight(position: string): number {
    for (const [pos, weight] of Object.entries(LEADERSHIP_POSITION_WEIGHTS)) {
      if (position.includes(pos)) return weight;
    }
    return 0.0;
  }
}
