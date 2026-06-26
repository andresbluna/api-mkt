import { Controller, Post, Body, Request } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GenerateImageDto } from './dto/gemini.dto';

@Controller('generate')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate-image')
  async generateImage(@Body() dto: GenerateImageDto, @Request() req) {
    console.log('BODY RECIBIDO:', dto);
    console.log('HEADERS:', req.headers);
    const imageBase64 = await this.geminiService.generateImage(dto.prompt);

    return {
      image: imageBase64,
      format: 'png',
    };
  }
}
