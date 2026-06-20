import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ description: 'ID de la empresa asociada' })
  @IsUUID()
  @IsNotEmpty()
  empresa_id: string;

  @ApiProperty({ description: 'Tipo de identificación según SRI (Tabla 6)', example: '05' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  tipo_identificacion: string;

  @ApiProperty({ description: 'Número de cédula, RUC, pasaporte', example: '1724567890' })
  @IsString()
  @IsNotEmpty()
  identificacion: string;

  @ApiProperty({ description: 'Nombre completo o Razón Social', example: 'Consuelo Alvear' })
  @IsString()
  @IsNotEmpty()
  razon_social: string;

  @ApiProperty({ description: 'Nombre comercial (si aplica)', example: 'Alvear Bakery', required: false })
  @IsString()
  @IsOptional()
  nombre_comercial?: string;

  @ApiProperty({ description: 'Correo electrónico para envío de facturas', example: 'consuelo@mail.com', required: false })
  @IsEmail()
  @IsOptional()
  correo?: string;

  @ApiProperty({ description: 'Número de teléfono', example: '0999999999', required: false })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ description: 'Dirección física', example: 'Av. Amazonas N24-100', required: false })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'Ciudad', example: 'Quito', required: false })
  @IsString()
  @IsOptional()
  ciudad?: string;

  @ApiProperty({ description: 'Determina si es Consumidor Final', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  es_consumidor_final?: boolean;
}
