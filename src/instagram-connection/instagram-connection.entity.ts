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
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  accessToken: string;

  @Column()
  igUserId: string;

  /**
   * ID de la Facebook Page vinculada a la cuenta de Instagram Business.
   * Requerido para "Instagram API with Facebook Login".
   * Nullable para compatibilidad con registros previos.
   */
  @Column({ nullable: true, default: null })
  pageId: string | null;

  /**
   * Fecha de expiración del access token.
   * NULL cuando se almacena un page access token permanente
   * (derivado de un long-lived user token vía /me/accounts).
   */
  @Column({ type: 'timestamp', nullable: true, default: null })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
