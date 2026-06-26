// src/instagram-api/instagram-api.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InstagramApiService {
  private graphVersion: string;

  constructor(private configService: ConfigService) {
    this.graphVersion = this.configService.get('META_GRAPH_VERSION') || 'v19.0';
  }

  private get baseUrl() {
    return `https://graph.instagram.com/${this.graphVersion}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const appId = this.configService.get('META_APP_ID');
    const appSecret = this.configService.get('META_APP_SECRET');
    const url = `https://graph.facebook.com/${this.graphVersion}/oauth/access_token`;
    const params = {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    };
    const response = await axios.get(url, { params });
    return response.data;
  }

  async exchangeForLongLivedToken(shortToken: string): Promise<any> {
    const appId = this.configService.get('META_APP_ID');
    const appSecret = this.configService.get('META_APP_SECRET');
    const url = `https://graph.facebook.com/${this.graphVersion}/oauth/access_token`;
    const params = {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken,
    };
    const response = await axios.get(url, { params });
    return response.data;
  }

  async getPages(accessToken: string): Promise<any[]> {
    const url = `https://graph.facebook.com/${this.graphVersion}/me/accounts`;
    const response = await axios.get(url, {
      params: { access_token: accessToken },
    });
    return response.data.data;
  }

  async getIgBusinessId(pageId: string, accessToken: string): Promise<string> {
    const url = `https://graph.facebook.com/${this.graphVersion}/${pageId}`;
    const params = {
      fields: 'instagram_business_account',
      access_token: accessToken,
    };
    const response = await axios.get(url, { params });
    const ig = response.data.instagram_business_account;
    if (!ig) {
      throw new BadRequestException(
        `La página ${pageId} no tiene cuenta de Instagram Business`,
      );
    }
    return ig.id;
  }

  async createMediaContainer(
    igUserId: string,
    imageUrl: string,
    caption: string,
    accessToken: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/${igUserId}/media`;
    const response = await axios.post(url, {
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    });
    return response.data.id;
  }

  async publishMedia(
    igUserId: string,
    creationId: string,
    accessToken: string,
  ): Promise<string> {
    const url = `${this.baseUrl}/${igUserId}/media_publish`;
    const response = await axios.post(url, {
      creation_id: creationId,
      access_token: accessToken,
    });
    return response.data.id;
  }

  async getMediaStatus(mediaId: string, accessToken: string): Promise<any> {
    const url = `${this.baseUrl}/${mediaId}`;
    const params = {
      fields:
        'id,caption,media_type,media_url,timestamp,like_count,comments_count',
      access_token: accessToken,
    };
    const response = await axios.get(url, { params });
    return response.data;
  }

  async deleteMedia(mediaId: string, accessToken: string): Promise<void> {
    const url = `${this.baseUrl}/${mediaId}`;
    await axios.delete(url, { params: { access_token: accessToken } });
  }
}
