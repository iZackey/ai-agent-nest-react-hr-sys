import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../models/employee.entity';

@Injectable()
export class QueryToolsService {
  private readonly logger = new Logger(QueryToolsService.name);

  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  async queryByStructure(conditionsJson: string): Promise<string> {
    try {
      const conditions = JSON.parse(conditionsJson);
      const qb = this.employeeRepo
        .createQueryBuilder('e')
        .select([
          'e.id', 'e.name', 'e.age', 'e.department', 'e.position',
          'e.hireDate', 'e.salaryLevel', 'e.status', 'e.email', 'e.phone',
        ])
        .orderBy('e.hireDate', 'DESC')
        .limit(50);

      for (const [key, value] of Object.entries(conditions)) {
        if (key.endsWith('_min') && key.startsWith('age')) {
          qb.andWhere('e.age >= :age_min', { age_min: value });
        } else if (key.endsWith('_max') && key.startsWith('age')) {
          qb.andWhere('e.age <= :age_max', { age_max: value });
        } else if (['department', 'position', 'salaryLevel', 'status'].includes(key)) {
          qb.andWhere(`e.${key} = :${key}`, { [key]: value });
        }
      }

      const employees = await qb.getMany();
      this.logger.log(`结构化查询成功 - 条件: ${conditionsJson}, 结果: ${employees.length}条`);

      return JSON.stringify({
        success: true,
        data: employees,
        message: `找到 ${employees.length} 个匹配的员工`,
      });
    } catch (e) {
      this.logger.error(`结构化查询失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `查询失败: ${e.message}` });
    }
  }

  async searchByKeyword(keyword: string): Promise<string> {
    try {
      const employees = await this.employeeRepo
        .createQueryBuilder('e')
        .select([
          'e.id', 'e.name', 'e.age', 'e.department', 'e.position',
          'e.hireDate', 'e.salaryLevel', 'e.status', 'e.email', 'e.phone',
        ])
        .where('e.name LIKE :kw', { kw: `%${keyword}%` })
        .orWhere('e.department LIKE :kw', { kw: `%${keyword}%` })
        .orWhere('e.position LIKE :kw', { kw: `%${keyword}%` })
        .orderBy('e.hireDate', 'DESC')
        .limit(30)
        .getMany();

      this.logger.log(`关键词搜索 - 关键词: ${keyword}, 结果: ${employees.length}条`);
      return JSON.stringify({
        success: true,
        data: employees,
        message: `找到 ${employees.length} 个匹配的员工`,
      });
    } catch (e) {
      this.logger.error(`关键词搜索失败: ${e.message}`);
      return JSON.stringify({ success: false, data: null, message: `搜索失败: ${e.message}` });
    }
  }

  async findEmployeesByNames(names: string[]): Promise<{ id: number; name: string }[]> {
    if (!names || names.length === 0) return [];

    const employees = await this.employeeRepo
      .createQueryBuilder('e')
      .select(['e.id', 'e.name'])
      .where('e.name IN (:...names)', { names })
      .getMany();

    this.logger.log(`根据姓名查找员工 - 姓名: ${names.join(', ')}, 结果: ${employees.length}条`);
    return employees;
  }
}
