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
   * Genera la URL de autorización para "Instagram API with Facebook Login".
   *
   * CORRECCIÓN CRÍTICA: El endpoint correcto es el Facebook OAuth dialog, NO Instagram Login.
   * Usar www.instagram.com/oauth/authorize causa "Invalid redirect_uri" porque
   * el redirect_uri está registrado en la sección Facebook Login de Meta Developer Console,
   * no en la sección de Instagram Login.
   *
   * Scopes para "Instagram API with Facebook Login":
   *   - pages_show_list           → listar páginas del usuario (para encontrar la página vinculada)
   *   - pages_read_engagement     → leer datos de la página (requerido para acceder a IG Business)
   *   - instagram_basic           → acceder al Instagram Business Account de la página
   *   - instagram_content_publish → publicar imágenes y videos en Instagram
   *
   * NOTA: "instagram_content_publishing" (con "ing") es el nombre DEPRECADO.
   *       El scope correcto actual es "instagram_content_publish".
   */
  getAuthUrl(userId: string): string {
    const appId = this.configService.get<string>('META_APP_ID');
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');
    const graphVersion =
      this.configService.get<string>('META_GRAPH_VERSION') ?? 'v21.0';

    if (!appId) throw new InternalServerErrorException('META_APP_ID no configurado');
    if (!redirectUri)
      throw new InternalServerErrorException('META_REDIRECT_URI no configurado');

    const scope = [
      'pages_show_list',
      'pages_read_engagement',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    return (
      `https://www.facebook.com/${graphVersion}/dialog/oauth` +
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
    pageId?: string;
    expiresAt?: Date;
  }> {
    try {
      const conn: InstagramConnection =
        await this.connectionService.getConnection(userId);
      return {
        connected: true,
        igUserId: conn.igUserId,
        pageId: conn.pageId ?? undefined,
        expiresAt: conn.expiresAt ?? undefined,
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
   * Maneja el callback de OAuth para "Instagram API with Facebook Login".
   *
   * Flujo correcto:
   *   1. GET graph.facebook.com/oauth/access_token → short-lived User Token
   *      (la respuesta NO contiene user_id)
   *   2. GET graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token
   *      → long-lived User Token (~60 días)
   *   3. GET graph.facebook.com/me/accounts (con long-lived User Token)
   *      → páginas de Facebook + page access tokens PERMANENTES
   *   4. GET graph.facebook.com/{pageId}?fields=instagram_business_account
   *      → Instagram Business Account ID (igUserId)
   *   5. Guardar en DB: igUserId, pageId, pageAccessToken (permanente)
   *
   * Se almacena el PAGE access token (no el user token) porque:
   *   - Es permanente cuando se deriva de un long-lived user token
   *   - Está scoped a la página/cuenta de Instagram específica
   *   - Es el token recomendado por Meta para publicación server-side
   *
   * @param userId - ID del usuario en tu sistema (viene del parámetro state)
   * @param code   - Authorization code devuelto por Meta en el callback
   */
  async handleOAuthCallback(userId: string, code: string) {
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');

    if (!redirectUri) {
      throw new InternalServerErrorException('META_REDIRECT_URI no configurado');
    }

    // 1. Intercambiar code por short-lived User Access Token
    //    Con Facebook Login la respuesta NO incluye user_id
    const shortTokenData = await this.instagramApi.exchangeCodeForToken(
      code,
      redirectUri,
    );

    if (!shortTokenData?.access_token) {
      throw new BadRequestException(
        'No se pudo obtener el access_token. ' +
          'Verifica que el redirect_uri en el código coincida EXACTAMENTE con el registrado en Meta Developer Console ' +
          '(mismo protocolo, dominio, puerto y path, sin trailing slash).',
      );
    }

    const shortToken = shortTokenData.access_token;

    // 2. Intercambiar short-lived User Token por long-lived User Token (~60 días)
    //    Necesario para que los page access tokens obtenidos en el paso 3 sean PERMANENTES
    const longTokenData =
      await this.instagramApi.exchangeForLongLivedToken(shortToken);

    if (!longTokenData?.access_token) {
      throw new BadRequestException(
        'No se pudo obtener el long-lived token. Verifica META_APP_SECRET.',
      );
    }

    const longLivedUserToken = longTokenData.access_token;

    // 3. Obtener páginas de Facebook con sus page access tokens PERMANENTES
    //    Los page tokens son permanentes cuando se piden con un long-lived user token
    const pages = await this.instagramApi.getPages(longLivedUserToken);

    if (!pages || pages.length === 0) {
      throw new BadRequestException(
        'El usuario no administra ninguna página de Facebook. ' +
          'Para publicar en Instagram Business, la cuenta de Instagram debe estar vinculada a una página de Facebook. ' +
          'Ve a facebook.com/pages/create o conecta la página existente en Configuración de Instagram.',
      );
    }

    // Tomar la primera página (la más común es tener solo una)
    const page = pages[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token; // Permanente si viene de long-lived user token

    if (!pageAccessToken) {
      throw new BadRequestException(
        `No se pudo obtener el access token de la página (id=${pageId}). ` +
          'Asegúrate de que el scope pages_show_list esté aprobado.',
      );
    }

    // 4. Obtener el Instagram Business Account vinculado a la página
    const igUserId = await this.instagramApi.getIgBusinessId(
      pageId,
      pageAccessToken,
    );

    // 5. Guardar conexión en DB con el page access token permanente
    //    expiresAt = null porque los page access tokens derivados de long-lived tokens no expiran
    await this.connectionService.saveConnection(parseInt(userId, 10), {
      accessToken: pageAccessToken, // permanente
      igUserId,
      pageId,
      expiresAt: null,
    });

    return {
      success: true,
      message: 'Cuenta de Instagram conectada correctamente',
      igUserId,
      pageId,
    };
  }
}
