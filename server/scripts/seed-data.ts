// scripts/seed-data.ts
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 环境变量（手动加载，不依赖 NestJS）
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USERNAME = process.env.DB_USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_DATABASE = process.env.DB_DATABASE || 'employee_agent';

const DEPARTMENTS = ['技术部', '产品部', '运营部', '市场部', '财务部', '人力资源部', '销售部'];
const POSITIONS = ['工程师', '高级工程师', '技术主管', '产品经理', '运营经理', '市场总监', '销售代表', '财务管理员', 'HR经理', 'CTO'];
const SALARY_LEVELS = ['初级', '中级', '高级', '专家', '管理层'];
const TECHNOLOGIES = ['Python', 'Java', 'JavaScript', 'Go', 'Rust', 'C++', 'React', 'Vue.js', 'Angular', 'Django', 'Spring', 'FastAPI', 'Node.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure'];
const PROJECT_NAMES = ['员工管理系统', '客户关系管理系统', '供应链管理', '数据分析平台', '实时通信系统', '电商平台', '内容管理系统', '财务管理系统', '人力资源管理系统', '移动应用开发'];
const FEEDBACK_CATEGORIES = ['沟通', '协作', '技术能力', '领导力', '反馈能力', '创新能力', '执行力', '学习能力', '影响力'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSample<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seed() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      数据库模拟数据生成工具           ║');
  console.log('╚════════════════════════════════════════╝\n');

  const dataSource = new DataSource({
    type: 'mysql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
  });

  await dataSource.initialize();

  try {
    // 生成员工
    console.log('正在生成 1500 名员工...');
    const now = new Date();
    for (let i = 0; i < 1500; i++) {
      const hireDate = new Date(now.getTime() - randomInt(365, 3650) * 24 * 60 * 60 * 1000);
      await dataSource.query(
        `INSERT INTO employees (name, age, email, phone, department, position, hire_date, salary_level, status, manager_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `员工_${i + 1}`, randomInt(22, 60), `employee_${i + 1}@company.com`,
          `1${randomInt(3, 9)}${randomInt(100000000, 999999999)}`,
          randomChoice(DEPARTMENTS), randomChoice(POSITIONS), hireDate,
          randomChoice(SALARY_LEVELS), Math.random() > 0.1 ? '在职' : '离职', null,
        ],
      );
      if ((i + 1) % 100 === 0) console.log(`  已生成 ${i + 1}/1500 名员工`);
    }

    // 设置管理关系
    console.log('正在设置员工管理关系...');
    const employees: any[] = await dataSource.query('SELECT id FROM employees');
    for (const emp of employees) {
      if (Math.random() > 0.5) {
        const possibleManagers = employees.filter((e: any) => e.id !== emp.id);
        const manager = randomChoice(possibleManagers);
        await dataSource.query('UPDATE employees SET manager_id = ? WHERE id = ?', [manager.id, emp.id]);
      }
    }

    // 生成项目
    console.log('正在生成 300 个项目...');
    for (let i = 0; i < 300; i++) {
      const startDate = new Date(now.getTime() - randomInt(365, 1825) * 24 * 60 * 60 * 1000);
      const duration = randomInt(30, 365);
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
      await dataSource.query(
        `INSERT INTO projects (name, description, start_date, end_date, complexity)
         VALUES (?, ?, ?, ?, ?)`,
        [`${randomChoice(PROJECT_NAMES)}_v${i + 1}`, `这是项目 ${i + 1} 的描述`, startDate, endDate, randomChoice(['低', '中', '高', '非常高'])],
      );
      if ((i + 1) % 50 === 0) console.log(`  已生成 ${i + 1}/300 个项目`);
    }

    // 生成员工-项目关联
    console.log('正在生成员工-项目关联数据...');
    const projects: any[] = await dataSource.query('SELECT id, start_date, end_date FROM projects');
    let assocCount = 0;
    for (const emp of employees) {
      const projectCount = randomInt(2, 5);
      const selectedProjects = randomSample(projects, projectCount);
      for (const proj of selectedProjects) {
        await dataSource.query(
          `INSERT INTO employee_projects (employee_id, project_id, role, technologies, contribution_level, start_date, end_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            emp.id, proj.id, randomChoice(['开发', '测试', '设计', '产品', '架构', '运维']),
            randomSample(TECHNOLOGIES, randomInt(2, 5)).join(', '),
            (Math.random() * 0.7 + 0.3).toFixed(2), proj.start_date, proj.end_date,
          ],
        );
        assocCount++;
        if (assocCount % 500 === 0) console.log(`  已生成 ${assocCount} 条关联记录`);
      }
    }

    // 生成反馈
    console.log('正在生成员工反馈数据...');
    let fbCount = 0;
    for (const emp of employees) {
      const fbNum = randomInt(2, 5);
      for (let j = 0; j < fbNum; j++) {
        await dataSource.query(
          `INSERT INTO employee_feedback (employee_id, category, score, feedback_text, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [
            emp.id, randomChoice(FEEDBACK_CATEGORIES), randomInt(3, 5),
            `这是针对${emp.name}的反馈记录`, `评价者_${randomInt(1, 100)}`,
          ],
        );
        fbCount++;
        if (fbCount % 1000 === 0) console.log(`  已生成 ${fbCount} 条反馈记录`);
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║      数据生成完成！                   ║');
    console.log('╚════════════════════════════════════════╝\n');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('数据生成失败:', err);
  process.exit(1);
});
