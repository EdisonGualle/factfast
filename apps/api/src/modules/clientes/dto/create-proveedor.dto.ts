import { IsString, IsNotEmpty, IsOptional, IsEmail, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ description: 'ID de la empresa asociada' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({ description: 'Tipo de identificación según SRI (Tabla 6)', example: '04' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  tipo_identificacion: string;

  @ApiProperty({ description: 'Número de RUC, pasaporte', example: '1791234567001' })
  @IsString()
  @IsNotEmpty()
  identificacion: string;

  @ApiProperty({ description: 'Nombre completo o Razón Social', example: 'Distribuidora Alimentos Cia. Ltda.' })
  @IsString()
  @IsNotEmpty()
  razon_social: string;

  @ApiProperty({ description: 'Nombre comercial (si aplica)', example: 'Sabor Ideal', required: false })
  @IsString()
  @IsOptional()
  nombre_comercial?: string;

  @ApiProperty({ description: 'Correo electrónico de contacto', example: 'ventas@distribuidora.com', required: false })
  @IsEmail()
  @IsOptional()
  correo?: string;

  @ApiProperty({ description: 'Número de teléfono', example: '022345678', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ description: 'Dirección física', example: 'Av. 10 de Agosto N32-15', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;
}
