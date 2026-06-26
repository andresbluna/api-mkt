// src/instagram-auth/instagram-auth.controller.ts
import {
  Controller,
  Get,
  Query,
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

  @Get('login')
  login(@Query('userId') userId: string, @Res() res) {
    if (!userId) {
      throw new BadRequestException('userId es requerido (número)');
    }
    const appId = this.configService.get('META_APP_ID');
    const redirectUri = this.configService.get('META_REDIRECT_URI');
    const graphVersion =
      this.configService.get('META_GRAPH_VERSION') || 'v19.0';
    const scope =
      'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';

    // state contiene el userId (se enviará como string)
    const state = userId;

    const authUrl =
      `https://www.facebook.com/${graphVersion}/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}` +
      `&response_type=code`;

    return res.redirect(authUrl);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code) {
      throw new BadRequestException('No se recibió código de autorización');
    }
    if (!state) {
      throw new BadRequestException('Falta state');
    }
    // El userId es string (UUID), no número
    const userId = state;
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('userId inválido en state');
    }
    return this.instagramAuthService.handleOAuthCallback(userId, code);
  }
}
