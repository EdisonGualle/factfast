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
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CampoAdicionalDto,
  TipoIdentificacionComprador,
} from '../../../common/dto/solicitud-comprobante.dto';

export class MotivoNotaDebitoDto {
  @ApiProperty({ example: 'Intereses por mora' })
  @IsString()
  @MaxLength(300)
  razon: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  valor: number;
}

export class ImpuestoNotaDebitoDto {
  @ApiProperty({ example: '2' })
  @IsString()
  codigo_impuesto: string;

  @ApiProperty({ example: '4' })
  @IsString()
  codigo_porcentaje: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  tarifa: number;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  base_imponible: number;

  @ApiProperty({ example: 1.575 })
  @IsNumber()
  @Min(0)
  valor: number;
}

export class CrearNotaDebitoDto {
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

  @ApiProperty({
    description: 'Fecha de emision de la factura original (dd/MM/yyyy)',
  })
  @IsString()
  fecha_emision_documento_modificado: string;

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

  @ApiProperty({
    type: [MotivoNotaDebitoDto],
    description: 'Motivos y valores de la nota de debito',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MotivoNotaDebitoDto)
  motivos: MotivoNotaDebitoDto[];

  @ApiProperty({ type: [ImpuestoNotaDebitoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImpuestoNotaDebitoDto)
  impuestos: ImpuestoNotaDebitoDto[];

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
