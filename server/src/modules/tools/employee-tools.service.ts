import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../models/employee.entity';
import { EmployeeProject } from '../../models/employee-project.entity';
import { EmployeeFeedback } from '../../models/employee-feedback.entity';

/**
 * ============================================================
 *  EmployeeToolsService — 员工工具服务（AI Agent 工具层）
 * ============================================================
 *
 * 【定位】
 *  这是一个 NestJS 服务，专门作为 AI Agent 的「工具(Tool)」使用。
 *  与普通 Controller-Service 不同，它的每个方法都返回 JSON 字符串，
 *  而非直接返回实体对象——这是为了让 LLM 能以结构化文本的形式
 *  解析和理解返回数据。
 *
 * 【核心设计模式】
 *  1. @Injectable()    — 声明为 NestJS 可注入的 Provider，
 *                        可被其他 Service / Controller 通过构造函数注入。
 *  2. @InjectRepository — TypeORM 的依赖注入装饰器，
 *                        将数据库表的 Repository 实例注入到服务中，
 *                        无需手动创建连接或管理生命周期。
 *  3. 统一响应格式     — 所有方法都返回 { success, data, message } 的 JSON 字符串，
 *                        方便 Agent 统一处理成功/失败场景。
 *
 * 【数据模型关系】
 *  Employee (1) ──→ (N) EmployeeProject ──→ (1) Project
 *  Employee (1) ──→ (N) EmployeeFeedback
 *
 * 【典型调用链路】
 *  AI Agent → LangChain Tool 描述 → 调用本服务方法 → TypeORM 查询 DB → 返回 JSON
 */
@Injectable()
export class EmployeeToolsService {
  /**
   * NestJS 内置的日志器。
   *
   * 【原理】Logger 接收一个上下文名称（通常是类名），在日志输出中自动加上前缀，
   *  方便在控制台中区分不同服务的日志。等价于带上下文的 console.log，
   *  且支持 log / warn / error / debug / verbose 五个日志级别。
   */
  private readonly logger = new Logger(EmployeeToolsService.name);

