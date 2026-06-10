import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { InstagramModule } from '../instagram/instagram.module';
import { LogService } from '../shared/services/log.service';
import { InteractionLog } from '../user/interaction-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, InteractionLog]),
    GeminiModule,
    InstagramModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, LogService],
  exports: [PostsService],
})
export class PostsModule {}

