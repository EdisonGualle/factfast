import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampoAdicionalDto,
  TipoIdentificacionComprador,
} from '../../../common/dto/solicitud-comprobante.dto';

export class ImpuestoRetencionDto {
  @ApiProperty({
    example: '2',
    description: 'Codigo de impuesto: 1=Renta, 2=IVA, 6=ISD',
  })
  @IsString()
  codigo_impuesto: string;

  @ApiProperty({
    example: '303',
    description: 'Codigo de retencion - Tablas 18/19 SRI',
  })
  @IsString()
  @MaxLength(5)
  codigo_porcentaje: string;

  @ApiProperty({ example: 10, description: 'Porcentaje de retencion' })
  @IsNumber()
  @Min(0)
  tarifa: number;

  @ApiProperty({ example: 500.0, description: 'Base imponible' })
  @IsNumber()
  @Min(0)
  base_imponible: number;

  @ApiProperty({ example: 50.0, description: 'Valor retenido' })
  @IsNumber()
  @Min(0)
  valor: number;

  @ApiProperty({
    example: '001-001-000000001',
    description: 'Numero del documento sustento',
  })
  @IsString()
  @MaxLength(49)
  numero_documento_sustento: string;

  @ApiProperty({
    description: 'Fecha de emision del documento sustento (dd/MM/yyyy)',
  })
  @IsString()
  fecha_emision_sustento: string;

  @ApiProperty({
    example: '01',
    description: 'Codigo del tipo de documento sustento',
  })
  @IsString()
  @MaxLength(2)
  codigo_documento_sustento: string;
}

export class CrearRetencionDto {
  @ApiProperty({ description: 'UUID del punto de emision' })
  @IsUUID()
  punto_emision_id: string;

  @ApiProperty({
    enum: TipoIdentificacionComprador,
    description: 'Tipo de identificacion del sujeto retenido',
  })
  @IsEnum(TipoIdentificacionComprador)
  tipo_identificacion_sujeto_retenido: TipoIdentificacionComprador;

  @ApiProperty({
    example: '0924383631001',
    description: 'RUC o identificacion del sujeto retenido',
  })
  @IsString()
  @MaxLength(20)
  identificacion_sujeto_retenido: string;

  @ApiProperty({ example: 'PROVEEDOR XYZ S.A.' })
  @IsString()
  @MaxLength(300)
  razon_social_sujeto_retenido: string;

  @ApiPropertyOptional({ example: 'proveedor@email.com' })
  @IsString()
  @IsOptional()
  correo_sujeto_retenido?: string;

  @ApiProperty({ description: 'Periodo fiscal (MM/yyyy)' })
  @IsString()
  periodo_fiscal: string;

  @ApiProperty({ type: [ImpuestoRetencionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImpuestoRetencionDto)
  impuestos: ImpuestoRetencionDto[];

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
