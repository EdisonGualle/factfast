import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateSlugDto {
  @ApiProperty({ description: 'Slug a comprobar disponibilidad', example: 'mi-negocio' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minusculas, numeros y guiones',
  })
  slug: string;
}
