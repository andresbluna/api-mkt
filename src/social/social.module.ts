import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SocialController } from './social.controller';
import { SocialService } from './social.service';

import { SocialAccount } from './entities/social-account.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialAccount,
      User,
    ]),
  ],

  controllers: [SocialController],

  providers: [SocialService],

  exports: [SocialService],
})
export class SocialModule {}