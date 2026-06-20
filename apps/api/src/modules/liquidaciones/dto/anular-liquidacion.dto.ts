import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AnularLiquidacionDto {
  @ApiProperty({
    description: 'Motivo de la anulación para la Nota de Crédito',
    example: 'Error en cálculo de impuestos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  motivo: string;
}
