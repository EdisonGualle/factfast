import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespuestaEmpresaDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '0924383631001' })
  ruc: string;

  @ApiProperty({ example: 'MI EMPRESA S.A.' })
  razon_social: string;

  @ApiPropertyOptional({ example: 'COMERCIAL XYZ' })
  nombre_comercial: string | null;

  @ApiProperty({
    enum: [
      'GENERAL',
      'RIMPE_EMPRENDEDOR',
      'RIMPE_NEGOCIO_POPULAR',
      'AGENTE_RETENCION',
    ],
    example: 'GENERAL',
  })
  regimen_tributario: string;

  @ApiProperty({ enum: ['PRUEBAS', 'PRODUCCION'], example: 'PRUEBAS' })
  ambiente_sri: string;

  @ApiPropertyOptional({ example: 'Guayaquil, Av. Principal 123' })
  direccion_matriz: string | null;

  @ApiProperty({ example: false })
  obligado_contabilidad: boolean;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2026-05-07T10:30:00.000Z' })
  created_at: string;
}
