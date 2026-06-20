import { ApiProperty } from '@nestjs/swagger';

export class RespuestaTokensDto {
  @ApiProperty({
    description: 'Token de acceso JWT (vigencia: 15 minutos)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token_acceso: string;

  @ApiProperty({
    description: 'Token de refresco JWT (vigencia: 7 dias)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token_refresh: string;
}

export class RespuestaRegistroDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  correo: string;

  @ApiProperty({ example: 'Juan Perez' })
  nombre_completo: string;

  @ApiProperty({ example: 'ADMIN', enum: ['SUPERADMIN', 'ADMIN', 'USUARIO'] })
  rol: string;
}
