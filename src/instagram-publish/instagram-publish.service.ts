// src/instagram-publish/instagram-publish.service.ts
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InstagramConnectionService } from '../instagram-connection/instagram-connection.service';
import { InstagramApiService } from '../instagram-api/instagram-api.service';

@Injectable()
export class InstagramPublishService {
  constructor(
    private connectionService: InstagramConnectionService,
    private instagramApi: InstagramApiService,
  ) {}

  async publishPost(userId: number, imageUrl: string, caption: string) {
    const conn = await this.connectionService.getConnection(userId);

    // Page access tokens permanentes no tienen expiresAt — solo verificar si hay fecha y expiró
    if (conn.expiresAt && conn.expiresAt < new Date()) {
      throw new BadRequestException(
        'El access token de Instagram ha expirado. El usuario debe volver a conectar su cuenta.',
      );
    }

    // Paso 1: Crear el contenedor de media
    const creationId = await this.instagramApi.createMediaContainer(
      conn.igUserId,
      imageUrl,
      caption,
      conn.accessToken,
    );

    // Paso 2: Esperar a que Instagram procese el container (status: FINISHED)
    await this.waitForContainer(creationId, conn.accessToken);

    // Paso 3: Publicar
    const mediaId = await this.instagramApi.publishMedia(
      conn.igUserId,
      creationId,
      conn.accessToken,
    );

    return { success: true, mediaId };
  }

  /**
   * Espera hasta que el contenedor de media esté listo para publicarse.
   * Instagram puede tardar segundos en procesar imágenes/videos.
   * status_code posibles: FINISHED, IN_PROGRESS, ERROR, EXPIRED.
   */
  private async waitForContainer(
    creationId: string,
    accessToken: string,
    maxAttempts = 10,
    intervalMs = 2000,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const status = await this.instagramApi.getMediaStatus(
        creationId,
        accessToken,
      );

      if (status.status_code === 'FINISHED') return;
      if (status.status_code === 'ERROR') {
        throw new BadRequestException(
          `Instagram rechazó el contenedor de media (status: ERROR). Verifica que la imagen sea JPEG/PNG pública y menor a 8MB.`,
        );
      }
      if (status.status_code === 'EXPIRED') {
        throw new BadRequestException(
          `El contenedor de media expiró (status: EXPIRED). Solo tienes 24 horas para publicar un container creado.`,
        );
      }

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }

    throw new BadRequestException(
      `El contenedor de media tardó demasiado en procesarse. Intenta nuevamente en unos momentos.`,
    );
  }

  async getPostStatus(userId: number, mediaId: string) {
    const conn = await this.connectionService.getConnection(userId);
    return this.instagramApi.getMediaStatus(mediaId, conn.accessToken);
  }

  async deletePost(_userId: number, _mediaId: string) {
    throw new BadRequestException(
      'La Instagram Graph API no permite eliminar publicaciones ya publicadas. ' +
        'Elimina el contenido directamente desde la aplicación de Instagram.',
    );
  }
}
