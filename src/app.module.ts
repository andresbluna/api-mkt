import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { GeminiModule } from './gemini/gemini.module';
import { InstagramModule } from './instagram/instagram.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './user/users.module';
import { User } from './user/user.entity';
import { InteractionLog } from './user/interaction-log.entity';
import { Post } from './posts/entities/post.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([User, InteractionLog, Post]),
    UsersModule,
    GeminiModule,
    InstagramModule,
    PostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}




