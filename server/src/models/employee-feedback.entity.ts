import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './employee.entity';

@Entity('employee_feedback')
export class EmployeeFeedback extends BaseEntity {
  @Column({ name: 'employee_id', type: 'int' }) employeeId: number;
  @Column({ type: 'varchar', length: 100 }) category: string;
  @Column({ type: 'float' }) score: number;
  @Column({ name: 'feedback_text', type: 'text' }) feedbackText: string;
  @Column({ name: 'created_by', type: 'varchar', length: 100 }) createdBy: string;
  @ManyToOne(() => Employee, (e) => e.feedbacks, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'employee_id' }) employee: Employee;
}
