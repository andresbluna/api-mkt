// src/instagram-auth/instagram-auth.module.ts
import { Module } from '@nestjs/common';
import { InstagramAuthController } from './instagram-auth.controller';
import { InstagramAuthService } from './instagram-auth.service';
import { InstagramConnectionModule } from '../instagram-connection/instagram-connection.module';
import { InstagramApiModule } from '../instagram-api/instagram-api.module';

@Module({
  imports: [InstagramConnectionModule, InstagramApiModule],
  controllers: [InstagramAuthController],
  providers: [InstagramAuthService],
})
export class InstagramAuthModule {}
