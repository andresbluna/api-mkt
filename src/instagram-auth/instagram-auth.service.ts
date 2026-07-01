// src/instagram-auth/instagram-auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstagramApiService } from '../instagram-api/instagram-api.service';
import { InstagramConnectionService } from '../instagram-connection/instagram-connection.service';
import { InstagramConnection } from '../instagram-connection/instagram-connection.entity';

@Injectable()
export class InstagramAuthService {
  constructor(
    private configService: ConfigService,
    private instagramApi: InstagramApiService,
    private connectionService: InstagramConnectionService,
  ) {}

  /**
   * Genera la URL de autorización de Meta para redirigir al usuario
   */
  getAuthUrl(userId: string): string {
    const appId = this.configService.get('META_APP_ID');
    const redirectUri = this.configService.get('META_REDIRECT_URI');
    const graphVersion =
      this.configService.get('META_GRAPH_VERSION') || 'v19.0';
    const scope =
      'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';

    return (
      `https://www.instagram.com/oauth/authorize` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${userId}` +
      `&response_type=code`
    );
  }

  /**
   * Devuelve el estado de conexión de Instagram de un usuario
   */
  async getStatus(userId: number): Promise<{
    connected: boolean;
    igUserId?: string;
    pageId?: string;
    expiresAt?: Date;
  }> {
    try {
      const conn: InstagramConnection =
        await this.connectionService.getConnection(userId);
      return {
        connected: true,
        igUserId: conn.igUserId,
        pageId: conn.pageId,
        expiresAt: conn.expiresAt,
      };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Elimina la conexión de Instagram de un usuario
   */
  async disconnect(userId: number): Promise<{ success: boolean }> {
    await this.connectionService.deleteConnection(userId);
    return { success: true };
  }

  /**
   * Maneja el callback de OAuth después de que el usuario autoriza en Meta
   * @param userId - ID del usuario en tu sistema (string/UUID)
   * @param code - Código de autorización de Meta
   */
  async handleOAuthCallback(userId: string, code: string) {
    const redirectUri = this.configService.get('META_REDIRECT_URI');

    // 1. Intercambiar code por token corto
    const shortTokenData = await this.instagramApi.exchangeCodeForToken(
      code,
      redirectUri,
    );
    const shortToken = shortTokenData.access_token;

    // 2. Obtener token long-lived
    const longTokenData =
      await this.instagramApi.exchangeForLongLivedToken(shortToken);
    const longToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in; // segundos (~60 días)
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 3. Obtener páginas del usuario
    const pages = await this.instagramApi.getPages(longToken);
    if (!pages || pages.length === 0) {
      throw new BadRequestException(
        'No se encontraron páginas de Facebook para este usuario',
      );
    }

    // Tomar la primera página (puedes modificar para seleccionar otra)
    const firstPage = pages[0];
    const pageId = firstPage.id;

    // 4. Obtener instagram_business_account de la página
    const igUserId = await this.instagramApi.getIgBusinessId(pageId, longToken);

    // 5. Guardar conexión en DB
    await this.connectionService.saveConnection(parseInt(userId, 10), {
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
