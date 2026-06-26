// src/instagram-publish/instagram-publish.service.ts
import { Injectable } from '@nestjs/common';
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
    const creationId = await this.instagramApi.createMediaContainer(
      conn.igUserId,
      imageUrl,
      caption,
      conn.accessToken,
    );
    const mediaId = await this.instagramApi.publishMedia(
      conn.igUserId,
      creationId,
      conn.accessToken,
    );
    return { success: true, mediaId };
  }

  async getPostStatus(userId: number, mediaId: string) {
    const conn = await this.connectionService.getConnection(userId);
    return this.instagramApi.getMediaStatus(mediaId, conn.accessToken);
  }

  async deletePost(userId: number, mediaId: string) {
    const conn = await this.connectionService.getConnection(userId);
    await this.instagramApi.deleteMedia(mediaId, conn.accessToken);
    return { success: true };
  }
}
