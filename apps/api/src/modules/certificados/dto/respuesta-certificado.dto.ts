import { ApiProperty } from '@nestjs/swagger';

export class RespuestaCertificadoDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'JUAN CARLOS PEREZ MORA' })
  nombre_titular: string;

  @ApiProperty({ example: '0924383631001' })
  ruc_titular: string;

  @ApiProperty({ example: '2027-12-31T00:00:00.000Z' })
  fecha_vencimiento: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2026-05-07T20:15:30.000Z' })
  created_at: string;
}
