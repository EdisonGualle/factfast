import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RespuestaPuntoEmisionDto } from '../../puntos-emision/dto/respuesta-punto-emision.dto';

export class RespuestaSucursalDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  empresa_id: string;

  @ApiProperty({
    example: '001',
    description: 'Codigo de establecimiento SRI de 3 digitos',
  })
  codigo: string;

  @ApiProperty({ example: 'Sucursal Centro' })
  nombre: string;

  @ApiProperty({ example: 'Guayaquil, Av. 9 de Octubre 100' })
  direccion: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2026-05-07T20:15:30.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-05-07T20:15:30.000Z' })
  updated_at: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_at?: string | null;

  @ApiPropertyOptional({ type: [RespuestaPuntoEmisionDto] })
  puntos_emision?: RespuestaPuntoEmisionDto[];
}
