import { IsNumber, Min, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CierreCajaDto {
  @ApiProperty({ description: 'Monto de dinero real contado al cerrar la caja', example: 120.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El monto de cierre no puede ser negativo' })
  @IsNotEmpty()
  monto_cierre: number;

  @ApiProperty({ description: 'Observación o notas sobre el cuadre', example: 'Sin novedades. Cuadre exacto.' })
  @IsString()
  @IsOptional()
  observacion?: string;
}
