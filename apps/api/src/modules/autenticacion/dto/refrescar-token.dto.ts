import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefrescarTokenDto {
  @ApiProperty({
    description: 'Token de refresco JWT emitido al iniciar sesion',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token_refresh: string;
}
