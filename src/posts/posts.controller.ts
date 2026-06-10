import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, GeneratePostDto, PublishPostDto } from './dto/post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Crear un nuevo post
   */
  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    // En producción, obtener userId de @CurrentUser() decorator
    const userId = 1; // Por ahora hardcodeado
    return await this.postsService.createPost(userId, dto);
  }

  /**
   * Obtener posts del usuario
   */
  @Get()
  async getUserPosts() {
    const userId = 1;
    return await this.postsService.getUserPosts(userId);
  }

  /**
   * Obtener un post específico
   */
  @Get(':id')
  async getPost(@Param('id') id: string) {
    const userId = 1;
    return await this.postsService.getPost(Number(id), userId);
  }

  /**
   * Actualizar un post
   */
  @Patch(':id')
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const userId = 1;
    return await this.postsService.updatePost(Number(id), userId, dto);
  }

  /**
   * Eliminar un post
   */
  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    const userId = 1;
    return await this.postsService.deletePost(Number(id), userId);
  }

  /**
   * Generar post con Gemini
   */
  @Post('generate/content')
  async generatePost(@Body() dto: GeneratePostDto) {
    const userId = 1;
    return await this.postsService.generatePost(userId, dto.prompt);
  }

  /**
   * Publicar post en Instagram
   */
  @Post(':id/publish')
  async publishToInstagram(
    @Param('id') id: string,
    @Body() dto: PublishPostDto,
  ) {
    const userId = 1;
    return await this.postsService.publishToInstagram(
      Number(id),
      userId,
      dto.imageUrl,
    );
  }

  /**
   * Obtener estadísticas en Instagram
   */
  @Get(':id/stats')
  async getInstagramStats(@Param('id') id: string) {
    const userId = 1;
    return await this.postsService.getInstagramStats(Number(id), userId);
  }
}

