import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { GeminiModule } from './gemini/gemini.module';
import { UsersModule } from './user/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './user/user.entity';
import { InteractionLog } from './user/interaction-log.entity';

// Importa todos los módulos de Instagram
import { InstagramApiModule } from './instagram-api/instagram-api.module';
import { InstagramAuthModule } from './instagram-auth/instagram-auth.module';
import { InstagramConnectionModule } from './instagram-connection/instagram-connection.module';
import { InstagramPublishModule } from './instagram-publish/instagram-publish.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([User, InteractionLog]),
    UsersModule,
    AuthModule,
    GeminiModule,
    // Módulos de Instagram
    InstagramApiModule,
    InstagramAuthModule,
    InstagramConnectionModule,
    InstagramPublishModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
