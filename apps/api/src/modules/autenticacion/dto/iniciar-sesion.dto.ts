import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class IniciarSesionDto {
  @ApiProperty({
    example: 'admin@empresa.com',
    description: 'Correo electronico del usuario',
    maxLength: 150,
  })
  @IsEmail({}, { message: 'El correo no tiene un formato valido' })
  @MaxLength(150)
  correo: string;

  @ApiProperty({
    example: 'MiContrasena123!',
    description: 'Contrasena del usuario',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  @MaxLength(100)
  contrasena: string;
}
