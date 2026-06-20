import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoProducto } from '@prisma/client';

export class CreateProductoDto {
  @ApiProperty({ description: 'ID de la empresa asociada' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({ description: 'ID de la categoría (opcional)', required: false })
  @IsUUID()
  @IsOptional()
  categoria_id?: string;

  @ApiProperty({ description: 'Código interno del producto', example: 'PROD-001', required: false })
  @IsString()
  @IsOptional()
  codigo?: string;

  @ApiProperty({ description: 'Código de barras', example: '7861234567890', required: false })
  @IsString()
  @IsOptional()
  codigo_barras?: string;

  @ApiProperty({ description: 'Nombre del producto', example: 'Café Expreso Doble' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Descripción o notas', example: 'Café negro concentrado sin azúcar', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Tipo de ítem (PRODUCTO = descuenta stock, SERVICIO = no descuenta)', enum: TipoProducto, default: TipoProducto.PRODUCTO })
  @IsEnum(TipoProducto)
  @IsNotEmpty()
  tipo: TipoProducto;

  @ApiProperty({ description: 'Precio de venta al público (sin impuestos)', example: 2.50 })
  @IsNumber()
  @Min(0, { message: 'El precio de venta no puede ser negativo' })
  @IsNotEmpty()
  precio_venta: number;

  @ApiProperty({ description: 'Precio de costo o de compra', example: 0.80, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_costo?: number;

  @ApiProperty({
    description: 'Código de tarifa de IVA (SRI Tabla 17): 4=15%, 0=0%, 5=5%, 6=No Objeto, 7=Exento',
    example: 4,
    default: 4
  })
  @IsInt()
  @IsNotEmpty()
  codigo_tarifa_iva: number;

  @ApiProperty({ description: 'Stock mínimo para alertas', example: 5, default: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock_minimo?: number;
}
