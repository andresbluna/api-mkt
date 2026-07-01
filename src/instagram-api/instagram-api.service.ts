// src/instagram-api/instagram-api.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotImplementedException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InstagramApiService {
  private readonly graphVersion: string;
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(private configService: ConfigService) {
    this.graphVersion =
      this.configService.get<string>('META_GRAPH_VERSION') ?? 'v21.0';
    this.appId = this.configService.get<string>('META_APP_ID') ?? '';
    this.appSecret = this.configService.get<string>('META_APP_SECRET') ?? '';
  }

  /**
   * Base URL para "Instagram API with Facebook Login".
   * Todos los endpoints (token, pages, media) usan graph.facebook.com.
   * NO usar graph.instagram.com — ese dominio es de Instagram Login.
   */
  private get baseUrl() {
    return `https://graph.facebook.com/${this.graphVersion}`;
  }

  /**
   * Intercambia el authorization_code por un User Access Token de corta duración.
   *
   * Flujo: "Instagram API with Facebook Login"
   * - URL: graph.facebook.com  (NO api.instagram.com)
   * - Método: GET con params en query string  (NO POST urlencoded)
   * - NO devuelve user_id — el IG user ID se obtiene vía Pages
   *
   * Respuesta: { access_token, token_type, expires_in }
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const url = `${this.baseUrl}/oauth/access_token`;

    try {
      const response = await axios.get(url, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'exchangeCodeForToken');
    }
  }

  /**
   * Intercambia el User Token de corta duración por uno de larga duración (~60 días).
   *
   * Flujo: Facebook Login
   * - URL: graph.facebook.com  (NO graph.instagram.com)
   * - grant_type: fb_exchange_token  (NO ig_exchange_token)
   * - Requiere client_id + client_secret + fb_exchange_token
   *
   * Respuesta: { access_token, token_type, expires_in }
   */
  async exchangeForLongLivedToken(
    shortToken: string,
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const url = `${this.baseUrl}/oauth/access_token`;

    try {
      const response = await axios.get(url, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortToken,
        },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'exchangeForLongLivedToken');
    }
  }

  /**
   * Obtiene las páginas de Facebook administradas por el usuario.
   *
   * IMPORTANTE: Llamar con un long-lived User Token para que los page access_token
   * devueltos sean PERMANENTES (no expiran hasta que el usuario revoca el permiso).
   *
   * Respuesta: [{ id, name, access_token (permanente) }]
   */
  async getPages(
    longLivedUserToken: string,
  ): Promise<Array<{ id: string; name: string; access_token: string }>> {
    const url = `${this.baseUrl}/me/accounts`;

    try {
      const response = await axios.get(url, {
        params: {
          fields: 'id,name,access_token',
          access_token: longLivedUserToken,
        },
      });
      return response.data.data;
    } catch (err) {
      this.handleApiError(err, 'getPages');
    }
  }

  /**
   * Obtiene el Instagram Business Account ID vinculado a una Facebook Page.
   * Devuelve el igUserId usado en todos los endpoints de media.
   */
  async getIgBusinessId(
    pageId: string,
    pageAccessToken: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/${pageId}`;

    try {
      const response = await axios.get(url, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken,
        },
      });

      const ig = response.data?.instagram_business_account;
      if (!ig?.id) {
        throw new BadRequestException(
          `La página de Facebook (id=${pageId}) no tiene una cuenta de Instagram Business o Creator vinculada. ` +
            `Ve a Configuración de la página → Instagram → Conectar cuenta.`,
        );
      }
      return ig.id;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.handleApiError(err, 'getIgBusinessId');
    }
  }

  /**
   * Crea un contenedor de media para una imagen.
   *
   * Usa graph.facebook.com (Facebook Login).
   * El access_token debe ser el page access token permanente.
   *
   * Ref: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing
   */
  async createMediaContainer(
    igUserId: string,
    imageUrl: string,
    caption: string,
    accessToken: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/${igUserId}/media`;

    try {
      const response = await axios.post(url, null, {
        params: {
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        },
      });
      return response.data.id;
    } catch (err) {
      this.handleApiError(err, 'createMediaContainer');
    }
  }

  /**
   * Publica un contenedor de media previamente creado.
   * El access_token debe ser el page access token permanente.
   */
  async publishMedia(
    igUserId: string,
    creationId: string,
    accessToken: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/${igUserId}/media_publish`;

    try {
      const response = await axios.post(url, null, {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
      });
      return response.data.id;
    } catch (err) {
      this.handleApiError(err, 'publishMedia');
    }
  }

  /**
   * Obtiene estado y metadatos de un objeto de media.
   * status_code: FINISHED | IN_PROGRESS | ERROR | EXPIRED
   */
  async getMediaStatus(mediaId: string, accessToken: string): Promise<any> {
    const url = `${this.baseUrl}/${mediaId}`;

    try {
      const response = await axios.get(url, {
        params: {
          fields:
            'id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink,status_code',
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'getMediaStatus');
    }
  }

  /**
   * La Instagram Graph API no soporta eliminar publicaciones ya publicadas.
   */
  async deleteMedia(_mediaId: string, _accessToken: string): Promise<void> {
    throw new NotImplementedException(
      'La Instagram Graph API no permite eliminar publicaciones ya publicadas. ' +
        'Elimina el contenido directamente desde la aplicación de Instagram.',
    );
  }

  /**
   * Manejo centralizado de errores de Meta API.
   */
  private handleApiError(err: unknown, context: string): never {
    if (axios.isAxiosError(err)) {
      const metaError = err.response?.data?.error;

      if (metaError) {
        const { code, message, error_subcode } = metaError;

        if (code === 190)
          throw new BadRequestException(
            `Token inválido o expirado [${context}]: ${message}`,
          );
        if (code === 200 || code === 10)
          throw new BadRequestException(
            `Permisos insuficientes [${context}]: ${message}. Verifica que los scopes estén aprobados en Meta Developer Console.`,
          );
        if (code === 4)
          throw new BadRequestException(
            `Límite de solicitudes excedido (rate limit) [${context}]: ${message}`,
          );
        if (code === 100 && error_subcode === 2207051)
          throw new BadRequestException(
            `La URL de la imagen no es accesible por Instagram. Debe ser pública, HTTPS y menor a 8MB.`,
          );
        if (code === 100 && error_subcode === 2207026)
          throw new BadRequestException(
            `El contenedor de media aún no está listo (IN_PROGRESS). Espera unos segundos e intenta nuevamente.`,
          );
        if (code === 36000)
          throw new BadRequestException(
            `La cuenta de Instagram no es Business ni Creator. Solo cuentas profesionales pueden publicar via API.`,
          );

        throw new BadRequestException(
          `Error de Meta API [${context}] code=${code}: ${message}`,
        );
      }

      const status = err.response?.status;
      throw new InternalServerErrorException(
        `Error HTTP ${status ?? 'desconocido'} [${context}]: ${err.message}`,
      );
    }

    throw new InternalServerErrorException(
      `Error inesperado [${context}]: ${(err as Error).message ?? err}`,
    );
  }
}
