// users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { InteractionLog } from './interaction-log.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(InteractionLog)
    private logRepo: Repository<InteractionLog>,
  ) {}

  // 👤 Crear usuario
  async createUser(data: Partial<User>) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  // 🔍 Buscar por Firebase UID
  async findByFirebase(firebase_uid: string) {
    return this.userRepo.findOne({ where: { firebase_uid } });
  }

  // 📊 Crear log
  async createLog(userId: number, action: string, metadata: any) {
    const user = await this.userRepo.findOneBy({ id: userId });

    const log = this.logRepo.create({
      action,
      metadata,
      user,
    });

    return this.logRepo.save(log);
  }

  // 📈 Obtener logs con usuario
  async getLogs(userId: number) {
    return this.logRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }
}