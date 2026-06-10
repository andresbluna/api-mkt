import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InstagramService {
  private accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  private businessId = process.env.INSTAGRAM_BUSINESS_ID;

  constructor() {
    if (!this.accessToken || !this.businessId) {
      throw new Error(
        'INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_BUSINESS_ID no están definidas',
      );
    }
  }

  /**
   * Publicar post en Instagram
   */
  async publishPost(imageUrl: string, caption: string) {
    if (!imageUrl || !caption) {
      throw new BadRequestException('imageUrl y caption son requeridos');
    }

    try {
      // Crear media container
      const mediaResponse = await axios.post(
        `https://graph.instagram.com/v19.0/${this.businessId}/media`,
        {
          image_url: imageUrl,
          caption,
          access_token: this.accessToken,
        },
      );

      const mediaId = mediaResponse.data.id;

      // Publicar media
      const publishResponse = await axios.post(
        `https://graph.instagram.com/v19.0/${this.businessId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.accessToken,
        },
      );

      return {
        success: true,
        mediaId: publishResponse.data.id,
        message: 'Post publicado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException(
        `Error publicando en Instagram: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Obtener estado del post
   */
  async getPostStatus(mediaId: string) {
    if (!mediaId) {
      throw new BadRequestException('mediaId es requerido');
    }

    try {
      const response = await axios.get(
        `https://graph.instagram.com/v19.0/${mediaId}`,
        {
          params: {
            fields: 'id,caption,media_type,media_url,timestamp,like_count,comments_count',
            access_token: this.accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Error obteniendo estado: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  /**
   * Eliminar post
   */
  async deletePost(mediaId: string) {
    if (!mediaId) {
      throw new BadRequestException('mediaId es requerido');
    }

    try {
      await axios.delete(
        `https://graph.instagram.com/v19.0/${mediaId}`,
        {
          params: {
            access_token: this.accessToken,
          },
        },
      );

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

