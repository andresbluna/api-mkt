import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateCaptionDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class GenerateHashtagsDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class GenerateMarketingPostDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class OptimizeContentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  platform: string;
}

export class GenerateImageDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

