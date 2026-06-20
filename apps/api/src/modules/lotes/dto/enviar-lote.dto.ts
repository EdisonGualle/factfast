import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class EnviarLoteDto {
  @ApiProperty({
    description: 'Lista de IDs de comprobantes (previamente firmados) que conformarán el lote',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '987e6543-e21b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  comprobante_ids: string[];
}
