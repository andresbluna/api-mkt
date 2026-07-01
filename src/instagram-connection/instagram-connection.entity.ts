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
  userId: number; // 👈 Cambiado de string a number

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  accessToken: string;

  @Column()
  igUserId: string;

  /**
   * CORRECCIÓN: nullable porque con Instagram Login no existe el concepto de Facebook Page.
   * Se mantiene el campo para compatibilidad hacia atrás con registros existentes.
   */
  @Column({ nullable: true, default: null })
  pageId: string | null;

  /** Username de Instagram, almacenado en el callback para referencia rápida */
  @Column({ nullable: true, default: null })
  username: string | null;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
