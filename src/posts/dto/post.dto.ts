import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUrl()
  @IsOptional()
  image_url: string;

  @IsString()
  @IsOptional()
  platform: string = 'instagram';
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsUrl()
  @IsOptional()
  image_url: string;

  @IsString()
  @IsOptional()
  status: 'draft' | 'published' | 'scheduled';
}

export class GeneratePostDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class PublishPostDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  caption: string;
}

