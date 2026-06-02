import { Entity, Column, ManyToOne, PrimaryColumn, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { ConversationSession } from './session.entity';

@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryColumn({ type: 'varchar', length: 36 }) id: string;
  @Column({ name: 'session_id', type: 'varchar', length: 36 }) sessionId: string;
  @Column({ type: 'varchar', length: 20 }) role: string;
  @Column({ type: 'longtext' }) content: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
  @ManyToOne(() => ConversationSession, (session) => session.messages, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'session_id' }) session: ConversationSession;
}
