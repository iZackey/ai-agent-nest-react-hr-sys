import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployeeProject } from './employee-project.entity';

@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: Date;
  @Column({ name: 'end_date', type: 'date' }) endDate: Date;
  @Column({ type: 'varchar', length: 20 }) complexity: string;
  @OneToMany(() => EmployeeProject, (ep) => ep.project) employees: EmployeeProject[];
}
