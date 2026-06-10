// users.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 👤 Crear usuario
  @Post()
  createUser(@Body() body: any) {
    const { firebase_uid, email, name } = body;
    return this.usersService.createUser(firebase_uid, email, name);
  }

  // 🔍 Obtener usuario por Firebase UID
  @Get(':firebase_uid')
  getUser(@Param('firebase_uid') firebase_uid: string) {
    return this.usersService.getUserByFirebase(firebase_uid);
  }

  // 📊 Crear log
  @Post(':id/logs')
  createLog(@Param('id') id: string, @Body() body: any) {
    const { action, metadata } = body;
    return this.usersService.createLog(Number(id), action, metadata);
  }

  // 📈 Obtener logs de usuario
  @Get(':id/logs')
  getLogs(@Param('id') id: string) {
    return this.usersService.getLogsByUser(Number(id));
  }
}