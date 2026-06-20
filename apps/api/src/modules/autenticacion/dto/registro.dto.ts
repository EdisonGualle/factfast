import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegistroDto {
  @ApiProperty({
    example: 'admin@empresa.com',
    description: 'Correo electronico del nuevo usuario',
    maxLength: 150,
  })
  @IsEmail({}, { message: 'El correo no tiene un formato valido' })
  @MaxLength(150)
  correo: string;

  @ApiProperty({
    example: 'MiContrasena123!',
    description:
      'Contrasena inicial. Minimo 8 caracteres, debe incluir al menos una mayuscula, una minuscula y un numero.',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contrasena debe contener al menos una mayuscula, una minuscula y un numero',
  })
  contrasena: string;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nombre_completo: string;
}
