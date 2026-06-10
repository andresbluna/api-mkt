import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { GeminiService } from '../gemini/gemini.service';
import { InstagramService } from '../instagram/instagram.service';
import { LogService } from '../shared/services/log.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly geminiService: GeminiService,
    private readonly instagramService: InstagramService,
    private readonly logService: LogService,
  ) {}

 //nuevos post
  async createPost(userId: number, dto: CreatePostDto) {
    try {
      const post = this.postRepository.create({
        user_id: userId,
        ...dto,
      });

      const savedPost = await this.postRepository.save(post);

      await this.logService.createLog(userId, 'create_post', {
        post_id: savedPost.id,
        title: savedPost.title,
      });

      return savedPost;
    } catch (error) {
      throw new BadRequestException(`Error creando post: ${error.message}`);
    }
  }

  //todos los post del usuario
  async getUserPosts(userId: number) {
    return await this.postRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  //post especifico
  async getPost(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId, user_id: userId },
    });

    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    return post;
  }

  //actualizar el post
  async updatePost(postId: number, userId: number, dto: UpdatePostDto) {
    const post = await this.getPost(postId, userId);

    Object.assign(post, dto);

    const updatedPost = await this.postRepository.save(post);

    await this.logService.createLog(userId, 'update_post', {
      post_id: updatedPost.id,
    });

    return updatedPost;
  }

 //eliminar el post
  async deletePost(postId: number, userId: number) {
    const post = await this.getPost(postId, userId);

    await this.postRepository.remove(post);

    await this.logService.createLog(userId, 'delete_post', {
      post_id: postId,
    });

    return { message: 'Post eliminado exitosamente' };
  }

  //generar el post con gemini
  async generatePost(userId: number, prompt: string) {
    if (!prompt || prompt.trim() === '') {
      throw new BadRequestException('El prompt no puede estar vacío');
    }

    try {
      const result = await this.geminiService.generateMarketingPost(prompt);

      const post = this.postRepository.create({
        user_id: userId,
        title: prompt.substring(0, 100),
        content: result.fullPost,
        status: 'draft',
      });

      const savedPost = await this.postRepository.save(post);

      await this.logService.createLog(userId, 'generate_content', {
        post_id: savedPost.id,
        prompt,
      });

      return {
        post: savedPost,
        generatedContent: result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error generando post: ${error.message}`,
      );
    }
  }

  //publicar en instagram

  async publishToInstagram(
    postId: number,
    userId: number,
    imageUrl: string,
  ) {
    const post = await this.getPost(postId, userId);

    if (!imageUrl) {
      throw new BadRequestException('Se requiere una URL de imagen');
    }

    if (!post.content) {
      throw new BadRequestException('El post debe tener contenido');
    }

    try {
      const result = await this.instagramService.publishPost(
        imageUrl,
        post.content,
      );

      // Actualizar estado del post
      post.status = 'published';
      post.image_url = imageUrl;
      post.instagram_media_id = result.mediaId;

      const updatedPost = await this.postRepository.save(post);

      await this.logService.createLog(userId, 'publish_instagram', {
        post_id: postId,
        instagram_media_id: result.mediaId,
      });

      return {
        post: updatedPost,
        instagramResult: result,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error publicando en Instagram: ${error.message}`,
      );
    }
  }

  //estadisticas

  async getInstagramStats(postId: number, userId: number) {
    const post = await this.getPost(postId, userId);

    if (!post.instagram_media_id) {
      throw new BadRequestException('Este post no ha sido publicado en Instagram');
    }

    try {
      const stats = await this.instagramService.getPostStatus(
        post.instagram_media_id,
      );
      return stats;
    } catch (error) {
      throw new BadRequestException(
        `Error obteniendo estadísticas: ${error.message}`,
      );
    }
  }
}

