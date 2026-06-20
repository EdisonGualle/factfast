import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const estadosComprobante = [
  'BORRADOR',
  'FIRMADO',
  'ENVIADO',
  'AUTORIZADO',
  'FALLIDO',
  'ANULADO',
];
const tiposComprobante = [
  'FACTURA',
  'LIQUIDACION_COMPRA',
  'NOTA_CREDITO',
  'NOTA_DEBITO',
  'GUIA_REMISION',
  'RETENCION',
];

export class RespuestaComprobanteEmitidoDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '0105202601092438363100110010010000000011234567891' })
  clave_acceso: string;

  @ApiProperty({ enum: estadosComprobante, example: 'FIRMADO' })
  estado: string;

  @ApiProperty({ example: '001001-000000001' })
  serie: string;

  @ApiPropertyOptional({
    example: 'Comprobante firmado y encolado para autorizacion del SRI',
  })
  mensaje?: string;
}

export class ItemListadoComprobanteDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '0105202601092438363100110010010000000011234567891' })
  clave_acceso: string;

  @ApiProperty({ enum: estadosComprobante, example: 'FIRMADO' })
  estado: string;

  @ApiProperty({ example: '001001' })
  serie: string;

  @ApiProperty({ example: '000000001' })
  numero_secuencial: string;

  @ApiPropertyOptional({ example: 'CLIENTE PRUEBA' })
  razon_social_comprador?: string;

  @ApiPropertyOptional({ example: '0926789017' })
  identificacion_comprador?: string;

  @ApiPropertyOptional({ example: '115.00' })
  importe_total?: string;

  @ApiPropertyOptional({ example: '2026-05-05T20:15:30.000Z', nullable: true })
  fecha_autorizacion?: string | null;

  @ApiProperty({ example: '2026-05-05T20:15:30.000Z' })
  created_at: string;
}

export class RespuestaDetalleComprobanteDto extends ItemListadoComprobanteDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  empresa_id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  punto_emision_id: string;

  @ApiProperty({ enum: tiposComprobante, example: 'FACTURA' })
  tipo_comprobante: string;

  @ApiPropertyOptional({ example: '04' })
  tipo_identificacion_comprador?: string;

  @ApiPropertyOptional({ example: 'cliente@email.com', nullable: true })
  correo_comprador?: string | null;

  @ApiPropertyOptional({
    example: 'Guayaquil, Calle Principal 123',
    nullable: true,
  })
  direccion_comprador?: string | null;

  @ApiPropertyOptional({ example: '100.00' })
  subtotal_sin_impuestos?: string;

  @ApiPropertyOptional({ example: '0.00' })
  total_descuento?: string;

  @ApiPropertyOptional({ example: '15.00' })
  total_iva?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/xml/clave.xml',
    nullable: true,
  })
  url_xml?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/pdf/clave.pdf',
    nullable: true,
  })
  url_pdf?: string | null;

  @ApiPropertyOptional({
    example: '0105202601092438363100110010010000000011234567891',
    nullable: true,
  })
  numero_autorizacion?: string | null;

  @ApiPropertyOptional({ example: 0 })
  intentos_envio?: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  ultimo_error?: string | null;

  @ApiProperty({ example: '2026-05-05T20:15:30.000Z' })
  updated_at: string;
}
