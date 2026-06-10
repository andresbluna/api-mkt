// interaction-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('interaction_logs')
export class InteractionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  // 🔗 Relación con usuario
  @ManyToOne(() => User, (user) => user.logs, {
    onDelete: 'CASCADE',
  })
  user: User;
}