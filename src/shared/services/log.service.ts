import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteractionLog } from '../../user/interaction-log.entity';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(InteractionLog)
    private readonly logRepository: Repository<InteractionLog>,
  ) {}


  async createLog(
    userId: number,
    action: string,
    metadata: Record<string, any> = {},
  ) {
    const log = this.logRepository.create({
      user: { id: userId },
      action,
      metadata,
    });

    return await this.logRepository.save(log);
  }

  //obtener logs de usuario

  async getUserLogs(userId: number, limit: number = 50) {
    return await this.logRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  //logs por accion

  async getLogsByAction(userId: number, action: string) {
    return await this.logRepository.find({
      where: {
        user: { id: userId },
        action,
      },
      order: { created_at: 'DESC' },
    });
  }

  //todos los logs (para admin)

  async getAllLogs(limit: number = 100) {
    return await this.logRepository.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}