  /**
   * 【构造函数注入 — NestJS 依赖注入的核心机制】
   *
   * NestJS 在实例化 EmployeeToolsService 时，会自动：
   *  1. 找到 EmployeeModule 中 imports 的 TypeOrmModule（见 module 注册）
   *  2. 从已注册的实体列表中匹配 Employee / EmployeeProject / EmployeeFeedback
   *  3. 创建对应的 Repository 实例并注入进来
   *
   * 你不需要手动 `new Repository(...)`，NestJS 帮你管理一切：
   *  - 数据库连接的复用与释放
   *  - Repository 实例的单例生命周期
   *  - 模块级别的作用域隔离
   *
   * @param employeeRepo    — Employee 实体的 Repository，对应 `employees` 表
   * @param empProjectRepo  — EmployeeProject 实体的 Repository，对应 `employee_projects` 表
   * @param feedbackRepo    — EmployeeFeedback 实体的 Repository，对应 `employee_feedback` 表
   */
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeProject)
    private empProjectRepo: Repository<EmployeeProject>,
    @InjectRepository(EmployeeFeedback)
    private feedbackRepo: Repository<EmployeeFeedback>,
  ) {}

  /**
   * 获取员工基本信息。
   *
   * 【功能说明】
   *  根据员工 ID 查询 employees 表，返回员工的姓名、部门、职位等完整信息。
   *  这是最基础的"单表主键查询"，适合入门理解 Repository 的 findOne 用法。
   *
   * 【Repository.findOne 详解】
   *  findOne 是 TypeORM 最常用的查询方法之一：
   *  - { where: { id: employeeId } }  → 等价于 SQL: SELECT * FROM employees WHERE id = ?
   *  - 返回值：找到返回实体对象，未找到返回 null（不会抛错）
   *  - 注意：findOne 只返回一条记录；如果需要多条，用 find()
   *
   * 【为什么返回 JSON 字符串而非对象？】
   *  因为这个方法是给 AI Agent 调用的。LLM 接收的是纯文本，
   *  返回 JSON 字符串可以让 Agent 直接用 JSON.parse() 解析结果，
   *  无需额外的序列化/反序列化逻辑。
   *
   * 【统一错误处理模式】
   *  整个方法被 try-catch 包裹，区分了两种"失败"：
   *  1. 业务失败（员工不存在）→ success: false，正常业务逻辑
   *  2. 系统异常（数据库断连等）→ catch 块捕获，记录 error 日志
   *
   * @param employeeId — 员工的主键 ID，对应 employees 表的 id 列
   * @returns JSON 字符串，格式：{ success: boolean, data: Employee | null, message: string }
   *
   * @example
   *  // 调用示例
   *  const result = await service.getEmployeeInfo(1);
   *  // result = '{"success":true,"data":{"id":1,"name":"张三",...},"message":"获取成功"}'
   *  // Agent 可以：JSON.parse(result).data.name → "张三"
   */
  async getEmployeeInfo(employeeId: number): Promise<string> {
    try {
      // findOne: 按主键精确查询单条记录，是 TypeORM 最简洁的查询方式
      const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });

      // 防御性编程：先判断 null 再使用，避免空指针
      if (!employee) {
        return JSON.stringify({ success: false, data: null, message: `员工ID ${employeeId} 不存在` });
      }

      // log() 是 Logger 的 info 级别，适合记录正常的业务操作
      this.logger.log(`获取员工信息 - ID: ${employeeId}`);
      return JSON.stringify({ success: true, data: employee, message: '获取成功' });
    } catch (e) {
      // error() 级别会记录堆栈信息，适合捕获系统异常
      this.logger.error(`获取员工信息失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `获取失败: ${e.message}` });
    }
  }

  /**
   * 获取员工参与的项目列表。
   *
   * 【功能说明】
   *  查询指定员工参与的所有项目，通过 LEFT JOIN 关联 projects 表，
   *  返回项目名称、描述、员工角色、使用技术等丰富信息。
   *
   * 【Query Builder 查询构建器详解】
   *  Query Builder 是 TypeORM 提供的链式查询 API，比 findOne/find 更灵活：
   *
   *  createQueryBuilder('ep')        → 创建查询构建器，'ep' 是 employee_projects 表的别名
   *  .leftJoinAndSelect('ep.project', 'p')  → LEFT JOIN projects 表，别名 'p'
   *      LEFT JOIN vs INNER JOIN:
   *      - LEFT JOIN: 即使关联表没匹配到，主表记录仍然返回（关联字段为 null）
   *      - INNER JOIN: 只返回两边都能匹配到的记录
   *      这里用 LEFT JOIN 是因为即使项目被删除，员工参与记录仍应被查到
   *
   *  .select([...])  → 只查询指定字段（投影），减少网络传输量
   *      不写 select 则默认 SELECT * 返回所有列
   *
   *  .where('ep.employeeId = :empId', { empId: employeeId })  → 参数化查询
   *      ':empId' 是命名占位符，值通过第二个参数对象注入
   *      这样做可以防止 SQL 注入攻击！永远不要拼接用户输入到 SQL 中
   *
   *  .orderBy('p.endDate', 'DESC')  → 按项目结束日期降序排列（最近的项目排最前）
   *  .limit(20)                     → 最多返回 20 条（分页的一种简单方式）
   *  .getMany()                     → 执行查询并返回实体对象数组
   *
   * 【业务语义】
   *  "最近参与的 20 个项目" 通常比"所有项目"更有价值，
   *  因为 AI Agent 关心的是员工近期的经验和技术栈。
   *
   * @param employeeId — 员工 ID
   * @returns JSON 字符串，包含项目列表和总数
   */
  async getEmployeeProjects(employeeId: number): Promise<string> {
    try {
      const results = await this.empProjectRepo
        .createQueryBuilder('ep')
        // LEFT JOIN: 通过 TypeORM 的关系映射自动推导 ON 条件
        // 'ep.project' 引用的是 EmployeeProject 实体中 @ManyToOne(() => Project) 定义的关系
        .leftJoinAndSelect('ep.project', 'p')
        // select: 只取需要的字段，避免传输冗余列（如创建时间、更新时间等）
        // 这是一个性能优化技巧——尤其在表字段较多时效果明显
        .select([
          // 参与记录 ID
          'ep.id',
          // 项目名称（来自 projects 表）
          'p.name',
          // 项目描述
          'p.description',
          // 员工在项目中的角色（如"前端开发"、"技术负责人"）
          'ep.role',
          // 使用的技术栈（如"React, TypeScript, Node.js"）
          'ep.technologies',
          // 项目开始日期
          'p.startDate',
          // 项目结束日期（用于降序排列）
          'p.endDate',
          // 贡献程度（如"核心"、"参与"）
          'ep.contributionLevel',
          // 项目复杂度
          'p.complexity',
        ])
        // 参数化 where 条件，':empId' 是占位符，{ empId: employeeId } 提供实际值
        .where('ep.employeeId = :empId', { empId: employeeId })
        // DESC = 降序（新项目在前），ASC = 升序（旧项目在前）
        .orderBy('p.endDate', 'DESC')
        // 限制返回条数，防止一次性加载过多数据
        .limit(20)
        // getMany(): 返回实体数组；对应还有 getOne() 只返回一条
        .getMany();

      this.logger.log(`获取员工项目 - ID: ${employeeId}, 项目数: ${results.length}`);
      return JSON.stringify({
        success: true,
        data: results,
        message: `找到 ${results.length} 个项目`,
      });
    } catch (e) {
      this.logger.error(`获取员工项目失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `获取失败: ${e.message}` });
    }
  }

  /**
   * 获取员工的反馈评价（含统计摘要）。
   *
   * 【功能说明】
   *  查询指定员工的所有反馈记录，同时计算平均分和反馈类别，
   *  返回「原始数据 + 聚合统计」的复合结果。
   *
   * 【参数默认值 — TypeScript 函数参数技巧】
   *  limit: number = 10 表示：
   *  - 如果调用时传了 limit，使用传入值
   *  - 如果没传（undefined），使用默认值 10
   *  这让同一个方法可以灵活地用于"获取最近 10 条"和"获取最近 N 条"两种场景。
   *
   * 【JavaScript 数组高级用法解析】
   *
   *  avgScore 计算（求平均值的函数式写法）：
   *  feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length
   *    - reduce 是数组的归约方法，将数组"压缩"为单个值
   *    - (sum, f) => sum + f.score  → 回调函数：累加器 + 当前元素的分数
   *    - 0  → 初始值（sum 从 0 开始累加）
   *    - 最终 sum 是所有分数之总和，除以数量即为平均值
   *    - 三元表达式 feedbacks.length > 0 ? ... : 0  防止除以零得到 NaN
   *
   *  categories 计算（数组去重）：
   *  [...new Set(feedbacks.map((f) => f.category))]
   *    - .map((f) => f.category)  → 从每条反馈中提取 category 字段，得到字符串数组
   *    - new Set(...)             → Set 是 ES6 集合，自动去重（不允许重复元素）
   *    - [...Set]                 → 展开运算符将 Set 转回数组
   *    - 等价于：SELECT DISTINCT category FROM employee_feedback WHERE employee_id = ?
   *
   * 【为什么不在 SQL 层面做统计？】
   *  这里选择在 JS 层面计算 avgScore 和 categories，而不是用 SQL 的 AVG()/GROUP BY：
   *  1. 数据量小（最多 limit 条），内存计算开销可忽略
   *  2. 避免额外的 SQL 查询，减少数据库往返
   *  3. 反馈列表本身也需要返回给 Agent，一次查询同时得到数据和统计
   *  如果数据量大（百万级），应该改用 SQL 聚合 + 分页查询。
   *
   * 【Math.round 的精度技巧】
   *  Math.round(avgScore * 10) / 10  → 保留一位小数
   *  例：avgScore = 4.567 → 4.567 * 10 = 45.67 → round(45.67) = 46 → 46 / 10 = 4.6
   *  这比 toFixed(1) 更好，因为返回的是 number 而非 string。
   *
   * @param employeeId — 员工 ID
   * @param limit — 返回的反馈条数上限，默认 10 条
   * @returns JSON 字符串，包含反馈列表和统计信息
   */
  async getEmployeeFeedback(employeeId: number, limit: number = 10): Promise<string> {
    try {
      const feedbacks = await this.feedbackRepo
        .createQueryBuilder('fb')
        .where('fb.employeeId = :empId', { empId: employeeId })
        // 按创建时间降序 → 最新的反馈排在前面
        .orderBy('fb.createdAt', 'DESC')
        // 参数化的 limit，避免硬编码魔法数字
        .limit(limit)
        .getMany();

      // reduce 求和后除以数量 = 平均值（函数式编程经典用法）
      const avgScore = feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length
        : 0;

      // Set 去重：map 提取字段 → new Set 消除重复 → 展开回数组
      const categories = [...new Set(feedbacks.map((f) => f.category))];

      this.logger.log(`获取员工反馈 - ID: ${employeeId}, 反馈数: ${feedbacks.length}`);

      // 返回复合结构：原始数据 + 聚合统计，Agent 可按需使用
      return JSON.stringify({
        success: true,
        data: {
          // 原始反馈列表，Agent 可逐条分析
          feedbacks,
          // 聚合统计，Agent 可快速了解整体评价
          statistics: {
            total: feedbacks.length,
            // 保留一位小数
            averageScore: Math.round(avgScore * 10) / 10,
            // 反馈类别去重列表
            categories,
          },
        },
        message: `找到 ${feedbacks.length} 条反馈`,
      });
    } catch (e) {
      this.logger.error(`获取员工反馈失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `获取失败: ${e.message}` });
    }
  }
}
