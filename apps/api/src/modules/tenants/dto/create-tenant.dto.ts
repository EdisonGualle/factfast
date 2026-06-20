import { IsString, IsNotEmpty, IsEmail, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ description: 'Nombre comercial del Tenant', example: 'Mi Negocio SA' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Slug único para URL', example: 'mi-negocio' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minusculas, numeros y guiones',
  })
  slug: string;

  @ApiProperty({ description: 'Correo del administrador fundador', example: 'admin@negocio.com' })
  @IsEmail()
  @IsNotEmpty()
  correoOwner: string;

  @ApiProperty({ description: 'Nombre completo del administrador fundador', example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  nombreOwner: string;

  @ApiProperty({ description: 'Contraseña del administrador fundador', example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 50, { message: 'La contraseña debe tener entre 8 y 50 caracteres' })
  contrasenaOwner: string;
}
