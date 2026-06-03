import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InstagramService {

  async publishPost(
    imageUrl: string,
    caption: string,
  ) {

    const businessId =
      process.env.INSTAGRAM_BUSINESS_ID;

    const token =
      process.env.INSTAGRAM_ACCESS_TOKEN;

    // Crear media container
    const media = await axios.post(
      `https://graph.facebook.com/v19.0/${businessId}/media`,
      {
        image_url: imageUrl,
        caption,
        access_token: token,
      },
    );

    const creationId = media.data.id;

    // Publicar
    const publish = await axios.post(
      `https://graph.facebook.com/v19.0/${businessId}/media_publish`,
      {
        creation_id: creationId,
        access_token: token,
      },
    );

    return publish.data;
  }
}