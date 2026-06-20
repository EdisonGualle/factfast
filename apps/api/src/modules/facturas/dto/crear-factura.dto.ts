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

export class CrearFacturaDto {
  @ApiProperty({ description: 'UUID del punto de emision' })
  @IsUUID()
  punto_emision_id: string;

  @ApiProperty({
    enum: TipoIdentificacionComprador,
    example: TipoIdentificacionComprador.CEDULA,
  })
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

  @ApiPropertyOptional({ example: 'cliente@email.com' })
  @IsEmail()
  @IsOptional()
  correo_comprador?: string;

  @ApiPropertyOptional({ example: 'Guayaquil, Calle Principal 123' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  direccion_comprador?: string;

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

  @ApiPropertyOptional({
    description:
      'Clave de idempotencia (UUID) para evitar comprobantes duplicados en reintentos',
  })
  @IsUUID()
  @IsOptional()
  clave_idempotencia?: string;
}
