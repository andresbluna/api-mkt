// src/instagram-publish/instagram-publish.service.ts
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InstagramApiService } from '../instagram-api/instagram-api.service';
import { InstagramConnectionService } from '../instagram-connection/instagram-connection.service';

@Injectable()
export class InstagramPublishService {
  constructor(
    private instagramApi: InstagramApiService,
    private connectionService: InstagramConnectionService,
  ) {}

  private async getConnection(userId: string) {
    const connection = await this.connectionService.getConnection(userId);
    if (new Date() >= connection.expiresAt) {
      throw new ForbiddenException(
        'El token de Instagram ha expirado. Vuelve a conectar tu cuenta.',
      );
    }
    return connection;
  }

  async publishPost(userId: string, imageUrl: string, caption: string) {
    if (!imageUrl || !caption) {
      throw new BadRequestException('imageUrl y caption son requeridos');
    }

    const conn = await this.getConnection(userId);
    const { accessToken, igUserId } = conn;

    try {
      const mediaId = await this.instagramApi.createMediaContainer(
        igUserId,
        imageUrl,
        caption,
        accessToken,
      );
      const publishedId = await this.instagramApi.publishMedia(
        igUserId,
        mediaId,
        accessToken,
      );

      return {
        success: true,
        mediaId: publishedId,
        message: 'Post publicado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(
        `Error publicando en Instagram: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async getPostStatus(userId: string, mediaId: string) {
    if (!mediaId) {
      throw new BadRequestException('mediaId es requerido');
    }
    const conn = await this.getConnection(userId);
    try {
      return await this.instagramApi.getMediaStatus(mediaId, conn.accessToken);
    } catch (error) {
      throw new BadRequestException(
        `Error obteniendo estado: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  async deletePost(userId: string, mediaId: string) {
    if (!mediaId) {
      throw new BadRequestException('mediaId es requerido');
    }
    const conn = await this.getConnection(userId);
    try {
      await this.instagramApi.deleteMedia(mediaId, conn.accessToken);
      return {
        success: true,
        message: 'Post eliminado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(
        `Error eliminando post: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }
}
