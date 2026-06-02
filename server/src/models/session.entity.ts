import { Entity, Column, OneToMany, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ConversationMessage } from './conversation-message.entity';

@Entity('conversation_sessions')
export class ConversationSession {
  @PrimaryColumn({ type: 'varchar', length: 36 }) id: string;
  @Column({ name: 'user_id', type: 'varchar', length: 100 }) userId: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @Column({ name: 'last_activity', type: 'timestamp' }) lastActivity: Date;
  @Column({ name: 'closed_at', type: 'timestamp', nullable: true }) closedAt: Date | null;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;
  @Column({ name: 'session_metadata', type: 'json', nullable: true }) sessionMetadata: any;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @OneToMany(() => ConversationMessage, (msg) => msg.session, { cascade: true }) messages: ConversationMessage[];
}
