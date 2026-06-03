import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { InstagramService }
  from './instagram.service';

@Controller('instagram')
export class InstagramController {

  constructor(
    private readonly instagramService:
    InstagramService,
  ) {}

  @Post('publish')
  async publish(
    @Body() body: any,
  ) {

    return await this.instagramService
      .publishPost(
        body.imageUrl,
        body.caption,
      );
  }
}