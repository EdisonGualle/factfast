import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespuestaPuntoEmisionDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  sucursal_id: string;

  @ApiProperty({
    example: '001',
    description: 'Codigo de punto de emision SRI de 3 digitos',
  })
  codigo: string;

  @ApiProperty({ example: 'Caja 1' })
  nombre: string;

  @ApiProperty({ example: 24, description: 'Proximo secuencial de factura' })
  secuencia_factura: number;

  @ApiProperty({ example: 1 })
  secuencia_liquidacion: number;

  @ApiProperty({ example: 3 })
  secuencia_nota_credito: number;

  @ApiProperty({ example: 1 })
  secuencia_nota_debito: number;

  @ApiProperty({ example: 2 })
  secuencia_guia_remision: number;

  @ApiProperty({ example: 5 })
  secuencia_retencion: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2026-05-07T20:15:30.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-05-07T20:15:30.000Z' })
  updated_at: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  deleted_at?: string | null;
}
