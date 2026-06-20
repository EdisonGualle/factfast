import { IsUUID, IsEnum, IsNumber, Min, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoMovimientoInventario } from '@prisma/client';

export class RegistrarMovimientoDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsUUID()
  @IsNotEmpty()
  producto_id: string;

  @ApiProperty({ description: 'ID de la bodega' })
  @IsUUID()
  @IsNotEmpty()
  bodega_id: string;

  @ApiProperty({ description: 'Tipo de movimiento de inventario', enum: TipoMovimientoInventario })
  @IsEnum(TipoMovimientoInventario, { message: 'Tipo de movimiento inválido' })
  @IsNotEmpty()
  tipo: TipoMovimientoInventario;

  @ApiProperty({ description: 'Cantidad a mover', example: 10 })
  @IsNumber()
  @Min(0.0001, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty()
  cantidad: number;

  @ApiProperty({ description: 'Costo unitario del movimiento', example: 5.50, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costo?: number;

  @ApiProperty({ description: 'Referencia de documento (factura, guia, etc.)', example: 'FAC-001-001-000000001', required: false })
  @IsString()
  @IsOptional()
  referencia?: string;

  @ApiProperty({ description: 'Nota explicativa del movimiento', example: 'Ajuste anual por inventario fisico', required: false })
  @IsString()
  @IsOptional()
  nota?: string;
}
