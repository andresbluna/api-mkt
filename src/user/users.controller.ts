// users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 👤 Crear usuario
  @Post()
  async createUser(@Body() body: any) {
    const { firebase_uid, email, name } = body;

    const existingUser = await this.usersService.findByFirebase(firebase_uid);

    if (existingUser) {
      return existingUser; // evita duplicados
    }

    return this.usersService.createUser({
      firebase_uid,
      email,
      name,
    });
  }

  // 🔍 Obtener usuario por Firebase UID
  @Get('firebase/:firebase_uid')
  async getByFirebase(@Param('firebase_uid') firebase_uid: string) {
    const user = await this.usersService.findByFirebase(firebase_uid);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  // 📊 Crear log para un usuario
  @Post(':id/logs')
  async createLog(@Param('id') id: string, @Body() body: any) {
    const { action, metadata } = body;

    return this.usersService.createLog(Number(id), action, metadata);
  }

  // 📈 Obtener logs de un usuario
  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    return this.usersService.getLogs(Number(id));
  }
}