import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class AnularFacturaDto {
  @ApiProperty({
    description: 'Motivo de la anulación (se registrará en la nota de crédito)',
    example: 'Anulación por error en los datos de la factura',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  motivo: string;
}
