// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { databaseProvider } from '../database.provider';

@Module({
  controllers: [UsersController],
  providers: [UsersService, databaseProvider],
})
export class UsersModule {}