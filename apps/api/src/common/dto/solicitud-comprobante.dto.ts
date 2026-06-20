import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoIdentificacionComprador {
  RUC = '04',
  CEDULA = '05',
  PASAPORTE = '06',
  CONSUMIDOR_FINAL = '07',
  EXTERIOR = '08',
}

export class ImpuestoLineaDto {
  @ApiProperty({
    example: '2',
    description: 'Codigo de impuesto: 2=IVA, 3=ICE, 5=IRBPNR',
  })
  @IsString()
  codigo_impuesto: string;

  @ApiProperty({ example: '4', description: 'Codigo de tarifa - Tabla 17 SRI' })
  @IsString()
  codigo_porcentaje: string;

  @ApiProperty({ example: 15, description: 'Tarifa del impuesto. Enviar 0 para auto-calcular.' })
  @IsNumber()
  @Min(0)
  tarifa: number;

  @ApiProperty({ example: 100.0, description: 'Base imponible. Enviar 0 para auto-calcular.' })
  @IsNumber()
  @Min(0)
  base_imponible: number;

  @ApiProperty({ example: 15.0, description: 'Valor del impuesto. Enviar 0 para auto-calcular.' })
  @IsNumber()
  @Min(0)
  valor: number;
}

export class LineaComprobanteDto {
  @ApiPropertyOptional({ example: 'PROD-001' })
  @IsString()
  @IsOptional()
  @MaxLength(25)
  codigo_principal?: string;

  @ApiPropertyOptional({ example: 'AUX-001' })
  @IsString()
  @IsOptional()
  @MaxLength(25)
  codigo_auxiliar?: string;

  @ApiProperty({ example: 'Laptop Dell Inspiron 15' })
  @IsString()
  @MaxLength(300)
  descripcion: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @IsPositive()
  precio_unitario: number;

  @ApiProperty({ example: 0, default: 0 })
  @IsNumber()
  @Min(0)
  descuento: number;

  @ApiProperty({ type: [ImpuestoLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImpuestoLineaDto)
  impuestos: ImpuestoLineaDto[];
}

export class FormaPagoDto {
  @ApiProperty({ example: '01', description: 'Forma de pago - Tabla 24 SRI' })
  @IsString()
  forma_pago: string;

  @ApiProperty({ example: 115.0 })
  @IsNumber()
  @IsPositive()
  total: number;

  @ApiPropertyOptional({ example: 30, description: 'Plazo de credito en dias' })
  @IsNumber()
  @IsOptional()
  plazo?: number;

  @ApiPropertyOptional({ example: 'dias' })
  @IsString()
  @IsOptional()
  unidad_tiempo?: string;
}

export class CampoAdicionalDto {
  @ApiProperty({ example: 'Numero de contrato' })
  @IsString()
  @MaxLength(300)
  nombre: string;

  @ApiProperty({ example: 'CONT-2026-001' })
  @IsString()
  @MaxLength(300)
  valor: string;
}
