import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MaxLength } from 'class-validator';

export class CrearPuntoEmisionDto {
  @ApiProperty({
    example: '001',
    description: 'Codigo de punto de emision SRI de exactamente 3 digitos',
  })
  @IsString()
  @Length(3, 3, {
    message: 'El codigo del punto de emision debe tener exactamente 3 digitos',
  })
  @Matches(/^\d{3}$/, {
    message: 'El codigo del punto de emision debe ser numerico',
  })
  codigo: string;

  @ApiProperty({
    example: 'Caja 1',
    description: 'Nombre interno del punto de emision',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  nombre: string;
}
