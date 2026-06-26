// src/instagram-connection/instagram-connection.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstagramConnection } from './instagram-connection.entity';
import { InstagramConnectionService } from './instagram-connection.service';

@Module({
  imports: [TypeOrmModule.forFeature([InstagramConnection])],
  providers: [InstagramConnectionService],
  exports: [InstagramConnectionService],
})
export class InstagramConnectionModule {}
