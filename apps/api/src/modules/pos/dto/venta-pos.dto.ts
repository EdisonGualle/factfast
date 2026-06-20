import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested, IsNumber, Min, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LineaVentaPosDto {
  @ApiProperty({ description: 'ID del producto a vender' })
  @IsUUID()
  @IsNotEmpty()
  producto_id: string;

  @ApiProperty({ description: 'Cantidad vendida', example: 2 })
  @IsNumber()
  @Min(0.0001, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty()
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario cobrado (sin impuestos)', example: 1.50 })
  @IsNumber()
  @Min(0, { message: 'El precio unitario no puede ser negativo' })
  @IsNotEmpty()
  precio_unitario: number;

  @ApiProperty({ description: 'Descuento total aplicado a la línea', example: 0.10, default: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  descuento?: number;
}

export class FormaPagoPosDto {
  @ApiProperty({ description: 'Código SRI de la forma de pago (Tabla 24)', example: '01' })
  @IsString()
  @IsNotEmpty()
  forma_pago: string;

  @ApiProperty({ description: 'Monto total pagado con este método', example: 10.00 })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty()
  total: number;

  @ApiProperty({ description: 'Plazo (si es a crédito)', example: 30, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  plazo?: number;

  @ApiProperty({ description: 'Unidad de tiempo del plazo', example: 'dias', required: false })
  @IsString()
  @IsOptional()
  unidad_tiempo?: string;
}

export class VentaPosDto {
  @ApiProperty({ description: 'ID de la caja desde donde se realiza la venta' })
  @IsUUID()
  @IsNotEmpty()
  caja_id: string;

  @ApiProperty({ description: 'ID de la bodega de donde descontar stock' })
  @IsUUID()
  @IsNotEmpty()
  bodega_id: string;

  @ApiProperty({ description: 'ID del cliente (Consumidor Final o registrado)' })
  @IsUUID()
  @IsNotEmpty()
  cliente_id: string;

  @ApiProperty({ description: 'Líneas de detalle de la venta', type: [LineaVentaPosDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe contener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => LineaVentaPosDto)
  lineas: LineaVentaPosDto[];

  @ApiProperty({ description: 'Formas de pago de la venta', type: [FormaPagoPosDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe especificar al menos una forma de pago' })
  @ValidateNested({ each: true })
  @Type(() => FormaPagoPosDto)
  formas_pago: FormaPagoPosDto[];

  @ApiProperty({ description: 'Clave de idempotencia para evitar duplicados', required: false })
  @IsString()
  @IsOptional()
  clave_idempotencia?: string;
}
