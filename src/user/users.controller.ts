import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crear nuevo usuario
   */
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return await this.usersService.createUser(dto);
  }

  /**
   * Obtener usuario por Firebase UID
   */
  @Get('firebase/:firebase_uid')
  async getByFirebase(@Param('firebase_uid') firebase_uid: string) {
    return await this.usersService.getUserByFirebaseUid(firebase_uid);
  }

  /**
   * Obtener usuario por ID
   */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return await this.usersService.getUserById(Number(id));
  }

  /**
   * Actualizar usuario
   */
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return await this.usersService.updateUser(Number(id), dto);
  }

  /**
   * Obtener logs del usuario
   */
  @Get(':id/logs')
  async getUserLogs(@Param('id') id: string) {
    return await this.usersService.getUserLogs(Number(id));
  }

  /**
   * Obtener estadísticas del usuario
   */
  @Get(':id/stats')
  async getUserStats(@Param('id') id: string) {
    return await this.usersService.getUserStats(Number(id));
  }
}

