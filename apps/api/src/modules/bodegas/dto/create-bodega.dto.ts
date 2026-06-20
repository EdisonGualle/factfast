import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBodegaDto {
  @ApiProperty({ description: 'Nombre de la bodega', example: 'Bodega Central de Repuestos' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'ID de la sucursal asociada a la bodega', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  sucursal_id: string;
}
