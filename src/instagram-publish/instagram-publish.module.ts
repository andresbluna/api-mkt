// src/instagram-publish/instagram-publish.module.ts
import { Module } from '@nestjs/common';
import { InstagramPublishService } from './instagram-publish.service';
import { InstagramPublishController } from './instagram-publish.controller';
import { InstagramConnectionModule } from '../instagram-connection/instagram-connection.module';
import { InstagramApiModule } from '../instagram-api/instagram-api.module';

@Module({
  imports: [InstagramConnectionModule, InstagramApiModule],
  providers: [InstagramPublishService],
  controllers: [InstagramPublishController],
  exports: [InstagramPublishService],
})
export class InstagramPublishModule {}
