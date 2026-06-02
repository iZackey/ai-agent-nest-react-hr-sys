import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';
import { Project } from './project.entity';

@Entity('employee_projects')
export class EmployeeProject extends BaseEntity {
  @Column({ name: 'employee_id', type: 'int' }) employeeId: number;
  @Column({ name: 'project_id', type: 'int' }) projectId: number;
  @Column({ type: 'varchar', length: 100 }) role: string;
  @Column({ type: 'text' }) technologies: string;
  @Column({ name: 'contribution_level', type: 'varchar', length: 20 }) contributionLevel: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: Date;
  @Column({ name: 'end_date', type: 'date' }) endDate: Date;
  @ManyToOne(() => Employee, (e) => e.projects, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'employee_id' }) employee: Employee;
  @ManyToOne(() => Project, (p) => p.employees, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'project_id' }) project: Project;
}
