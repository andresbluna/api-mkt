import { Controller, Post, Body } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import {
  GenerateCaptionDto,
  GenerateHashtagsDto,
  GenerateImageDto,
  GenerateMarketingPostDto,
  OptimizeContentDto,
} from './dto/gemini.dto';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate-caption')
  async generateCaption(@Body() dto: GenerateCaptionDto) {
    const caption = await this.geminiService.generateCaption(dto.prompt);
    return { caption };
  }

  @Post('generate-hashtags')
  async generateHashtags(@Body() dto: GenerateHashtagsDto) {
    const hashtags = await this.geminiService.generateHashtags(dto.prompt);
    return { hashtags };
  }

  @Post('generate')
  async generateMarketingPost(@Body() dto: GenerateMarketingPostDto) {
    const result = await this.geminiService.generateMarketingPost(dto.prompt);
    return result;
  }

  @Post('optimize')
  async optimizeContent(@Body() dto: OptimizeContentDto) {
    const optimized = await this.geminiService.optimizeContent(
      dto.content,
      dto.platform,
    );
    return { content: optimized };
  }

  @Post('generate-image')
  async generateImage(@Body() dto: GenerateImageDto) {
    const imageBase64 = await this.geminiService.generateImage(dto.prompt);

    return {
      image: imageBase64,
      format: 'png',
    };
  }
}

