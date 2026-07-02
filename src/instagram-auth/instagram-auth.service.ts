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
   * Genera la URL de autorización para "Instagram Business API" (vía Facebook Login).
   * Usa el endpoint de diálogo OAuth de Facebook con los scopes correctos para
   * la API de Instagram Business (no la Basic Display, que fue descontinuada).
   */
  getAuthUrl(userId: string): string {
    const appId = this.configService.get<string>('META_APP_ID');
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');
    const graphVersion =
      this.configService.get<string>('META_GRAPH_VERSION') ?? 'v21.0';

    if (!appId) {
      throw new InternalServerErrorException('META_APP_ID no configurado');
    }
    if (!redirectUri) {
      throw new InternalServerErrorException(
        'META_REDIRECT_URI no configurado',
      );
    }

    // Scopes actualizados para Instagram Business API
    const scope = [
      'pages_show_list', // listar páginas administradas
      'pages_read_engagement', // leer engagement de la página (requerido)
      'instagram_business_basic', // acceso a datos de Instagram Business
      'instagram_business_content_publish', // publicar contenido (reemplaza a instagram_content_publish)
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
   * Maneja el callback de OAuth para "Instagram Business API".
   *
   * Flujo:
   *   1. Intercambiar código por short-lived User Token (graph.facebook.com/oauth/access_token)
   *   2. Intercambiar short-lived por long-lived User Token (~60 días)
   *   3. Obtener páginas administradas (graph.facebook.com/me/accounts)
   *   4. Seleccionar la primera página que tenga una cuenta de Instagram Business asociada
   *   5. Obtener el Instagram Business Account ID
   *   6. Guardar el page access token (permanente) junto con el igUserId y pageId
   *
   * @param userId - ID del usuario en tu sistema (viene del parámetro state)
   * @param code   - Authorization code devuelto por Meta en el callback
   */
  async handleOAuthCallback(userId: string, code: string) {
    const redirectUri = this.configService.get<string>('META_REDIRECT_URI');

    if (!redirectUri) {
      throw new InternalServerErrorException(
        'META_REDIRECT_URI no configurado',
      );
    }

    // Validar que userId sea un número válido
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new BadRequestException(
        'El parámetro "state" debe ser un ID de usuario numérico.',
      );
    }

    // 1. Intercambiar code por short-lived User Token
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
    const longTokenData =
      await this.instagramApi.exchangeForLongLivedToken(shortToken);

    if (!longTokenData?.access_token) {
      throw new BadRequestException(
        'No se pudo obtener el long-lived token. Verifica META_APP_SECRET.',
      );
    }

    const longLivedUserToken = longTokenData.access_token;

    // 3. Obtener todas las páginas administradas por el usuario
    const pages = await this.instagramApi.getPages(longLivedUserToken);

    if (!pages || pages.length === 0) {
      throw new BadRequestException(
        'El usuario no administra ninguna página de Facebook. ' +
          'Para publicar en Instagram Business, la cuenta de Instagram debe estar vinculada a una página de Facebook. ' +
          'Ve a facebook.com/pages/create o conecta la página existente en Configuración de Instagram.',
      );
    }

    // 4. Buscar una página que tenga una cuenta de Instagram Business asociada
    //    Recorremos las páginas para encontrar la primera con instagram_business_account
    type FbPage = { id: string; name: string; access_token: string };
    let selectedPage: FbPage | null = null;
    let selectedPageAccessToken: string | null = null;
    let igUserId: string | null = null;

    for (const page of pages) {
      try {
        const igId = await this.instagramApi.getIgBusinessId(
          page.id,
          page.access_token,
        );
        if (igId) {
          selectedPage = page;
          selectedPageAccessToken = page.access_token;
          igUserId = igId;
          break;
        }
      } catch {
        // Esta página no tiene Instagram Business — continuar con la siguiente
        console.warn(
          `La página ${page.id} no tiene cuenta de Instagram Business asociada.`,
        );
      }
    }

    if (!selectedPage || !igUserId || !selectedPageAccessToken) {
      throw new BadRequestException(
        'Ninguna de las páginas administradas tiene una cuenta de Instagram Business vinculada. ' +
          'Asegúrate de que tu cuenta de Instagram sea de tipo Business o Creator y esté conectada a una página de Facebook. ' +
          'Puedes verificarlo en la configuración de Instagram desde el perfil de la página de Facebook.',
      );
    }

    // 5. Guardar conexión en DB con el page access token (permanente)
    //    expiresAt = null porque los page access tokens derivados de long-lived user tokens no expiran
    await this.connectionService.saveConnection(numericUserId, {
      accessToken: selectedPageAccessToken, // permanente
      igUserId,
      pageId: selectedPage.id,
      expiresAt: null,
    });

    return {
      success: true,
      message: 'Cuenta de Instagram conectada correctamente',
      igUserId,
      pageId: selectedPage.id,
    };
  }
}
