import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCajaDto {
  @ApiProperty({ description: 'Nombre identificativo de la caja', example: 'Caja Principal POS' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'ID de la sucursal a la que pertenece la caja', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  sucursal_id: string;
}
