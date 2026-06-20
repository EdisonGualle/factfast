import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SubirCertificadoDto {
  @ApiProperty({
    description: 'Contrasena del archivo de certificado .p12',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  contrasena: string;
}
