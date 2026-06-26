// src/instagram-auth/instagram-auth.controller.ts
import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstagramAuthService } from './instagram-auth.service';

@Controller('instagram/auth')
export class InstagramAuthController {
  constructor(
    private configService: ConfigService,
    private instagramAuthService: InstagramAuthService,
  ) {}

  /**
   * Devuelve la URL de OAuth de Meta como JSON.
   * El frontend redirige al usuario a esa URL.
   * GET /instagram/auth/url?userId=123
   */
  @Get('url')
  getAuthUrl(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }
    const url = this.instagramAuthService.getAuthUrl(userId);
    return { url };
  }

  /**
   * Consulta si un usuario tiene Instagram conectado.
   * GET /instagram/auth/status/:userId
   */
  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }
    return this.instagramAuthService.getStatus(parseInt(userId, 10));
  }

  /**
   * Desconecta la cuenta de Instagram de un usuario.
   * DELETE /instagram/auth/disconnect/:userId
   */
  @Delete('disconnect/:userId')
  async disconnect(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }
    return this.instagramAuthService.disconnect(parseInt(userId, 10));
  }

  /**
   * Redirige directamente al usuario a la URL de OAuth (navegador).
   * GET /instagram/auth/login?userId=123
   */
  @Get('login')
  login(@Query('userId') userId: string, @Res() res) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }
    const url = this.instagramAuthService.getAuthUrl(userId);
    return res.redirect(url);
  }

  /**
   * Callback automático de Meta — no llamar manualmente.
   * GET /instagram/auth/callback?code=...&state={userId}
   */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code) {
      throw new BadRequestException('No se recibió código de autorización');
    }
    if (!state || state.trim() === '') {
      throw new BadRequestException('Falta state');
    }
    return this.instagramAuthService.handleOAuthCallback(state, code);
  }
}
