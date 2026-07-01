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

  // 👇 userId: number
  async saveConnection(
    userId: number,
    data: {
      accessToken: string;
      igUserId: string;
      pageId?: string | null;
      username?: string | null;
      expiresAt: Date;
    },
  ): Promise<InstagramConnection> {
    let connection = await this.connectionRepo.findOne({ where: { userId } });
    if (connection) {
      connection.accessToken = data.accessToken;
      connection.igUserId = data.igUserId;
      connection.pageId = data.pageId ?? null;
      connection.username = data.username ?? null;
      connection.expiresAt = data.expiresAt;
    } else {
      connection = this.connectionRepo.create({
        userId,
        accessToken: data.accessToken,
        igUserId: data.igUserId,
        pageId: data.pageId ?? null,
        username: data.username ?? null,
        expiresAt: data.expiresAt,
      });
    }
    return this.connectionRepo.save(connection);
  }

  async getConnection(userId: number): Promise<InstagramConnection> {
    const conn = await this.connectionRepo.findOne({ where: { userId } });
    if (!conn) {
      throw new NotFoundException(
        `Usuario ${userId} no tiene Instagram conectado`,
      );
    }
    return conn;
  }

  async updateToken(userId: number, newToken: string, expiresAt: Date) {
    const conn = await this.getConnection(userId);
    conn.accessToken = newToken;
    conn.expiresAt = expiresAt;
    return this.connectionRepo.save(conn);
  }

  async deleteConnection(userId: number) {
    await this.connectionRepo.delete({ userId });
  }
}
