import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  MaxLength,
  IsEmail,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampoAdicionalDto,
  FormaPagoDto,
  LineaComprobanteDto,
  TipoIdentificacionComprador,
} from '../../../common/dto/solicitud-comprobante.dto';
import { ImpuestoRetencionDto } from '../../retenciones/dto/crear-retencion.dto';

export class CrearLiquidacionCompraDto {
  @ApiProperty({ description: 'UUID del punto de emision' })
  @IsUUID()
  punto_emision_id: string;

  @ApiProperty({
    enum: TipoIdentificacionComprador,
    example: TipoIdentificacionComprador.CEDULA,
    description: 'Tipo de identificación del proveedor al que se emite la liquidación',
  })
  @IsEnum(TipoIdentificacionComprador)
  tipo_identificacion_proveedor: TipoIdentificacionComprador;

  @ApiProperty({ example: '0926789017' })
  @IsString()
  @MaxLength(20)
  identificacion_proveedor: string;

  @ApiProperty({ example: 'PROVEEDOR PRUEBA' })
  @IsString()
  @MaxLength(300)
  razon_social_proveedor: string;

  @ApiPropertyOptional({ example: 'proveedor@email.com' })
  @IsEmail()
  @IsOptional()
  correo_proveedor?: string;

  @ApiPropertyOptional({ example: 'Guayaquil, Calle Principal 123' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  direccion_proveedor?: string;

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

  // FLUJO AUTOMATICO DE RETENCION (2.2)
  @ApiPropertyOptional({
    type: [ImpuestoRetencionDto],
    description: 'Impuestos a retener (Flujo Automático). Si se envían, la API generará y autorizará una Retención simultáneamente a la liquidación.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImpuestoRetencionDto)
  @IsOptional()
  retenciones?: ImpuestoRetencionDto[];

  @ApiPropertyOptional({
    description: 'Clave de idempotencia (UUID)',
  })
  @IsUUID()
  @IsOptional()
  clave_idempotencia?: string;
}
