// src/instagram-publish/instagram-publish.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { InstagramPublishService } from './instagram-publish.service';
import { PublishPostDto } from './dto/publish-post.dto';

@Controller('instagram/publish')
export class InstagramPublishController {
  constructor(private instagramPublishService: InstagramPublishService) {}

  @Post()
  async publishPost(@Req() req, @Body() dto: PublishPostDto) {
    const userId = req.user?.id; // asume que tienes un guard que setea req.user
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }
    return this.instagramPublishService.publishPost(
      userId,
      dto.imageUrl,
      dto.caption,
    );
  }

  @Get('status/:mediaId')
  async getStatus(@Req() req, @Param('mediaId') mediaId: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }
    return this.instagramPublishService.getPostStatus(userId, mediaId);
  }

  @Delete(':mediaId')
  async deletePost(@Req() req, @Param('mediaId') mediaId: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }
    return this.instagramPublishService.deletePost(userId, mediaId);
  }
}
