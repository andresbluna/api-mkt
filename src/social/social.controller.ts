// social.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { SocialService } from './social.service';


@Controller('social')
export class SocialController {
  constructor(
    private readonly socialService: SocialService,
  ) {}

  // Conectar red social
  @Post()
  async connectSocialAccount(
    @Body() body: any,
  ) {
    return this.socialService.connectSocialAccount(body);
  }

  // Obtener cuentas sociales por usuario
  @Get('user/:userId')
  async getUserSocialAccounts(
    @Param('userId') userId: number,
  ) {
    return this.socialService.getUserSocialAccounts(userId);
  }

  // Obtener una cuenta social
  @Get(':id')
  async getSocialAccount(
    @Param('id') id: number,
  ) {
    return this.socialService.getSocialAccount(id);
  }

  // Actualizar token o estado
  @Patch(':id')
  async updateSocialAccount(
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.socialService.updateSocialAccount(id, body);
  }

  // Desactivar cuenta social
  @Delete(':id')
  async deleteSocialAccount(
    @Param('id') id: number,
  ) {
    return this.socialService.deleteSocialAccount(id);
  }
}