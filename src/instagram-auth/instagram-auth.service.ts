// src/instagram-auth/instagram-auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstagramApiService } from '../instagram-api/instagram-api.service';
import { InstagramConnectionService } from '../instagram-connection/instagram-connection.service';

@Injectable()
export class InstagramAuthService {
  constructor(
    private configService: ConfigService,
    private instagramApi: InstagramApiService,
    private connectionService: InstagramConnectionService,
  ) {}

  async handleOAuthCallback(userId: string, code: string) {
    const redirectUri = this.configService.get('META_REDIRECT_URI');

    const shortTokenData = await this.instagramApi.exchangeCodeForToken(
      code,
      redirectUri,
    );
    const shortToken = shortTokenData.access_token;

    const longTokenData =
      await this.instagramApi.exchangeForLongLivedToken(shortToken);
    const longToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const pages = await this.instagramApi.getPages(longToken);
    if (!pages || pages.length === 0) {
      throw new BadRequestException(
        'No se encontraron páginas de Facebook para este usuario',
      );
    }

    const firstPage = pages[0];
    const pageId = firstPage.id;
    const igUserId = await this.instagramApi.getIgBusinessId(pageId, longToken);

    await this.connectionService.saveConnection(userId, {
      accessToken: longToken,
      igUserId,
      pageId,
      expiresAt,
    });

    return {
      success: true,
      message: 'Cuenta de Instagram conectada correctamente',
      pageId,
      igUserId,
    };
  }
}
