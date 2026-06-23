import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  uuid: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  plan: string = 'free';
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  plan: string;
}

export class CreateInteractionLogDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsOptional()
  metadata: Record<string, any> = {};
}

