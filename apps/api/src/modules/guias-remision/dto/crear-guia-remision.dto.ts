import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  MaxLength,
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampoAdicionalDto } from '../../../common/dto/solicitud-comprobante.dto';

export class DetalleGuiaRemisionDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @MaxLength(25)
  codigo_principal: string;

  @ApiProperty({ example: 'Laptop Dell Inspiron' })
  @IsString()
  @MaxLength(300)
  descripcion: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  cantidad: number;
}

export class DestinatarioGuiaRemisionDto {
  @ApiProperty({
    example: '04',
    description: 'Tipo de identificacion del destinatario',
  })
  @IsString()
  tipo_identificacion_destinatario: string;

  @ApiProperty({ example: '0924383631001' })
  @IsString()
  @MaxLength(20)
  identificacion_destinatario: string;

  @ApiProperty({ example: 'EMPRESA DESTINO S.A.' })
  @IsString()
  @MaxLength(300)
  razon_social_destinatario: string;

  @ApiProperty({ example: 'Quito, Av. Amazonas 123' })
  @IsString()
  @MaxLength(300)
  direccion_destinatario: string;

  @ApiProperty({ description: 'Fecha de entrega (dd/MM/yyyy)' })
  @IsString()
  fecha_emision_sustento: string;

  @ApiProperty({
    description:
      'Clave de acceso del documento sustento relacionado al traslado',
  })
  @IsString()
  @MaxLength(49)
  clave_acceso_sustento: string;

  @ApiProperty({
    example: '01',
    description: 'Codigo del tipo de documento sustento',
  })
  @IsString()
  @MaxLength(2)
  codigo_documento_sustento: string;

  @ApiProperty({
    example: '001-001-000000001',
    description: 'Numero del documento sustento',
  })
  @IsString()
  @MaxLength(49)
  numero_documento_sustento: string;

  @ApiProperty({ type: [DetalleGuiaRemisionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleGuiaRemisionDto)
  detalles: DetalleGuiaRemisionDto[];
}

export class CrearGuiaRemisionDto {
  @ApiProperty({ description: 'UUID del punto de emision' })
  @IsUUID()
  punto_emision_id: string;

  @ApiProperty({ description: 'Fecha de inicio del traslado (dd/MM/yyyy)' })
  @IsString()
  fecha_inicio_transporte: string;

  @ApiProperty({ description: 'Fecha de fin del traslado (dd/MM/yyyy)' })
  @IsString()
  fecha_fin_transporte: string;

  @ApiProperty({
    example: '01',
    description: 'Codigo del motivo de traslado - catalogo SRI',
  })
  @IsString()
  @MaxLength(2)
  motivo_traslado: string;

  @ApiProperty({ example: 'Av. Principal 123, Guayaquil' })
  @IsString()
  @MaxLength(300)
  direccion_partida: string;

  @ApiProperty({
    example: '1712345678001',
    description: 'RUC o identificacion del transportista',
  })
  @IsString()
  @MaxLength(20)
  ruc_transportista: string;

  @ApiProperty({ example: 'TRANSPORTES XYZ' })
  @IsString()
  @MaxLength(300)
  razon_social_transportista: string;

  @ApiPropertyOptional({
    example: 'GUY-1234',
    description: 'Placa del vehiculo',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  placa?: string;

  @ApiProperty({ type: [DestinatarioGuiaRemisionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinatarioGuiaRemisionDto)
  destinatarios: DestinatarioGuiaRemisionDto[];

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
