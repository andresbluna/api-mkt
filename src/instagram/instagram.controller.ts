import { Body, Controller, Post, Get, Delete, Param } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { PublishInstagramDto } from './dto/instagram.dto';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Post('publish')
  async publish(@Body() dto: PublishInstagramDto) {
    return await this.instagramService.publishPost(dto.imageUrl, dto.caption);
  }

  @Get('status/:id')
  async getStatus(@Param('id') id: string) {
    return await this.instagramService.getPostStatus(id);
  }


  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    return await this.instagramService.deletePost(id);
  }
}

