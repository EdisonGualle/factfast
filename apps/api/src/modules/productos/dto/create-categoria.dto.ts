import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ description: 'Nombre de la categoría', example: 'Bebidas Calientes' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'ID de la empresa asociada', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;
}
