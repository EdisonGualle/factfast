import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  MaxLength,
  IsUUID,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampoAdicionalDto,
  FormaPagoDto,
  LineaComprobanteDto,
  TipoIdentificacionComprador,
} from '../../../common/dto/solicitud-comprobante.dto';

export class CrearNotaCreditoDto {
  @ApiProperty({ description: 'UUID del punto de emision' })
  @IsUUID()
  punto_emision_id: string;

  @ApiProperty({
    description:
      'Número del documento original que se modifica (formato 000-000-000000000)',
  })
  @IsString()
  @Matches(/^\d{3}-\d{3}-\d{9}$/, {
    message:
      'El número de documento original debe tener el formato 000-000-000000000',
  })
  numero_documento_modificado: string;

  @ApiPropertyOptional({ description: 'Código del tipo de documento modificado (01=Factura, 03=Liquidación)', default: '01' })
  @IsString()
  @IsOptional()
  codigo_documento_modificado?: string;

  @ApiProperty({
    description: 'Fecha de emision de la factura original (dd/MM/yyyy)',
  })
  @IsString()
  fecha_emision_documento_modificado: string;

  @ApiProperty({
    example: 'Anulación de factura',
    description: 'Motivo de nota de credito',
  })
  @IsString()
  @MaxLength(300)
  motivo: string;

  @ApiProperty({ enum: TipoIdentificacionComprador })
  @IsEnum(TipoIdentificacionComprador)
  tipo_identificacion_comprador: TipoIdentificacionComprador;

  @ApiProperty({ example: '0926789017' })
  @IsString()
  @MaxLength(20)
  identificacion_comprador: string;

  @ApiProperty({ example: 'CLIENTE PRUEBA' })
  @IsString()
  @MaxLength(300)
  razon_social_comprador: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correo_comprador?: string;

  @ApiProperty({ type: [LineaComprobanteDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaComprobanteDto)
  lineas: LineaComprobanteDto[];

  @ApiProperty({ type: [FormaPagoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormaPagoDto)
  formas_pago: FormaPagoDto[];

  @ApiPropertyOptional({ type: [CampoAdicionalDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampoAdicionalDto)
  @IsOptional()
  campos_adicionales?: CampoAdicionalDto[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clave_idempotencia?: string;
}
