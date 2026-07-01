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

  /** Base URL para Instagram Graph API (Instagram Login) */
  private get baseUrl() {
    return `https://graph.instagram.com/${this.graphVersion}`;
  }

  /**
   * Intercambia el authorization_code por un access token de corta duración.
   *
   * CORRECCIÓN: El flujo es Instagram Login, NO Facebook Login.
   * - URL correcta: https://api.instagram.com/oauth/access_token  (no graph.facebook.com)
   * - Método correcto: POST con body application/x-www-form-urlencoded  (no GET)
   * - grant_type requerido: authorization_code
   *
   * Respuesta incluye: { access_token, token_type, expires_in, user_id }
   * El campo user_id es el Instagram User ID directo — sin necesidad de páginas de Facebook.
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<{ access_token: string; token_type: string; expires_in: number; user_id: number }> {
    const url = 'https://api.instagram.com/oauth/access_token';

    const body = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    try {
      const response = await axios.post(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'exchangeCodeForToken');
    }
  }

  /**
   * Intercambia el token de corta duración por uno de larga duración (~60 días).
   *
   * CORRECCIÓN: El grant_type correcto es ig_exchange_token (no fb_exchange_token).
   * - URL correcta: https://graph.instagram.com/access_token  (no graph.facebook.com)
   * - Parámetros correctos: grant_type, client_secret, access_token
   * - No se envía client_id (no requerido para este endpoint)
   *
   * Respuesta: { access_token, token_type, expires_in }
   */
  async exchangeForLongLivedToken(
    shortToken: string,
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const url = 'https://graph.instagram.com/access_token';

    try {
      const response = await axios.get(url, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: this.appSecret,
          access_token: shortToken,
        },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'exchangeForLongLivedToken');
    }
  }

  /**
   * Renueva un long-lived token antes de que expire (válido después de 24 h de emisión).
   * El nuevo token tendrá otros ~60 días de vigencia.
   */
  async refreshLongLivedToken(
    longToken: string,
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const url = 'https://graph.instagram.com/refresh_access_token';

    try {
      const response = await axios.get(url, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: longToken,
        },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'refreshLongLivedToken');
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado: { id, username }.
   *
   * CORRECCIÓN: Reemplaza el flujo getPages → getIgBusinessId.
   * Con Instagram Login el user_id ya viene en el token exchange.
   * Este método se usa para obtener el username si se desea almacenarlo.
   */
  async getInstagramUser(
    accessToken: string,
  ): Promise<{ id: string; username: string }> {
    const url = `${this.baseUrl}/me`;

    try {
      const response = await axios.get(url, {
        params: {
          fields: 'id,username',
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (err) {
      this.handleApiError(err, 'getInstagramUser');
    }
  }

  /**
   * Crea un contenedor de media para una imagen.
   * CORRECCIÓN: Se usan query params (estándar de la API) en lugar de JSON body sin Content-Type.
   *
   * Ref: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing
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
   * CORRECCIÓN: Se usan query params en lugar de JSON body sin Content-Type.
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
   * Obtiene estado y metadatos de un objeto de media publicado.
   * Se agrega 'permalink' y 'status_code' a los campos consultados.
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
   * CORRECCIÓN: La Instagram Graph API NO soporta eliminar publicaciones ya publicadas
   * mediante la API. Esto sólo es posible desde la app de Instagram directamente.
   * Se lanza un error descriptivo en lugar de llamar un endpoint inexistente.
   */
  async deleteMedia(_mediaId: string, _accessToken: string): Promise<void> {
    throw new NotImplementedException(
      'La Instagram Graph API no permite eliminar publicaciones ya publicadas. ' +
        'Elimina el contenido directamente desde la aplicación de Instagram.',
    );
  }

  /**
   * Manejo centralizado de errores de la Meta API.
   * Interpreta los códigos de error de Meta y lanza excepciones descriptivas.
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
            `Permisos insuficientes [${context}]: ${message}`,
          );
        if (code === 4)
          throw new BadRequestException(
            `Límite de solicitudes excedido (rate limit) [${context}]: ${message}`,
          );
        if (code === 100 && error_subcode === 2207051)
          throw new BadRequestException(
            `La URL de la imagen no es accesible por Instagram. Asegúrate de que sea pública y HTTPS.`,
          );
        if (code === 100 && error_subcode === 2207026)
          throw new BadRequestException(
            `El contenedor de media aún no está listo para publicarse (status: IN_PROGRESS). Espera unos segundos e intenta nuevamente.`,
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
      if (status === 400)
        throw new BadRequestException(
          `Solicitud inválida [${context}]: ${err.message}. Revisa redirect_uri y credenciales.`,
        );

      throw new InternalServerErrorException(
        `Error HTTP ${status ?? 'desconocido'} [${context}]: ${err.message}`,
      );
    }

    throw new InternalServerErrorException(
      `Error inesperado [${context}]: ${(err as Error).message ?? err}`,
    );
  }
}
