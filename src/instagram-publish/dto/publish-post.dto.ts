import { IsUrl, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class PublishPostDto {
  @IsUrl({}, { message: 'imageUrl debe ser una URL válida' })
  @IsNotEmpty({ message: 'imageUrl es requerido' })
  imageUrl: string;

  @IsString({ message: 'caption debe ser texto' })
  @IsNotEmpty({ message: 'caption es requerido' })
  @MaxLength(2200, { message: 'caption no puede exceder los 2200 caracteres' })
  caption: string;
}
