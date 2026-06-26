// src/instagram-connection/instagram-connection.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('instagram_connections')
export class InstagramConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // almacena el uuid del usuario

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId', referencedColumnName: 'uuid' }) // usa uuid como referencia
  user: User;

  @Column()
  accessToken: string;

  @Column()
  igUserId: string;

  @Column()
  pageId: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
