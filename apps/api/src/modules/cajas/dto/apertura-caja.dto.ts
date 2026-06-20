import { IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AperturaCajaDto {
  @ApiProperty({ description: 'Monto inicial de apertura en efectivo', example: 50.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El monto de apertura no puede ser negativo' })
  @IsNotEmpty()
  monto_apertura: number;
}
