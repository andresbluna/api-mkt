import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class PublishInstagramDto {
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  caption: string;
}

export class GetInstagramStatusDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

