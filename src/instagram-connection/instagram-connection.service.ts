// src/instagram-connection/instagram-connection.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstagramConnection } from './instagram-connection.entity';

@Injectable()
export class InstagramConnectionService {
  constructor(
    @InjectRepository(InstagramConnection)
    private connectionRepo: Repository<InstagramConnection>,
  ) {}

  async saveConnection(
    userId: string,
    data: {
      accessToken: string;
      igUserId: string;
      pageId: string;
      expiresAt: Date;
    },
  ) {
    let connection = await this.connectionRepo.findOne({ where: { userId } });
    if (connection) {
      connection.accessToken = data.accessToken;
      connection.igUserId = data.igUserId;
      connection.pageId = data.pageId;
      connection.expiresAt = data.expiresAt;
    } else {
      connection = this.connectionRepo.create({
        userId,
        ...data,
      });
    }
    return this.connectionRepo.save(connection);
  }

  async getConnection(userId: string): Promise<InstagramConnection> {
    const conn = await this.connectionRepo.findOne({ where: { userId } });
    if (!conn) {
      throw new NotFoundException(
        `Usuario ${userId} no tiene Instagram conectado`,
      );
    }
    return conn;
  }

  async updateToken(userId: string, newToken: string, expiresAt: Date) {
    const conn = await this.getConnection(userId);
    conn.accessToken = newToken;
    conn.expiresAt = expiresAt;
    return this.connectionRepo.save(conn);
  }

  async deleteConnection(userId: string) {
    await this.connectionRepo.delete({ userId });
  }
}
