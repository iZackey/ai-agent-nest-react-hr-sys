import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployeeProject } from './employee-project.entity';
import { EmployeeFeedback } from './employee-feedback.entity';

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ type: 'varchar', length: 100 }) name: string;
  @Column({ type: 'int' }) age: number;
  @Column({ type: 'varchar', length: 100, unique: true }) email: string;
  @Column({ type: 'varchar', length: 20 }) phone: string;
  @Column({ type: 'varchar', length: 100 }) department: string;
  @Column({ type: 'varchar', length: 100 }) position: string;
  @Column({ name: 'hire_date', type: 'date' }) hireDate: Date;
  @Column({ name: 'salary_level', type: 'varchar', length: 50 }) salaryLevel: string;
  @Column({ type: 'varchar', length: 20, default: '在职' }) status: string;
  @Column({ name: 'manager_id', type: 'int', nullable: true }) managerId: number | null;
  @ManyToOne(() => Employee) @JoinColumn({ name: 'manager_id' }) manager: Employee;
  @OneToMany(() => EmployeeProject, (ep) => ep.employee) projects: EmployeeProject[];
  @OneToMany(() => EmployeeFeedback, (fb) => fb.employee) feedbacks: EmployeeFeedback[];
}
