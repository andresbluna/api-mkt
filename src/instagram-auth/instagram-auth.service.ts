// src/instagram-auth/instagram-auth.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
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
   * Genera la URL de autorización de Instagram Login para redirigir al usuario.
   *
   * CORRECCIÓN: Se elimina la variable graphVersion (no se usa en la auth URL).
   * Se agrega encodeURIComponent al state para soportar cualquier formato de userId.
   *
   * Scopes necesarios:
   *   - instagram_business_basic        → leer perfil y media
   *   - instagram_business_content_publish → publicar contenido
   */
  getAuthUrl(userId: string): string {
    const appId = this.configService.get<string>('META_APP_ID');
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');

    if (!appId) throw new InternalServerErrorException('META_APP_ID no configurado');
    if (!redirectUri) throw new InternalServerErrorException('META_REDIRECT_URI no configurado');

    const scope = [
      'instagram_business_basic',
      'instagram_business_content_publish',
    ].join(',');

    return (
      `https://www.instagram.com/oauth/authorize` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(userId)}` +
      `&response_type=code`
    );
  }

  /**
   * Devuelve el estado de conexión de Instagram de un usuario.
   */
  async getStatus(userId: number): Promise<{
    connected: boolean;
    igUserId?: string;
    username?: string;
    expiresAt?: Date;
  }> {
    try {
      const conn: InstagramConnection =
        await this.connectionService.getConnection(userId);
      return {
        connected: true,
        igUserId: conn.igUserId,
        username: conn.username ?? undefined,
        expiresAt: conn.expiresAt,
      };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Elimina la conexión de Instagram de un usuario.
   */
  async disconnect(userId: number): Promise<{ success: boolean }> {
    await this.connectionService.deleteConnection(userId);
    return { success: true };
  }

  /**
   * Maneja el callback de OAuth de Instagram Login.
   *
   * CORRECCIÓN COMPLETA: Se elimina el flujo de páginas de Facebook.
   * Con Instagram Login el flujo correcto es:
   *   1. POST code a api.instagram.com → short token + user_id
   *   2. GET graph.instagram.com/access_token → long-lived token
   *   3. GET /me → username (opcional pero recomendado)
   *   4. Guardar en DB usando user_id como igUserId
   *
   * El campo user_id viene directamente en la respuesta del token exchange
   * (no se necesita buscar páginas de Facebook ni instagram_business_account).
   *
   * @param userId - ID del usuario en tu sistema (del parámetro state)
   * @param code   - Código de autorización devuelto por Meta
   */
  async handleOAuthCallback(userId: string, code: string) {
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');

    if (!redirectUri) {
      throw new InternalServerErrorException('META_REDIRECT_URI no configurado');
    }

    // 1. Intercambiar code por short-lived token
    //    Respuesta incluye: { access_token, token_type, expires_in, user_id }
    const shortTokenData = await this.instagramApi.exchangeCodeForToken(
      code,
      redirectUri,
    );

    if (!shortTokenData?.access_token) {
      throw new BadRequestException(
        'No se pudo obtener el access_token. Verifica que el code sea válido y el redirect_uri coincida exactamente con el registrado en Meta.',
      );
    }

    const shortToken = shortTokenData.access_token;
    // user_id viene directamente del token exchange con Instagram Login
    const igUserId = String(shortTokenData.user_id);

    if (!igUserId) {
      throw new BadRequestException(
        'La respuesta del token no incluye user_id. Asegúrate de usar Instagram Login (www.instagram.com/oauth/authorize) y no Facebook Login.',
      );
    }

    // 2. Intercambiar short-lived por long-lived token (~60 días)
    const longTokenData =
      await this.instagramApi.exchangeForLongLivedToken(shortToken);

    if (!longTokenData?.access_token) {
      throw new BadRequestException(
        'No se pudo obtener el long-lived token. Verifica APP_SECRET.',
      );
    }

    const longToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in; // segundos
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 3. Obtener username del usuario (para mostrar en UI)
    let username: string | null = null;
    try {
      const igUser = await this.instagramApi.getInstagramUser(longToken);
      username = igUser.username ?? null;
    } catch {
      // Username no es crítico — continúa sin él
    }

    // 4. Guardar conexión en DB
    await this.connectionService.saveConnection(parseInt(userId, 10), {
      accessToken: longToken,
      igUserId,
      username,
      pageId: null, // Instagram Login no usa Facebook Pages
      expiresAt,
    });

    return {
      success: true,
      message: 'Cuenta de Instagram conectada correctamente',
      igUserId,
      username,
      expiresAt,
    };
  }
}
