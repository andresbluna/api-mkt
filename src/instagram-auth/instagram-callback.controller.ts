// src/instagram-auth/instagram-callback.controller.ts
import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { InstagramAuthService } from './instagram-auth.service';

/**
 * Maneja el callback OAuth de Meta.
 * La URL registrada en Meta Developer es:
 * https://api-mkt.onrender.com/auth/instagram/callback
 */
@Controller('auth/instagram')
export class InstagramCallbackController {
  constructor(private instagramAuthService: InstagramAuthService) {}

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('No se recibió código de autorización');
    }
    if (!state || state.trim() === '') {
      throw new BadRequestException('Falta state');
    }
    await this.instagramAuthService.handleOAuthCallback(state, code);
    return res.redirect('samapp://instagram-success?connected=true');
  }
}
