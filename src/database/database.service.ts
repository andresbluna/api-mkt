// users.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class UsersService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  // 🔹 Crear usuario
  async createUser(firebase_uid: string, email: string, name: string) {
    const result = await this.pool.query(
      `INSERT INTO users (firebase_uid, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid) DO NOTHING
       RETURNING *`,
      [firebase_uid, email, name],
    );

    return result.rows[0];
  }

  // 🔹 Obtener usuario por Firebase UID
  async getUserByFirebase(firebase_uid: string) {
    const result = await this.pool.query(
      `SELECT * FROM users WHERE firebase_uid = $1`,
      [firebase_uid],
    );

    return result.rows[0];
  }

  // 🔹 Crear log
  async createLog(user_id: number, action: string, metadata: any) {
    const result = await this.pool.query(
      `INSERT INTO interaction_logs (user_id, action, metadata)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, action, metadata],
    );

    return result.rows[0];
  }

  // 🔹 Obtener logs por usuario
  async getLogsByUser(user_id: number) {
    const result = await this.pool.query(
      `SELECT * FROM interaction_logs
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id],
    );

    return result.rows;
  }
}